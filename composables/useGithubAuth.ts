import { onMounted, onUnmounted, ref } from 'vue';
import type { GithubAuthState, GithubUser } from '@/components/newtab/types';

type Notify = (message: string, duration?: number) => void;

interface StoredGithubSession {
  accessToken: string;
  user: GithubUser;
}

interface GithubApiUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
}

interface DeviceCodeResponse {
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  expires_in?: number;
  interval?: number;
  error?: string;
  error_description?: string;
}

interface AccessTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  interval?: number;
}

const githubClientId = (import.meta.env.WXT_GITHUB_CLIENT_ID ?? '').trim();
const githubSessionKey = 'xtab-github-session';
const githubApiVersion = '2026-03-10';

function asGithubUser(user: GithubApiUser): GithubUser {
  return {
    id: user.id,
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
  };
}

function waitForNextPoll(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('GitHub authorization cancelled.', 'AbortError'));
    }, { once: true });
  });
}

async function restrictSessionStorageAccess() {
  const localArea = browser.storage.local as typeof browser.storage.local & {
    setAccessLevel?: (options: { accessLevel: 'TRUSTED_CONTEXTS' }) => Promise<void>;
  };
  await localArea.setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' });
}

async function fetchGithubUser(accessToken: string) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': githubApiVersion,
    },
  });

  if (!response.ok) throw new Error('GitHub 登录已失效，请重新登录。');
  return asGithubUser(await response.json() as GithubApiUser);
}

async function requestDeviceCode(signal: AbortSignal) {
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ client_id: githubClientId }),
    signal,
  });
  const payload = await response.json() as DeviceCodeResponse;

  if (
    !response.ok
    || payload.error
    || !payload.device_code
    || !payload.user_code
    || !payload.verification_uri
    || !payload.expires_in
  ) {
    throw new Error(payload.error_description || '无法开始 GitHub 登录，请检查 Client ID 与 Device Flow 配置。');
  }

  return {
    deviceCode: payload.device_code,
    userCode: payload.user_code,
    verificationUri: payload.verification_uri,
    expiresIn: payload.expires_in,
    interval: Math.max(payload.interval ?? 5, 5),
  };
}

async function pollForAccessToken(
  deviceCode: string,
  expiresIn: number,
  initialInterval: number,
  signal: AbortSignal,
) {
  const expiresAt = Date.now() + expiresIn * 1000;
  let interval = initialInterval;

  while (Date.now() < expiresAt) {
    await waitForNextPoll(interval * 1000, signal);

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: githubClientId,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
      signal,
    });
    const payload = await response.json() as AccessTokenResponse;

    if (payload.access_token) return payload.access_token;
    if (payload.error === 'authorization_pending') continue;
    if (payload.error === 'slow_down') {
      interval += payload.interval ?? 5;
      continue;
    }
    if (payload.error === 'access_denied') throw new Error('你已取消 GitHub 授权。');
    if (payload.error === 'expired_token') throw new Error('GitHub 授权码已过期，请重新登录。');
    throw new Error(payload.error_description || 'GitHub 授权失败，请稍后重试。');
  }

  throw new Error('GitHub 授权码已过期，请重新登录。');
}

export function useGithubAuth(notify: Notify) {
  const githubUser = ref<GithubUser | null>(null);
  const githubAuthState = ref<GithubAuthState>('signed-out');
  let authorizationController: AbortController | null = null;

  async function clearStoredSession() {
    try {
      await browser.storage.local.remove(githubSessionKey);
    } catch {
      // Storage is unavailable in a plain browser preview.
    }
  }

  async function restoreGithubSession() {
    try {
      await restrictSessionStorageAccess();
      const stored = await browser.storage.local.get(githubSessionKey);
      const session = stored[githubSessionKey] as StoredGithubSession | undefined;
      if (!session?.accessToken || !session.user) return;

      githubUser.value = session.user;
      githubAuthState.value = 'signed-in';
      const currentUser = await fetchGithubUser(session.accessToken);
      githubUser.value = currentUser;
      await browser.storage.local.set({
        [githubSessionKey]: { accessToken: session.accessToken, user: currentUser },
      });
    } catch {
      githubUser.value = null;
      githubAuthState.value = 'signed-out';
      await clearStoredSession();
    }
  }

  async function connectGithub() {
    if (githubAuthState.value === 'authorizing') return;
    if (!githubClientId) {
      notify('请先在 .env.local 配置 WXT_GITHUB_CLIENT_ID，并在 GitHub App 中启用 Device Flow。', 7000);
      return;
    }

    authorizationController?.abort();
    authorizationController = new AbortController();
    githubAuthState.value = 'authorizing';

    try {
      const device = await requestDeviceCode(authorizationController.signal);
      let copied = false;
      try {
        await navigator.clipboard.writeText(device.userCode);
        copied = true;
      } catch {
        // The visible notice still exposes the code if clipboard access is denied.
      }

      notify(
        copied
          ? `GitHub 授权码 ${device.userCode} 已复制，请在打开的页面中粘贴并确认。`
          : `请在 GitHub 输入授权码 ${device.userCode} 并确认。`,
        20000,
      );

      try {
        await browser.tabs.create({ url: device.verificationUri });
      } catch {
        window.open(device.verificationUri, '_blank', 'noopener,noreferrer');
      }

      const accessToken = await pollForAccessToken(
        device.deviceCode,
        device.expiresIn,
        device.interval,
        authorizationController.signal,
      );
      const user = await fetchGithubUser(accessToken);

      await restrictSessionStorageAccess();
      await browser.storage.local.set({
        [githubSessionKey]: { accessToken, user },
      });
      githubUser.value = user;
      githubAuthState.value = 'signed-in';
      notify(`已连接 GitHub：@${user.login}`, 5000);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      githubUser.value = null;
      githubAuthState.value = 'signed-out';
      notify(error instanceof Error ? error.message : 'GitHub 授权失败，请稍后重试。', 7000);
    } finally {
      authorizationController = null;
      if (!githubUser.value) githubAuthState.value = 'signed-out';
    }
  }

  onMounted(restoreGithubSession);
  onUnmounted(() => authorizationController?.abort());

  return {
    githubUser,
    githubAuthState,
    connectGithub,
  };
}

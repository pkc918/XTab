import { computed, onMounted, onUnmounted, readonly, ref } from 'vue';
import type { GithubAuthState, GithubUser } from '@/components/newtab/types';

export type GithubAuthNotify = (message: string, duration?: number) => void;

export interface UseGithubAuthOptions {
  clientId?: string;
  scopes?: readonly string[];
  notify?: GithubAuthNotify;
  autoRestore?: boolean;
  openVerificationPage?: (url: string) => void | Promise<void>;
}

export interface GithubDeviceAuthorization {
  userCode: string;
  verificationUri: string;
  expiresAt: string;
}

interface StoredGithubSession {
  accessToken: string;
  tokenType?: string;
  scope?: string;
  user: GithubUser;
  createdAt?: string;
}

interface GithubApiUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
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
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  interval?: number;
}

const configuredGithubClientId = (import.meta.env.WXT_GITHUB_CLIENT_ID ?? '').trim();
const githubSessionKey = 'xtab-github-session';
const githubApiVersion = '2026-03-10';
const githubApiOrigin = 'https://api.github.com';

class GithubApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GithubApiError';
    this.status = status;
  }
}

function asGithubUser(user: GithubApiUser): GithubUser {
  return {
    id: user.id,
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    bio: user.bio ?? null,
    company: user.company ?? null,
    location: user.location ?? null,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
  };
}

function isGithubUser(value: unknown): value is GithubUser {
  if (typeof value !== 'object' || value === null) return false;
  const user = value as Partial<GithubUser>;
  return typeof user.id === 'number'
    && typeof user.login === 'string'
    && typeof user.avatarUrl === 'string'
    && typeof user.profileUrl === 'string';
}

function isStoredGithubSession(value: unknown): value is StoredGithubSession {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Partial<StoredGithubSession>;
  return typeof session.accessToken === 'string'
    && session.accessToken.length > 0
    && isGithubUser(session.user);
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function waitForNextPoll(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('GitHub authorization cancelled.', 'AbortError'));
      return;
    }
    const handleAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('GitHub authorization cancelled.', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

async function restrictSessionStorageAccess() {
  const localArea = browser.storage.local as typeof browser.storage.local & {
    setAccessLevel?: (options: { accessLevel: 'TRUSTED_CONTEXTS' }) => Promise<void>;
  };
  await localArea.setAccessLevel?.({ accessLevel: 'TRUSTED_CONTEXTS' });
}

async function responseJson<T>(response: Response) {
  try {
    return await response.json() as T;
  } catch {
    throw new Error(`GitHub 返回了无法解析的响应（HTTP ${response.status}）。`);
  }
}

async function fetchGithubUser(accessToken: string, signal?: AbortSignal) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': githubApiVersion,
    },
    signal,
  });

  if (!response.ok) {
    const message = response.status === 401
      ? 'GitHub 登录已失效，请重新登录。'
      : `无法读取 GitHub 用户信息（HTTP ${response.status}）。`;
    throw new GithubApiError(response.status, message);
  }
  return asGithubUser(await responseJson<GithubApiUser>(response));
}

async function requestDeviceCode(
  clientId: string,
  scopes: readonly string[],
  signal: AbortSignal,
) {
  const body = new URLSearchParams({ client_id: clientId });
  if (scopes.length > 0) body.set('scope', scopes.join(' '));

  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal,
  });
  const payload = await responseJson<DeviceCodeResponse>(response);

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
  clientId: string,
  deviceCode: string,
  expiresIn: number,
  initialInterval: number,
  signal: AbortSignal,
) {
  const expiresAt = Date.now() + expiresIn * 1_000;
  let interval = initialInterval;

  while (Date.now() < expiresAt) {
    await waitForNextPoll(interval * 1_000, signal);

    let response: Response;
    try {
      response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
        signal,
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      if (Date.now() < expiresAt) continue;
      throw error;
    }

    if (response.status >= 500) continue;
    if (response.status === 429) {
      interval += 5;
      continue;
    }

    const payload = await responseJson<AccessTokenResponse>(response);
    if (payload.access_token) {
      return {
        accessToken: payload.access_token,
        tokenType: payload.token_type || 'bearer',
        scope: payload.scope || '',
      };
    }
    if (payload.error === 'authorization_pending') continue;
    if (payload.error === 'slow_down') {
      interval = Math.max(interval + 5, payload.interval ?? 0);
      continue;
    }
    if (payload.error === 'access_denied') throw new Error('你已取消 GitHub 授权。');
    if (payload.error === 'expired_token' || payload.error === 'token_expired') {
      throw new Error('GitHub 授权码已过期，请重新登录。');
    }
    throw new Error(payload.error_description || `GitHub 授权失败${payload.error ? `：${payload.error}` : '，请稍后重试。'}`);
  }

  throw new Error('GitHub 授权码已过期，请重新登录。');
}

async function defaultOpenVerificationPage(url: string) {
  try {
    await browser.tabs.create({ url });
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function normalizeOptions(optionsOrNotify?: UseGithubAuthOptions | GithubAuthNotify): UseGithubAuthOptions {
  if (typeof optionsOrNotify === 'function') return { notify: optionsOrNotify };
  return optionsOrNotify ?? {};
}

function parseScopes(value?: string) {
  return [...new Set((value ?? '').split(/[\s,]+/).map((scope) => scope.trim()).filter(Boolean))];
}

/**
 * GitHub OAuth Device Flow for an extension/public client. The access token stays private
 * inside this composable and is persisted only in extension-local trusted storage.
 */
export function useGithubAuth(optionsOrNotify?: UseGithubAuthOptions | GithubAuthNotify) {
  const options = normalizeOptions(optionsOrNotify);
  const clientId = (options.clientId ?? configuredGithubClientId).trim();
  const scopes = [...new Set((options.scopes ?? []).map((scope) => scope.trim()).filter(Boolean))];
  const notify = options.notify ?? (() => undefined);
  const openVerificationPage = options.openVerificationPage ?? defaultOpenVerificationPage;
  const githubUser = ref<GithubUser | null>(null);
  const githubAuthState = ref<GithubAuthState>('signed-out');
  const authError = ref<string | null>(null);
  const deviceAuthorization = ref<GithubDeviceAuthorization | null>(null);
  const grantedScopes = ref<string[]>([]);
  let accessToken: string | null = null;
  let authorizationController: AbortController | null = null;
  let restorePromise: Promise<void> | null = null;

  async function clearStoredSession() {
    try {
      await browser.storage.local.remove(githubSessionKey);
    } catch {
      // Storage is unavailable in a plain browser preview.
    }
  }

  async function persistSession(session: StoredGithubSession) {
    await restrictSessionStorageAccess();
    await browser.storage.local.set({ [githubSessionKey]: session });
  }

  async function restoreGithubSession() {
    if (restorePromise) return restorePromise;
    restorePromise = (async () => {
      let session: StoredGithubSession;
      try {
        await restrictSessionStorageAccess();
        const stored = await browser.storage.local.get(githubSessionKey);
        const candidate = stored[githubSessionKey];
        if (!isStoredGithubSession(candidate)) return;
        session = candidate;
      } catch {
        return;
      }

      accessToken = session.accessToken;
      grantedScopes.value = parseScopes(session.scope);
      githubUser.value = session.user;
      githubAuthState.value = 'signed-in';

      try {
        const currentUser = await fetchGithubUser(session.accessToken);
        githubUser.value = currentUser;
        await persistSession({ ...session, user: currentUser });
      } catch (error) {
        if (error instanceof GithubApiError && error.status === 401) {
          accessToken = null;
          grantedScopes.value = [];
          githubUser.value = null;
          githubAuthState.value = 'signed-out';
          await clearStoredSession();
        }
        // On an offline/transient failure the cached identity remains usable.
      }
    })().finally(() => {
      restorePromise = null;
    });
    return restorePromise;
  }

  function cancelGithubAuthorization() {
    authorizationController?.abort();
    authorizationController = null;
    deviceAuthorization.value = null;
    githubAuthState.value = githubUser.value ? 'signed-in' : 'signed-out';
  }

  async function copyGithubDeviceCode() {
    const authorization = deviceAuthorization.value;
    if (!authorization) {
      notify('当前没有可用的 GitHub 授权码，请重新登录。', 4_000);
      return false;
    }

    try {
      await navigator.clipboard.writeText(authorization.userCode);
      notify(`授权码 ${authorization.userCode} 已复制。`, 4_000);
      return true;
    } catch {
      notify('无法自动复制，请选中授权码后手动复制。', 5_000);
      return false;
    }
  }

  async function openGithubVerificationPage() {
    const authorization = deviceAuthorization.value;
    if (!authorization) {
      notify('GitHub 授权码已失效，请重新登录。', 4_000);
      return false;
    }

    try {
      await openVerificationPage(authorization.verificationUri);
      return true;
    } catch {
      notify('无法打开 GitHub 授权页，请稍后重试。', 5_000);
      return false;
    }
  }

  async function connectGithub() {
    if (githubAuthState.value === 'authorizing') return;
    if (!clientId) {
      const message = '请先在 .env.local 配置 WXT_GITHUB_CLIENT_ID，并在 GitHub App 中启用 Device Flow。';
      authError.value = message;
      notify(message, 7_000);
      return;
    }

    const previousUser = githubUser.value;
    authorizationController?.abort();
    const controller = new AbortController();
    authorizationController = controller;
    githubAuthState.value = 'authorizing';
    authError.value = null;

    try {
      const device = await requestDeviceCode(clientId, scopes, controller.signal);
      deviceAuthorization.value = {
        userCode: device.userCode,
        verificationUri: device.verificationUri,
        expiresAt: new Date(Date.now() + device.expiresIn * 1_000).toISOString(),
      };

      let copied = false;
      try {
        await navigator.clipboard.writeText(device.userCode);
        copied = true;
      } catch {
        // The visible notice and deviceAuthorization still expose the code.
      }

      notify(
        copied
          ? `GitHub 授权码 ${device.userCode} 已复制，请确认后前往 GitHub。`
          : `GitHub 授权码 ${device.userCode} 已生成，请在弹窗中复制。`,
        10_000,
      );

      const token = await pollForAccessToken(
        clientId,
        device.deviceCode,
        device.expiresIn,
        device.interval,
        controller.signal,
      );
      const user = await fetchGithubUser(token.accessToken, controller.signal);
      const session: StoredGithubSession = {
        accessToken: token.accessToken,
        tokenType: token.tokenType,
        scope: token.scope,
        user,
        createdAt: new Date().toISOString(),
      };
      await persistSession(session);

      accessToken = token.accessToken;
      grantedScopes.value = parseScopes(token.scope);
      githubUser.value = user;
      githubAuthState.value = 'signed-in';
      notify(`已连接 GitHub：@${user.login}`, 5_000);
    } catch (error) {
      if (isAbortError(error)) return;
      const message = error instanceof Error ? error.message : 'GitHub 授权失败，请稍后重试。';
      authError.value = message;
      githubUser.value = previousUser;
      githubAuthState.value = previousUser ? 'signed-in' : 'signed-out';
      notify(message, 7_000);
    } finally {
      if (authorizationController === controller) authorizationController = null;
      deviceAuthorization.value = null;
      if (githubAuthState.value === 'authorizing') {
        githubAuthState.value = githubUser.value ? 'signed-in' : 'signed-out';
      }
    }
  }

  async function disconnectGithub() {
    cancelGithubAuthorization();
    accessToken = null;
    grantedScopes.value = [];
    githubUser.value = null;
    githubAuthState.value = 'signed-out';
    authError.value = null;
    await clearStoredSession();
    notify('已在此设备断开 GitHub。', 4_000);
  }

  async function githubFetch(path: string | URL, init: RequestInit = {}) {
    if (!accessToken) throw new Error('请先登录 GitHub。');
    const url = new URL(path.toString(), `${githubApiOrigin}/`);
    if (url.origin !== githubApiOrigin) {
      throw new Error('为避免泄露访问令牌，GitHub 授权请求只能发送到 api.github.com。');
    }

    const headers = new Headers(init.headers);
    headers.set('Accept', headers.get('Accept') || 'application/vnd.github+json');
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('X-GitHub-Api-Version', githubApiVersion);
    return fetch(url, { ...init, headers });
  }

  onMounted(() => {
    if (options.autoRestore !== false) void restoreGithubSession();
  });
  onUnmounted(cancelGithubAuthorization);

  return {
    githubUser: readonly(githubUser),
    githubAuthState: readonly(githubAuthState),
    authError: readonly(authError),
    deviceAuthorization: readonly(deviceAuthorization),
    grantedScopes: readonly(grantedScopes),
    isConfigured: computed(() => Boolean(clientId)),
    isAuthenticated: computed(() => Boolean(accessToken && githubUser.value)),
    connectGithub,
    restoreGithubSession,
    cancelGithubAuthorization,
    copyGithubDeviceCode,
    openGithubVerificationPage,
    disconnectGithub,
    githubFetch,
    // Concise aliases make the composable convenient outside the existing XTab UI.
    user: readonly(githubUser),
    state: readonly(githubAuthState),
    connect: connectGithub,
    disconnect: disconnectGithub,
    apiFetch: githubFetch,
    cancel: cancelGithubAuthorization,
  };
}

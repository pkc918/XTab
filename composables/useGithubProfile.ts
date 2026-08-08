import { onUnmounted, readonly, ref, watch, type Ref } from 'vue';
import type {
  GithubActivity,
  GithubContributionDay,
  GithubContributionLevel,
  GithubUser,
} from '@/components/newtab/types';

type GithubApiFetch = (path: string | URL, init?: RequestInit) => Promise<Response>;

interface ContributionCalendarDayResponse {
  contributionCount: number;
  contributionLevel: string;
  date: string;
  weekday: number;
}

interface ContributionCalendarWeekResponse {
  contributionDays: ContributionCalendarDayResponse[];
}

interface ContributionGraphqlResponse {
  data?: {
    viewer?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions: number;
          weeks: ContributionCalendarWeekResponse[];
        };
      };
    };
  };
  errors?: Array<{ message?: string }>;
}

interface GithubEventResponse {
  id: string;
  type: string;
  repo: { name: string };
  payload?: Record<string, unknown>;
  created_at: string;
}

const contributionQuery = `
  query XTabContributionCalendar($from: DateTime!, $to: DateTime!) {
    viewer {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              contributionLevel
              date
              weekday
            }
          }
        }
      }
    }
  }
`;

const contributionLevelMap: Record<string, GithubContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};
const contributionWeekCount = 14;

function recentThreeMonthRange() {
  const to = new Date();
  const from = new Date(to);
  const originalDay = from.getUTCDate();
  from.setUTCDate(1);
  from.setUTCMonth(from.getUTCMonth() - 3);
  const lastDayInTargetMonth = new Date(Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth() + 1,
    0,
  )).getUTCDate();
  from.setUTCDate(Math.min(originalDay, lastDayInTargetMonth));
  return { from: from.toISOString(), to: to.toISOString() };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

async function jsonResponse<T>(response: Response, label: string) {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`${label}返回了无法解析的数据。`);
  }

  if (!response.ok) {
    const message = asString(asRecord(payload).message);
    throw new Error(message || `${label}失败（HTTP ${response.status}）。`);
  }
  return payload as T;
}

async function fetchContributions(githubFetch: GithubApiFetch, signal: AbortSignal) {
  const variables = recentThreeMonthRange();
  const response = await githubFetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: contributionQuery, variables }),
    signal,
  });
  const payload = await jsonResponse<ContributionGraphqlResponse>(response, '读取 GitHub 贡献记录');
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || 'GitHub 无法返回贡献记录。');
  }

  const calendar = payload.data?.viewer?.contributionsCollection?.contributionCalendar;
  if (!calendar || !Array.isArray(calendar.weeks)) {
    throw new Error('GitHub 贡献记录格式不完整。');
  }

  const weeks = calendar.weeks.slice(-contributionWeekCount);
  const weekOffset = contributionWeekCount - weeks.length;
  const days = weeks.flatMap((week, weekIndex) => week.contributionDays.map((day) => ({
    date: day.date,
    count: day.contributionCount,
    level: contributionLevelMap[day.contributionLevel] ?? 0,
    week: weekIndex + weekOffset,
    weekday: Math.min(6, Math.max(0, day.weekday)),
  } satisfies GithubContributionDay)));

  return {
    days,
    total: calendar.totalContributions,
  };
}

function pullRequestActivity(event: GithubEventResponse, payload: Record<string, unknown>) {
  const pullRequest = asRecord(payload.pull_request);
  const action = asString(payload.action);
  const actionLabel: Record<string, string> = {
    opened: '创建了',
    closed: '关闭了',
    reopened: '重新打开了',
    synchronize: '更新了',
  };
  return {
    action: `在 ${event.repo.name} ${actionLabel[action] || '更新了'} Pull Request`,
    subject: asString(pullRequest.title) || event.repo.name,
    url: asString(pullRequest.html_url) || `https://github.com/${event.repo.name}`,
  };
}

function issueActivity(event: GithubEventResponse, payload: Record<string, unknown>) {
  const issue = asRecord(payload.issue);
  const action = asString(payload.action);
  const actionLabel: Record<string, string> = {
    opened: '创建了',
    closed: '关闭了',
    reopened: '重新打开了',
  };
  return {
    action: `在 ${event.repo.name} ${actionLabel[action] || '更新了'} Issue`,
    subject: asString(issue.title) || event.repo.name,
    url: asString(issue.html_url) || `https://github.com/${event.repo.name}`,
  };
}

function eventActivity(event: GithubEventResponse): GithubActivity {
  const payload = asRecord(event.payload);
  const repositoryUrl = `https://github.com/${event.repo.name}`;
  let action = `在 ${event.repo.name} 产生了新动态`;
  let subject = event.repo.name;
  let url = repositoryUrl;

  if (event.type === 'PushEvent') {
    const commits = Array.isArray(payload.commits) ? payload.commits : [];
    const commitCount = asNumber(payload.size) || commits.length;
    const firstCommit = asRecord(commits[0]);
    const branch = asString(payload.ref).replace('refs/heads/', '');
    action = `向 ${event.repo.name} 推送了 ${commitCount || 1} 个提交`;
    subject = asString(firstCommit.message) || branch || event.repo.name;
  } else if (event.type === 'PullRequestEvent') {
    ({ action, subject, url } = pullRequestActivity(event, payload));
  } else if (event.type === 'IssuesEvent') {
    ({ action, subject, url } = issueActivity(event, payload));
  } else if (event.type === 'IssueCommentEvent') {
    const issue = asRecord(payload.issue);
    const comment = asRecord(payload.comment);
    action = `评论了 ${event.repo.name} 的 Issue`;
    subject = asString(issue.title) || event.repo.name;
    url = asString(comment.html_url) || asString(issue.html_url) || repositoryUrl;
  } else if (event.type === 'PullRequestReviewEvent') {
    const pullRequest = asRecord(payload.pull_request);
    const review = asRecord(payload.review);
    action = `审阅了 ${event.repo.name} 的 Pull Request`;
    subject = asString(pullRequest.title) || event.repo.name;
    url = asString(review.html_url) || asString(pullRequest.html_url) || repositoryUrl;
  } else if (event.type === 'WatchEvent') {
    action = '收藏了一个仓库';
    subject = event.repo.name;
  } else if (event.type === 'ForkEvent') {
    const fork = asRecord(payload.forkee);
    action = 'Fork 了一个仓库';
    subject = event.repo.name;
    url = asString(fork.html_url) || repositoryUrl;
  } else if (event.type === 'CreateEvent') {
    const refType = asString(payload.ref_type);
    const ref = asString(payload.ref);
    const typeLabel: Record<string, string> = {
      repository: '仓库',
      branch: '分支',
      tag: '标签',
    };
    action = `创建了${typeLabel[refType] || '新的 GitHub 内容'}`;
    subject = ref || event.repo.name;
  } else if (event.type === 'ReleaseEvent') {
    const release = asRecord(payload.release);
    action = `在 ${event.repo.name} 发布了 Release`;
    subject = asString(release.name) || asString(release.tag_name) || event.repo.name;
    url = asString(release.html_url) || repositoryUrl;
  }

  return {
    id: event.id,
    action,
    subject,
    url,
    createdAt: event.created_at,
  };
}

async function fetchActivities(
  githubFetch: GithubApiFetch,
  login: string,
  signal: AbortSignal,
) {
  const response = await githubFetch(`/users/${encodeURIComponent(login)}/events/public?per_page=12`, {
    signal,
  });
  const events = await jsonResponse<GithubEventResponse[]>(response, '读取 GitHub Activity');
  if (!Array.isArray(events)) throw new Error('GitHub Activity 格式不完整。');
  return events.map(eventActivity);
}

export function useGithubProfile(
  user: Readonly<Ref<GithubUser | null>>,
  githubFetch: GithubApiFetch,
) {
  const contributionDays = ref<GithubContributionDay[]>([]);
  const contributionTotal = ref(0);
  const activities = ref<GithubActivity[]>([]);
  const contributionsLoading = ref(false);
  const activityLoading = ref(false);
  const contributionsError = ref<string | null>(null);
  const activityError = ref<string | null>(null);
  let requestController: AbortController | null = null;
  let requestVersion = 0;

  function reset() {
    contributionDays.value = [];
    contributionTotal.value = 0;
    activities.value = [];
    contributionsLoading.value = false;
    activityLoading.value = false;
    contributionsError.value = null;
    activityError.value = null;
  }

  async function refreshGithubProfile() {
    const activeUser = user.value;
    requestVersion += 1;
    const version = requestVersion;
    requestController?.abort();

    if (!activeUser) {
      requestController = null;
      reset();
      return;
    }

    const controller = new AbortController();
    requestController = controller;
    contributionsLoading.value = true;
    activityLoading.value = true;
    contributionsError.value = null;
    activityError.value = null;

    const [contributionResult, activityResult] = await Promise.allSettled([
      fetchContributions(githubFetch, controller.signal),
      fetchActivities(githubFetch, activeUser.login, controller.signal),
    ]);

    if (controller.signal.aborted || version !== requestVersion) return;

    if (contributionResult.status === 'fulfilled') {
      contributionDays.value = contributionResult.value.days;
      contributionTotal.value = contributionResult.value.total;
    } else if (!isAbortError(contributionResult.reason)) {
      contributionsError.value = contributionResult.reason instanceof Error
        ? contributionResult.reason.message
        : '无法读取 GitHub 贡献记录。';
    }

    if (activityResult.status === 'fulfilled') {
      activities.value = activityResult.value;
    } else if (!isAbortError(activityResult.reason)) {
      activityError.value = activityResult.reason instanceof Error
        ? activityResult.reason.message
        : '无法读取 GitHub Activity。';
    }

    contributionsLoading.value = false;
    activityLoading.value = false;
    if (requestController === controller) requestController = null;
  }

  watch(user, () => {
    void refreshGithubProfile();
  }, { immediate: true });

  onUnmounted(() => requestController?.abort());

  return {
    contributionDays: readonly(contributionDays),
    contributionTotal: readonly(contributionTotal),
    activities: readonly(activities),
    contributionsLoading: readonly(contributionsLoading),
    activityLoading: readonly(activityLoading),
    contributionsError: readonly(contributionsError),
    activityError: readonly(activityError),
    refreshGithubProfile,
  };
}

<script setup lang="ts">
import LucideIcon from '@/components/LucideIcon.vue';
import ContributionMatrix from './ContributionMatrix.vue';
import type {
  GithubActivity,
  GithubAuthState,
  GithubContributionDay,
  GithubUser,
} from './types';

defineProps<{
  githubAuthState: GithubAuthState;
  githubUser: GithubUser | null;
  contributionDays: readonly GithubContributionDay[];
  contributionTotal: number;
  contributionsLoading: boolean;
  contributionsError: string | null;
  activities: readonly GithubActivity[];
  activityLoading: boolean;
  activityError: string | null;
}>();

defineEmits<{
  (event: 'connect-github'): void;
  (event: 'refresh-github'): void;
}>();

const compactNumber = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const relativeTime = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });

function formatCount(value: number) {
  return compactNumber.format(value);
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';

  const seconds = Math.round((date.getTime() - Date.now()) / 1_000);
  const absoluteSeconds = Math.abs(seconds);
  if (absoluteSeconds < 60) return relativeTime.format(seconds, 'second');
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeTime.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return relativeTime.format(days, 'day');
  const months = Math.round(days / 30);
  return relativeTime.format(months, 'month');
}
</script>

<template>
  <aside class="panel profile-panel" aria-label="GitHub 个人信息">
    <section class="github-profile-identity" aria-label="GitHub 账号">
      <template v-if="githubUser">
        <div class="github-profile-main">
          <a
            class="github-profile-avatar"
            :href="githubUser.profileUrl"
            :aria-label="`打开 ${githubUser.login} 的 GitHub 主页`"
          >
            <img
              :src="githubUser.avatarUrl"
              :alt="`${githubUser.login} 的 GitHub 头像`"
              width="64"
              height="64"
            />
          </a>

          <div class="github-profile-copy">
            <h2>{{ githubUser.name || githubUser.login }}</h2>
            <a :href="githubUser.profileUrl">@{{ githubUser.login }}</a>
            <p v-if="githubUser.bio" class="github-profile-bio">{{ githubUser.bio }}</p>
            <p v-if="githubUser.company || githubUser.location" class="github-profile-meta">
              <span v-if="githubUser.company">{{ githubUser.company }}</span>
              <span v-if="githubUser.location">{{ githubUser.location }}</span>
            </p>
          </div>
        </div>

        <dl class="github-profile-stats">
          <div>
            <dt>Followers</dt>
            <dd :title="String(githubUser.followers)">{{ formatCount(githubUser.followers) }}</dd>
          </div>
          <div>
            <dt>Following</dt>
            <dd :title="String(githubUser.following)">{{ formatCount(githubUser.following) }}</dd>
          </div>
          <div>
            <dt>Repositories</dt>
            <dd :title="String(githubUser.publicRepos)">{{ formatCount(githubUser.publicRepos) }}</dd>
          </div>
        </dl>
      </template>

      <template v-else>
        <div class="github-profile-main">
          <span class="github-profile-avatar github-profile-avatar--empty" aria-hidden="true">
            <LucideIcon name="github" :size="32" />
          </span>
          <div class="github-profile-copy">
            <h2>连接 GitHub</h2>
            <p>登录后显示头像、贡献记录和公开 Activity。</p>
          </div>
        </div>
        <button
          class="github-profile-connect"
          type="button"
          :disabled="githubAuthState === 'authorizing'"
          :aria-busy="githubAuthState === 'authorizing'"
          @click="$emit('connect-github')"
        >
          <span v-if="githubAuthState === 'authorizing'" class="github-auth-spinner" aria-hidden="true"></span>
          <LucideIcon v-else name="github" :size="17" />
          <span>{{ githubAuthState === 'authorizing' ? '等待授权' : '登录 GitHub' }}</span>
        </button>
      </template>
    </section>

    <section class="github-contributions" aria-label="最近三个月的 GitHub 贡献">
      <div class="github-contribution-summary" aria-live="polite">
        <span>最近 3 个月</span>
        <strong v-if="githubUser && !contributionsLoading && !contributionsError">
          {{ contributionTotal.toLocaleString('zh-CN') }} 次贡献
        </strong>
        <strong v-else-if="contributionsLoading">正在同步</strong>
        <button v-else-if="contributionsError" type="button" @click="$emit('refresh-github')">
          重新加载
        </button>
        <strong v-else>登录后显示</strong>
      </div>
      <ContributionMatrix
        :days="contributionDays"
        :total="contributionTotal"
        :loading="contributionsLoading"
      />
    </section>

    <section class="github-activity" aria-label="GitHub 近期 Activity">
      <div v-if="activityLoading" class="github-activity-skeleton" aria-label="正在加载 GitHub Activity">
        <span v-for="index in 4" :key="index"></span>
      </div>

      <div v-else-if="activityError" class="github-activity-message" role="status">
        <span class="empty-icon"><LucideIcon name="refresh" :size="18" /></span>
        <p>{{ activityError }}</p>
        <button type="button" @click="$emit('refresh-github')">重试</button>
      </div>

      <div v-else-if="activities.length === 0" class="github-activity-message">
        <span class="empty-icon"><LucideIcon name="clock" :size="18" /></span>
        <p>{{ githubUser ? '最近没有公开 Activity。' : '登录后显示你的 GitHub Activity。' }}</p>
      </div>

      <ol v-else class="github-activity-list">
        <li v-for="activity in activities" :key="activity.id">
          <a :href="activity.url">
            <span class="github-activity-dot" aria-hidden="true"></span>
            <span class="github-activity-copy">
              <strong>{{ activity.action }}</strong>
              <span>{{ activity.subject }}</span>
              <time :datetime="activity.createdAt">{{ formatRelativeTime(activity.createdAt) }}</time>
            </span>
            <LucideIcon name="external" :size="14" />
          </a>
        </li>
      </ol>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
import {
  githubNewRepositoriesPageUrl,
  githubTrendingPageUrl,
  type GithubRepositoryFeed,
  type GithubTrendingPeriod,
} from '@/composables/useGithubTrending';
import RepositoryCard from './RepositoryCard.vue';
import type { TrendingRepo } from './types';

const GITHUB_TRENDING_LANGUAGES = [
  '全部',
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'Ruby',
  'C++',
  'C',
  'C#',
  'Swift',
  'Kotlin',
  'Dart',
  'PHP',
  'Vue',
  'HTML',
  'CSS',
  'Shell',
  'Lua',
  'Zig',
  'Scala',
  'Elixir',
  'Haskell',
  'Clojure',
  'R',
  'Objective-C',
  'Assembly',
  'Perl',
  'Julia',
  'Nim',
  'OCaml',
  'Crystal',
  'Erlang',
  'Groovy',
  'CoffeeScript',
  'F#',
  'D',
  'Haxe',
  'Vala',
  'PureScript',
  'Elm',
  'Reason',
  'Solidity',
  'SQL',
  'PowerShell',
  'Makefile',
  'CMake',
  'Emacs Lisp',
  'Vim Script',
  'TeX',
  'Matlab',
  'Nix',
  'HCL',
  'YAML',
  'TOML',
  'JSON',
  'GraphQL',
  'Roff',
  'Batchfile',
  'GLSL',
  'HLSL',
  'WebAssembly',
  'MDX',
  'Markdown',
  'Dockerfile',
  'Jupyter Notebook',
] as const;

const props = defineProps<{
  repos: readonly TrendingRepo[];
  loading: boolean;
  error: string | null;
}>();

const language = defineModel<string>('language', { default: '全部' });
const period = defineModel<GithubTrendingPeriod>('period', { default: 'weekly' });
const feed = defineModel<GithubRepositoryFeed>('feed', { default: 'popular' });
defineEmits<{ (event: 'refresh'): void }>();

const feeds: ReadonlyArray<{ value: GithubRepositoryFeed; label: string }> = [
  { value: 'popular', label: 'Popular' },
  { value: 'new', label: 'New' },
];

const periods: ReadonlyArray<{ value: GithubTrendingPeriod; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const panelSubtitle = computed(() => feed.value === 'popular'
  ? 'Trending on GitHub'
  : 'Recently created');
const emptyMessage = computed(() => feed.value === 'popular'
  ? 'No trending repositories match these filters.'
  : 'No new repositories match these filters.');
const externalUrl = computed(() => feed.value === 'popular'
  ? githubTrendingPageUrl(language.value, period.value)
  : githubNewRepositoriesPageUrl(language.value, period.value));

const isInitialLoad = computed(() => props.loading && props.repos.length === 0);
const isRefreshing = computed(() => props.loading && props.repos.length > 0);
</script>

<template>
  <section class="panel repo-panel" aria-labelledby="repo-title">
    <div class="panel-top">
      <div class="panel-header">
        <span class="panel-icon panel-icon--repo"><LucideIcon name="github" /></span>
        <div>
          <h2 id="repo-title">Repositories</h2>
          <span>{{ panelSubtitle }}</span>
        </div>
      </div>
      <div class="panel-controls">
        <select
          v-model="feed"
          class="repo-filter-select"
          aria-label="Filter by repository feed"
        >
          <option v-for="option in feeds" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <select
          v-model="period"
          class="repo-filter-select"
          aria-label="Filter by time range"
        >
          <option v-for="option in periods" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <select
          v-model="language"
          class="repo-filter-select repo-language-select"
          aria-label="Filter by programming language"
        >
          <option v-for="lang in GITHUB_TRENDING_LANGUAGES" :key="lang" :value="lang">
            {{ lang === '全部' ? 'All languages' : lang }}
          </option>
        </select>
        <button
          type="button"
          class="panel-refresh-button"
          aria-label="Refresh repositories"
          title="Refresh"
          :disabled="loading"
          @click="$emit('refresh')"
        >
          <LucideIcon
            name="refresh"
            :size="15"
            :class="{ 'panel-refresh-icon--spinning': loading }"
          />
        </button>
      </div>
    </div>

    <div class="repo-grid" :class="{ 'repo-grid--refreshing': isRefreshing }">
      <!-- Initial loading skeleton -->
      <template v-if="isInitialLoad">
        <div v-for="n in 6" :key="'sk-' + n" class="repo-item repo-item--skeleton">
          <span class="repo-skeleton-line repo-skeleton-line--1"></span>
          <span class="repo-skeleton-line repo-skeleton-line--2"></span>
          <span class="repo-skeleton-line repo-skeleton-line--3"></span>
        </div>
      </template>

      <!-- Error (only when no data) -->
      <div v-else-if="error && repos.length === 0" class="repo-grid-message" role="status">
        <span class="empty-icon"><LucideIcon name="refresh" :size="18" /></span>
        <p>{{ error }}</p>
        <button type="button" @click="$emit('refresh')">Retry</button>
      </div>

      <!-- Empty after load -->
      <div v-else-if="!loading && repos.length === 0" class="repo-grid-message">
        <span class="empty-icon"><LucideIcon name="filter" :size="18" /></span>
        <p>{{ emptyMessage }}</p>
      </div>

      <!-- Cards (persist during refresh) -->
      <RepositoryCard
        v-for="repo in repos"
        :key="repo.id"
        :repo="repo"
      />
    </div>

    <a class="panel-footer-action" :href="externalUrl">
      <span>{{ feed === 'popular' ? 'Open GitHub Trending' : 'Open GitHub Search' }}</span>
      <LucideIcon name="external" :size="15" />
    </a>
  </section>
</template>

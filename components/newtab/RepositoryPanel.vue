<script setup lang="ts">
import { computed } from 'vue';
import LucideIcon from '@/components/LucideIcon.vue';
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
defineEmits<{ (event: 'refresh'): void }>();

const filteredRepos = computed(() =>
  language.value === '全部'
    ? props.repos
    : props.repos.filter((repo) => repo.language === language.value),
);

const isInitialLoad = computed(() => props.loading && props.repos.length === 0);
const isRefreshing = computed(() => props.loading && props.repos.length > 0);
</script>

<template>
  <section class="panel repo-panel" aria-labelledby="repo-title">
    <div class="panel-top">
      <div class="panel-header">
        <span class="panel-icon panel-icon--repo"><LucideIcon name="github" /></span>
        <div>
          <h2 id="repo-title">GitHub Trending</h2>
          <span>发现热门开源项目</span>
        </div>
      </div>
      <div class="panel-controls">
        <select
          v-model="language"
          class="repo-language-select"
          aria-label="按编程语言筛选"
        >
          <option v-for="lang in GITHUB_TRENDING_LANGUAGES" :key="lang" :value="lang">
            {{ lang === '全部' ? '全部语言' : lang }}
          </option>
        </select>
        <button
          type="button"
          class="panel-refresh-button"
          aria-label="刷新 Trending"
          title="刷新"
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
        <button type="button" @click="$emit('refresh')">重试</button>
      </div>

      <!-- Empty after load -->
      <div v-else-if="!loading && filteredRepos.length === 0" class="repo-grid-message">
        <span class="empty-icon"><LucideIcon name="filter" :size="18" /></span>
        <p>没有找到 {{ language === '全部' ? '' : language }} 仓库。</p>
      </div>

      <!-- Cards (persist during refresh) -->
      <RepositoryCard
        v-for="repo in filteredRepos"
        :key="repo.id"
        :repo="repo"
      />
    </div>

    <a class="panel-footer-action" href="https://github.com/trending">
      <span>打开 GitHub Trending</span>
      <LucideIcon name="external" :size="15" />
    </a>
  </section>
</template>

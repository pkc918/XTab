<script setup lang="ts">
import { computed, ref } from 'vue';
import IconGlyph from '@/components/IconGlyph.vue';
import RepositoryCard from './RepositoryCard.vue';
import type { RepoFilter, Repository } from './types';

const props = defineProps<{ repositories: Repository[] }>();
const filters: RepoFilter[] = ['为你', '趋势', '新项目'];
const activeFilter = ref<RepoFilter>('为你');
const savedRepos = ref(new Set<string>());

const filteredRepos = computed(() => activeFilter.value === '为你'
  ? props.repositories
  : props.repositories.filter((repo) => repo.group === activeFilter.value));
const repoStatus = computed(() => `${activeFilter.value}筛选，共 ${filteredRepos.value.length} 个示例仓库。`);

function toggleSaved(name: string) {
  const next = new Set(savedRepos.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  savedRepos.value = next;
}
</script>

<template>
  <section class="panel repo-panel" aria-labelledby="repo-title">
    <div class="panel-heading repo-heading">
      <div class="panel-title-group">
        <span class="panel-icon panel-icon--repo"><IconGlyph name="github" /></span>
        <div>
          <h2 id="repo-title">GitHub 推荐</h2>
          <span>示例推荐 · 非实时</span>
        </div>
      </div>
      <div class="filter-row" role="group" aria-label="GitHub 推荐筛选">
        <button
          v-for="filter in filters"
          :key="filter"
          type="button"
          :aria-pressed="activeFilter === filter"
          :class="{ active: activeFilter === filter }"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>
    </div>

    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ repoStatus }}</p>

    <div class="repo-grid">
      <RepositoryCard
        v-for="repo in filteredRepos"
        :key="repo.name"
        :repo="repo"
        :saved="savedRepos.has(repo.name)"
        @toggle-save="toggleSaved(repo.name)"
      />
    </div>

    <a class="panel-footer-action" href="https://github.com/trending">
      <span>打开 GitHub Trending</span>
      <IconGlyph name="external" :size="15" />
    </a>
  </section>
</template>

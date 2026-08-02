<script setup lang="ts">
import IconGlyph from '@/components/IconGlyph.vue';
import ContributionMatrix from './ContributionMatrix.vue';
import type { GithubAuthState, GithubUser } from './types';

defineProps<{
  contributionLevels: number[];
  githubAuthState: GithubAuthState;
  githubUser: GithubUser | null;
}>();
defineEmits<{ (event: 'connect-github'): void }>();
</script>

<template>
  <aside class="panel profile-panel" aria-labelledby="profile-title">
    <div class="panel-heading">
      <div class="panel-title-group">
        <span class="panel-icon panel-icon--profile"><IconGlyph name="github" /></span>
        <div>
          <h2 id="profile-title">我的 GitHub</h2>
          <span>{{ githubUser ? `@${githubUser.login}` : '尚未连接' }}</span>
        </div>
      </div>
    </div>

    <section v-if="githubUser" class="connected-state" aria-label="已连接的 GitHub 账号">
      <div class="connected-account">
        <img :src="githubUser.avatarUrl" alt="" width="44" height="44" />
        <div>
          <h3>{{ githubUser.name || githubUser.login }}</h3>
          <a :href="githubUser.profileUrl">@{{ githubUser.login }}</a>
        </div>
        <span class="connected-badge">已连接</span>
      </div>
      <dl class="github-stats">
        <div><dt>Followers</dt><dd>{{ githubUser.followers }}</dd></div>
        <div><dt>Following</dt><dd>{{ githubUser.following }}</dd></div>
        <div><dt>Repositories</dt><dd>{{ githubUser.publicRepos }}</dd></div>
      </dl>
    </section>

    <section v-else class="auth-state" aria-label="GitHub 登录状态">
      <span class="auth-icon"><IconGlyph name="github" :size="28" /></span>
      <h3>连接你的 GitHub</h3>
      <p>登录后可在这里查看个人动态、仓库与贡献记录。</p>
      <button
        type="button"
        :disabled="githubAuthState === 'authorizing'"
        :aria-busy="githubAuthState === 'authorizing'"
        @click="$emit('connect-github')"
      >
        <IconGlyph name="github" :size="17" />
        <span>{{ githubAuthState === 'authorizing' ? '等待授权' : '登录 GitHub' }}</span>
      </button>
    </section>

    <section class="profile-section contribution-section" aria-labelledby="contribution-title">
      <div class="section-heading">
        <div>
          <h3 id="contribution-title">贡献矩阵</h3>
          <span>结构预览，不代表真实数据</span>
        </div>
      </div>
      <ContributionMatrix :levels="contributionLevels" />
    </section>

    <section class="profile-section activity-empty" aria-labelledby="activity-title">
      <div class="section-heading">
        <div>
          <h3 id="activity-title">近期动态</h3>
          <span>连接后自动呈现</span>
        </div>
      </div>
      <span class="empty-icon"><IconGlyph name="clock" :size="21" /></span>
      <p>这里会展示你的公开 GitHub 动态。</p>
    </section>
  </aside>
</template>

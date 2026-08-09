import type { Component } from 'vue';
import type { IconName } from '@/components/icons/registry';

export type Theme = 'light' | 'dark';
export type GithubAuthState = 'signed-out' | 'authorizing' | 'signed-in';
export type FeedCategory = '全部' | '开发' | '设计' | 'AI';
export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;
  publicRepos: number;
}

export type GithubContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface GithubContributionDay {
  date: string;
  count: number;
  level: GithubContributionLevel;
  week: number;
  weekday: number;
}

export interface GithubActivity {
  id: string;
  action: string;
  subject: string;
  url: string;
  createdAt: string;
}

export interface QuickLink {
  name: string;
  href: string;
  icon: IconName;
  accent: string;
  removable?: boolean;
}

export interface RssItem {
  id: string | number;
  title: string;
  category: Exclude<FeedCategory, '全部'>;
  source: string;
  sourceUrl: string;
  detail: string;
  accent: string;
  href?: string;
  publishedAt?: string;
}

export interface RssSourceTab {
  url: string;
  title: string;
  icon?: Component;
}

export interface Repository {
  name: string;
  description: string;
  language: string;
  group: string;
  href: string;
  accent: string;
}

export interface TrendingRepo {
  id: number;
  name: string;
  description: string;
  language: string;
  stars: number;
  watchers: number;
  forks: number;
  url: string;
  accent: string;
}

export type Theme = 'light' | 'dark';
export type GithubAuthState = 'signed-out' | 'authorizing' | 'signed-in';
export type FeedCategory = '全部' | '开发' | '设计' | 'AI';
export type RepoFilter = '为你' | '趋势' | '新项目';

export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  profileUrl: string;
  followers: number;
  following: number;
  publicRepos: number;
}

export interface QuickLink {
  name: string;
  href: string;
  icon: string;
  accent: string;
}

export interface RssItem {
  id: number;
  title: string;
  category: Exclude<FeedCategory, '全部'>;
  source: string;
  detail: string;
  accent: string;
}

export interface Repository {
  name: string;
  description: string;
  language: string;
  group: RepoFilter;
  href: string;
  accent: string;
}

import type { QuickLink, Repository } from '@/components/newtab/types';

export const quickLinks: QuickLink[] = [
  { name: 'GitHub', href: 'https://github.com', icon: 'github', accent: '#7c3aed' },
  { name: 'Vercel', href: 'https://vercel.com', icon: 'triangle', accent: '#64748b' },
  { name: 'MDN', href: 'https://developer.mozilla.org', icon: 'book', accent: '#2563eb' },
  { name: 'Hacker News', href: 'https://news.ycombinator.com', icon: 'terminal', accent: '#f97316' },
  { name: 'YouTube', href: 'https://youtube.com', icon: 'play', accent: '#ef4444' },
  { name: 'Stack Overflow', href: 'https://stackoverflow.com', icon: 'layers', accent: '#f59e0b' },
];

export const repositories: Repository[] = [
  { name: 'microsoft / vscode', description: 'Visual Studio Code', language: 'TypeScript', group: '趋势', href: 'https://github.com/microsoft/vscode', accent: '#3178c6' },
  { name: 'vuejs / core', description: 'Vue core monorepo', language: 'TypeScript', group: '为你', href: 'https://github.com/vuejs/core', accent: '#3178c6' },
  { name: 'vitejs / vite', description: 'Frontend tooling', language: 'TypeScript', group: '新项目', href: 'https://github.com/vitejs/vite', accent: '#3178c6' },
  { name: 'pnpm / pnpm', description: 'Fast package manager', language: 'TypeScript', group: '为你', href: 'https://github.com/pnpm/pnpm', accent: '#3178c6' },
  { name: 'neovim / neovim', description: 'Vim-fork focused on extensibility', language: 'Lua', group: '趋势', href: 'https://github.com/neovim/neovim', accent: '#8b5cf6' },
  { name: 'rust-lang / rust', description: 'The Rust programming language', language: 'Rust', group: '趋势', href: 'https://github.com/rust-lang/rust', accent: '#f97316' },
  { name: 'denoland / deno', description: 'A modern runtime for JavaScript', language: 'Rust', group: '新项目', href: 'https://github.com/denoland/deno', accent: '#f97316' },
  { name: 'golang / go', description: 'The Go programming language', language: 'Go', group: '为你', href: 'https://github.com/golang/go', accent: '#06b6d4' },
  { name: 'sindresorhus / awesome', description: 'Curated topic lists', language: 'Markdown', group: '为你', href: 'https://github.com/sindresorhus/awesome', accent: '#64748b' },
  { name: 'facebook / react', description: 'A library for web and native interfaces', language: 'JavaScript', group: '为你', href: 'https://github.com/facebook/react', accent: '#eab308' },
  { name: 'tailwindlabs / tailwindcss', description: 'A utility-first CSS framework', language: 'TypeScript', group: '新项目', href: 'https://github.com/tailwindlabs/tailwindcss', accent: '#3178c6' },
  { name: 'oven-sh / bun', description: 'An all-in-one JavaScript runtime', language: 'Zig', group: '新项目', href: 'https://github.com/oven-sh/bun', accent: '#f59e0b' },
];

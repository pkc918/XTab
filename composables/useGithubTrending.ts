import { onUnmounted, readonly, ref, watch, type Ref } from 'vue';
import type { TrendingRepo } from '@/components/newtab/types';

type GithubFetch = (path: string | URL, init?: RequestInit) => Promise<Response>;

interface GithubSearchRepo {
  id: number;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
}

interface SearchResponse {
  items: GithubSearchRepo[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#eab308',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#06b6d4',
  Rust: '#f97316',
  Ruby: '#cc342d',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  PHP: '#4F5D95',
  Lua: '#8b5cf6',
  Zig: '#f59e0b',
  Shell: '#89e051',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  MDX: '#fcb32c',
  Markdown: '#64748b',
  Dockerfile: '#384d54',
  'Jupyter Notebook': '#DA5B0B',
  Svelte: '#ff3e00',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Clojure: '#db5855',
  Scala: '#c22d40',
  R: '#198CE7',
  TeX: '#3D6117',
  'Objective-C': '#438eff',
  Assembly: '#6E4C13',
  Perl: '#0298c3',
  Julia: '#a270ba',
  Nim: '#ffc200',
  OCaml: '#3be133',
  Crystal: '#000100',
  Erlang: '#B83998',
  Groovy: '#4298b8',
  CoffeeScript: '#244776',
  'F#': '#b845fc',
  D: '#ba595e',
  Haxe: '#df7900',
  Vala: '#a56de2',
  PureScript: '#1D222D',
  Elm: '#60B5CC',
  Reason: '#ff5847',
  Solidity: '#AA6746',
  SQL: '#e38c00',
  PowerShell: '#012456',
  Makefile: '#427819',
  CMake: '#DA3434',
  'Emacs Lisp': '#c065db',
  'Vim Script': '#199f4b',
  Matlab: '#e16737',
  Nix: '#7e7eff',
  HCL: '#844FBA',
  YAML: '#cb171e',
  TOML: '#9c4221',
  JSON: '#292929',
  GraphQL: '#e10098',
  Roff: '#ecdebe',
  Batchfile: '#C1F12E',
  GLSL: '#5686a5',
  HLSL: '#aace60',
  WebAssembly: '#04133b',
};

function languageColor(language: string | null) {
  if (!language) return '#6b7280';
  return LANGUAGE_COLORS[language] || '#6b7280';
}

function mapRepo(item: GithubSearchRepo): TrendingRepo {
  return {
    id: item.id,
    name: item.full_name,
    description: item.description || '',
    language: item.language || 'Unknown',
    stars: item.stargazers_count,
    forks: item.forks_count,
    url: item.html_url,
    accent: languageColor(item.language),
  };
}

function trendingSearchUrl(language: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const dateStr = weekAgo.toISOString().split('T')[0];
  let query = `created:>${dateStr}`;
  const lang = language && language !== '全部' ? language : '';
  if (lang) query += `+language:${encodeURIComponent(lang)}`;
  return `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=24`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useGithubTrending(
  language: Ref<string>,
  githubFetch?: GithubFetch,
) {
  const repos = ref<TrendingRepo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  let controller: AbortController | null = null;
  let requestVersion = 0;

  async function refresh() {
    requestVersion += 1;
    const version = requestVersion;
    controller?.abort();

    const ctrl = new AbortController();
    controller = ctrl;
    loading.value = true;
    error.value = null;

    try {
      const lang = language.value;
      const url = trendingSearchUrl(lang);
      const fetchFn = githubFetch ?? fetch;
      const init: RequestInit = { signal: ctrl.signal };
      if (!githubFetch) {
        init.headers = { Accept: 'application/vnd.github+json' };
      }
      const response = await fetchFn(url, init);

      if (ctrl.signal.aborted || version !== requestVersion) return;

      if (!response.ok) {
        throw new Error(`GitHub 搜索失败（HTTP ${response.status}）。`);
      }

      const payload: SearchResponse = await response.json();
      if (!Array.isArray(payload.items)) {
        throw new Error('GitHub 返回了无法解析的数据。');
      }

      if (ctrl.signal.aborted || version !== requestVersion) return;
      repos.value = payload.items.map(mapRepo);
    } catch (err) {
      if (isAbortError(err) || version !== requestVersion) return;
      error.value = err instanceof Error ? err.message : '无法获取 GitHub Trending 数据。';
    } finally {
      if (version === requestVersion && !ctrl.signal.aborted) {
        loading.value = false;
        if (controller === ctrl) controller = null;
      }
    }
  }

  watch(language, () => {
    void refresh();
  });

  onUnmounted(() => controller?.abort());

  // Initial fetch
  void refresh();

  return {
    repos: readonly(repos),
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  };
}

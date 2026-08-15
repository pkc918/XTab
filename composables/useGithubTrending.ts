import { onUnmounted, readonly, ref, watch, type Ref } from 'vue';
import type { TrendingRepo } from '@/components/newtab/types';

type GithubFetch = (path: string | URL, init?: RequestInit) => Promise<Response>;

export type GithubTrendingPeriod = 'daily' | 'weekly' | 'monthly';
export type GithubRepositoryFeed = 'popular' | 'new';

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

const PERIOD_DAYS: Record<GithubTrendingPeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

function languageSlug(language: string) {
  return encodeURIComponent(language.toLowerCase().replaceAll(' ', '-'));
}

function newRepositoryQuery(language: string, period: GithubTrendingPeriod) {
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - PERIOD_DAYS[period]);
  const dateStr = startDate.toISOString().split('T')[0];
  const languageQuery = language && language !== '全部' ? ` language:"${language}"` : '';
  return `created:>${dateStr}${languageQuery}`;
}

function newRepositoriesApiUrl(language: string, period: GithubTrendingPeriod) {
  const params = new URLSearchParams({
    q: newRepositoryQuery(language, period),
    sort: 'stars',
    order: 'desc',
    per_page: '24',
  });
  return `https://api.github.com/search/repositories?${params}`;
}

export function githubTrendingPageUrl(language: string, period: GithubTrendingPeriod) {
  const languagePath = language && language !== '全部' ? `/${languageSlug(language)}` : '';
  return `https://github.com/trending${languagePath}?since=${period}`;
}

export function githubNewRepositoriesPageUrl(language: string, period: GithubTrendingPeriod) {
  const params = new URLSearchParams({
    q: newRepositoryQuery(language, period),
    type: 'repositories',
    s: 'stars',
    o: 'desc',
  });
  return `https://github.com/search?${params}`;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function parseCount(value: string | null | undefined) {
  const digits = (value ?? '').replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}

function repositoryId(name: string) {
  let hash = 0;
  for (const character of name) {
    hash = (Math.imul(31, hash) + character.codePointAt(0)!) | 0;
  }
  return hash >>> 0;
}

function parseTrendingRepositories(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return [...document.querySelectorAll<HTMLElement>('article.Box-row')]
    .map((article): TrendingRepo | null => {
      const repositoryLink = article.querySelector<HTMLAnchorElement>('h2 a[href]');
      if (!repositoryLink) return null;

      const repositoryUrl = new URL(repositoryLink.getAttribute('href') ?? '', 'https://github.com');
      const [owner, repository] = repositoryUrl.pathname.split('/').filter(Boolean);
      if (!owner || !repository) return null;

      const name = `${owner}/${repository}`;
      const language = normalizeText(
        article.querySelector<HTMLElement>('[itemprop="programmingLanguage"]')?.textContent,
      ) || 'Unknown';
      return {
        id: repositoryId(name),
        name,
        description: normalizeText(
          article.querySelector<HTMLElement>('p.col-9, p.my-1')?.textContent,
        ),
        language,
        stars: parseCount(
          article.querySelector<HTMLAnchorElement>('a[href$="/stargazers"]')?.textContent,
        ),
        forks: parseCount(
          article.querySelector<HTMLAnchorElement>('a[href$="/forks"]')?.textContent,
        ),
        url: repositoryUrl.toString(),
        accent: languageColor(language),
      };
    })
    .filter((repo): repo is TrendingRepo => repo !== null);
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useGithubTrending(
  language: Ref<string>,
  period: Ref<GithubTrendingPeriod>,
  feed: Ref<GithubRepositoryFeed>,
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
      const isPopular = feed.value === 'popular';
      const url = isPopular
        ? githubTrendingPageUrl(lang, period.value)
        : newRepositoriesApiUrl(lang, period.value);
      const fetchFn = isPopular ? fetch : (githubFetch ?? fetch);
      const response = await fetchFn(url, {
        signal: ctrl.signal,
        headers: {
          Accept: isPopular ? 'text/html' : 'application/vnd.github+json',
        },
      });

      if (ctrl.signal.aborted || version !== requestVersion) return;

      if (!response.ok) {
        throw new Error(
          `${isPopular ? 'GitHub Trending' : 'GitHub search'} failed (HTTP ${response.status}).`,
        );
      }

      const nextRepos = isPopular
        ? parseTrendingRepositories(await response.text())
        : await response.json().then((payload: SearchResponse) => {
          if (!Array.isArray(payload.items)) {
            throw new Error('GitHub returned an unreadable response.');
          }
          return payload.items.map(mapRepo);
        });

      if (ctrl.signal.aborted || version !== requestVersion) return;
      repos.value = nextRepos;
    } catch (err) {
      if (isAbortError(err) || version !== requestVersion) return;
      error.value = err instanceof Error ? err.message : 'Unable to load GitHub repositories.';
    } finally {
      if (version === requestVersion && !ctrl.signal.aborted) {
        loading.value = false;
        if (controller === ctrl) controller = null;
      }
    }
  }

  watch([language, period, feed], () => {
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

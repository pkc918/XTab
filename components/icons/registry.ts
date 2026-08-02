import {
  ArrowRight,
  BookOpen,
  BookOpenText,
  Bookmark,
  Clock3,
  ExternalLink,
  Layers3,
  ListFilter,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Rss,
  Settings,
  Sun,
  Terminal,
  Triangle,
} from '@lucide/vue';
import GithubBrandIcon from './GithubBrandIcon.vue';
import GoogleBrandIcon from './GoogleBrandIcon.vue';

export const iconRegistry = {
  arrow: ArrowRight,
  book: BookOpen,
  bookmark: Bookmark,
  clock: Clock3,
  external: ExternalLink,
  filter: ListFilter,
  github: GithubBrandIcon,
  google: GoogleBrandIcon,
  layers: Layers3,
  moon: Moon,
  play: Play,
  plus: Plus,
  refresh: RefreshCw,
  repo: BookOpenText,
  rss: Rss,
  settings: Settings,
  sun: Sun,
  terminal: Terminal,
  triangle: Triangle,
} as const;

export type IconName = keyof typeof iconRegistry;

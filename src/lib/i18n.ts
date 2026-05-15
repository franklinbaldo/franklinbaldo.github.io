export type Lang = 'en' | 'pt';
export const DEFAULT_LANG: Lang = 'en';

const UI_KEYS = [
  'nav.home',
  'nav.archive',
  'nav.tags',
  'nav.projects',
  'nav.search',
  'nav.about',
  'nav.menu',
  'post.continueReading',
  'post.minutesRead',
  'post.updated',
  'post.tags',
  'post.partOf',
  'post.of',
  'post.inSeries',
  'post.series',
  'post.allInSeries',
  'post.thisPost',
  'series.navLabel',
  'featured.label',
  'paths.heading',
  'paths.blurb',
  'paths.startHere',
  'paths.essay',
  'paths.essays',
  'home.recent',
  'home.viewArchive',
  'author.label',
  'author.tagline',
  'author.more',
  'comments.heading',
  'comments.notConfigured',
  'related.heading',
  'toc.label',
  'lang.switchAria',
] as const;

export type UIKey = (typeof UI_KEYS)[number];

/**
 * Strings describing another language from the current language's perspective.
 * `LANGUAGES.en.targets.pt.invitation` is what an EN reader sees inviting
 * them to switch to PT ("Ler em Português"). Adding a third language means
 * adding its target entry to every existing language config (and a new
 * config block).
 */
export interface TargetLangCopy {
  /** Short label shown on a compact button, e.g. "PT". */
  shortLabel: string;
  /** Full invitation, typically written in the target language. */
  invitation: string;
  /** Shown when no translation exists in this target language. */
  noTranslation: string;
}

export interface LangConfig {
  code: string;
  /** BCP-47 locale tag for Intl APIs. */
  locale: string;
  /** URL prefix for in-site links; empty string for the default language. */
  urlPrefix: string;
  /** Lowercase prefixes of `navigator.language` that resolve to this code. */
  navMatch: string[];
  ui: Record<UIKey, string>;
  targets: Record<string, TargetLangCopy>;
}

export const LANGUAGES: Record<string, LangConfig> = {
  en: {
    code: 'en',
    locale: 'en-US',
    urlPrefix: '',
    navMatch: ['en'],
    ui: {
      'nav.home': 'Home',
      'nav.archive': 'Archive',
      'nav.tags': 'Tags',
      'nav.projects': 'Projects',
      'nav.search': 'Search',
      'nav.about': 'About',
      'nav.menu': 'Menu',
      'post.continueReading': 'Continue reading →',
      'post.minutesRead': 'min read',
      'post.updated': 'updated',
      'post.tags': 'Tags:',
      'post.partOf': 'Part',
      'post.of': 'of',
      'post.inSeries': 'in the',
      'post.series': 'series.',
      'post.allInSeries': 'All posts in this series',
      'post.thisPost': 'this post',
      'series.navLabel': 'Series navigation',
      'featured.label': 'Featured essay',
      'paths.heading': 'Reading paths',
      'paths.blurb': 'Curated sequences for entering the labyrinth through a specific door.',
      'paths.startHere': 'Start here →',
      'paths.essay': 'essay',
      'paths.essays': 'essays',
      'home.recent': 'Recent essays',
      'home.viewArchive': 'View the full archive →',
      'author.label': 'Author',
      'author.tagline': 'Lawyer and State Attorney. Writes on AI agency, process metaphysics, and legal design.',
      'author.more': 'More essays →',
      'comments.heading': 'Comments',
      'comments.notConfigured': 'Comments not configured yet.',
      'related.heading': 'Related posts',
      'toc.label': 'Contents',
      'lang.switchAria': 'Switch language',
    },
    targets: {
      pt: {
        shortLabel: 'PT',
        invitation: 'Ler em Português',
        noTranslation: 'Sem versão em português',
      },
    },
  },
  pt: {
    code: 'pt',
    locale: 'pt-BR',
    urlPrefix: '/pt',
    navMatch: ['pt'],
    ui: {
      'nav.home': 'Início',
      'nav.archive': 'Arquivo',
      'nav.tags': 'Tags',
      'nav.projects': 'Projetos',
      'nav.search': 'Buscar',
      'nav.about': 'Sobre',
      'nav.menu': 'Menu',
      'post.continueReading': 'Continuar lendo →',
      'post.minutesRead': 'min de leitura',
      'post.updated': 'atualizado',
      'post.tags': 'Tags:',
      'post.partOf': 'Parte',
      'post.of': 'de',
      'post.inSeries': 'na série',
      'post.series': '.',
      'post.allInSeries': 'Todos os posts desta série',
      'post.thisPost': 'este post',
      'series.navLabel': 'Navegação da série',
      'featured.label': 'Ensaio em destaque',
      'paths.heading': 'Caminhos de leitura',
      'paths.blurb': 'Sequências curadas para entrar no labirinto por uma porta específica.',
      'paths.startHere': 'Começar →',
      'paths.essay': 'ensaio',
      'paths.essays': 'ensaios',
      'home.recent': 'Ensaios recentes',
      'home.viewArchive': 'Ver o arquivo completo →',
      'author.label': 'Autor',
      'author.tagline': 'Advogado e Procurador do Estado. Escreve sobre agentes de IA, metafísica do processo e design jurídico.',
      'author.more': 'Mais ensaios →',
      'comments.heading': 'Comentários',
      'comments.notConfigured': 'Comentários ainda não configurados.',
      'related.heading': 'Posts relacionados',
      'toc.label': 'Conteúdo',
      'lang.switchAria': 'Alterar idioma',
    },
    targets: {
      en: {
        shortLabel: 'EN',
        invitation: 'Read in English',
        noTranslation: 'No English version',
      },
    },
  },
};

function configFor(lang: string | undefined): LangConfig {
  return LANGUAGES[lang ?? DEFAULT_LANG] ?? LANGUAGES[DEFAULT_LANG];
}

/** Translate a UI key with default-language fallback. */
export function t(lang: string | undefined, key: UIKey): string {
  const cfg = configFor(lang);
  return cfg.ui[key] ?? LANGUAGES[DEFAULT_LANG].ui[key];
}

/**
 * Look up the copy describing `targetLang` from `currentLang`'s perspective.
 * Falls back to a code-only label when the pairing is undefined.
 */
export function targetCopy(
  currentLang: string | undefined,
  targetLang: string,
): TargetLangCopy {
  const cfg = configFor(currentLang);
  return (
    cfg.targets[targetLang] ?? {
      shortLabel: targetLang.toUpperCase(),
      invitation: targetLang.toUpperCase(),
      noTranslation: `No ${targetLang.toUpperCase()} version`,
    }
  );
}

/**
 * Generic per-language lookup for caller-provided dictionaries (e.g. reading
 * path titles). Falls back to the default-language entry, then to any entry.
 */
export function pick<T>(
  lang: string | undefined,
  dict: Record<string, T>,
): T {
  const key = lang ?? DEFAULT_LANG;
  return dict[key] ?? dict[DEFAULT_LANG] ?? (Object.values(dict)[0] as T);
}

export function locale(lang: string | undefined): string {
  return configFor(lang).locale;
}

export function urlPrefix(lang: string | undefined): string {
  return configFor(lang).urlPrefix;
}

export function supportedLangs(): string[] {
  return Object.keys(LANGUAGES);
}

export function detectLang(): string {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const stored = localStorage.getItem('lang');
  if (stored && LANGUAGES[stored]) return stored;
  const navLang = navigator.language.toLowerCase();
  for (const cfg of Object.values(LANGUAGES)) {
    if (cfg.navMatch.some((m) => navLang.startsWith(m))) return cfg.code;
  }
  return DEFAULT_LANG;
}

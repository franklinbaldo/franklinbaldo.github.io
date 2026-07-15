import { DEFAULT_LANG as _DEFAULT_LANG, LANG_META } from "./languages.mjs";

export { DEFAULT_LANG } from "./languages.mjs";
export type Lang = "en" | "pt";

const UI_KEYS = [
  "nav.home",
  "nav.archive",
  "nav.tags",
  "nav.projects",
  "nav.ranking",
  "nav.music",
  "nav.books",
  "nav.search",
  "nav.about",
  "nav.menu",
  "archive.jumpToYear",
  "post.continueReading",
  "post.minutesRead",
  "post.updated",
  "post.tags",
  "post.previousVersion",
  "post.prev",
  "post.next",
  "post.navLabel",
  "post.share",
  "post.partOf",
  "post.of",
  "post.inSeries",
  "post.series",
  "post.allInSeries",
  "post.thisPost",
  "series.navLabel",
  "featured.label",
  "paths.heading",
  "paths.blurb",
  "paths.startHere",
  "paths.essay",
  "paths.essays",
  "home.recent",
  "home.viewArchive",
  "author.label",
  "author.tagline",
  "author.more",
  "author.aboutMore",
  "author.aboutEyebrow",
  "author.stayInLoop",
  "author.rssFeed",
  "author.searchEssays",
  "comments.heading",
  "comments.notConfigured",
  "related.heading",
  "related.headingFallback",
  "toc.label",
  "lang.switchAria",
  "og.siteEyebrow",
  "og.siteDescription",
  "og.qrHint",
  "webmentions.heading",
  "webmentions.like",
  "webmentions.likes",
  "webmentions.repost",
  "webmentions.reposts",
  "webmentions.from",
  "webmentions.more",
  "webmentions.someone",
  "webmentions.anonymous",
  "post.typeEssay",
  "post.typeLetter",
  "post.typeFiction",
  "post.typeTechnical",
  "post.typeDialogue",
  "archive.filterType",
  "archive.filterAll",
  "post.play",
  "post.listenOnSuno",
  "post.otherVersions",
] as const;

export type UIKey = (typeof UI_KEYS)[number];

export interface TargetLangCopy {
  shortLabel: string;
  invitation: string;
  noTranslation: string;
}

export interface LangConfig {
  code: string;
  locale: string;
  urlPrefix: string;
  navMatch: string[];
  ui: Record<UIKey, string>;
  targets: Record<string, TargetLangCopy>;
}

export const LANGUAGES: Record<string, LangConfig> = {
  en: {
    code: "en",
    ...LANG_META.en,
    ui: {
      "nav.home": "Home",
      "nav.archive": "Archive",
      "nav.tags": "Tags",
      "nav.projects": "Projects",
      "nav.ranking": "Ranking",
      "nav.music": "Music",
      "nav.books": "Books",
      "nav.search": "Search",
      "nav.about": "About",
      "nav.menu": "Menu",
      "post.continueReading": "Continue reading →",
      "post.minutesRead": "min read",
      "post.updated": "updated",
      "post.tags": "Tags:",
      "post.previousVersion": "Previous version",
      "post.prev": "← Previous",
      "post.next": "Next →",
      "post.navLabel": "Post navigation",
      "post.share": "Share",
      "post.partOf": "Part",
      "post.of": "of",
      "post.inSeries": "in the",
      "post.series": "series.",
      "post.allInSeries": "All posts in this series",
      "post.thisPost": "this post",
      "series.navLabel": "Series navigation",
      "featured.label": "Featured essay",
      "paths.heading": "Reading paths",
      "paths.blurb":
        "Curated sequences for entering the labyrinth through a specific door.",
      "paths.startHere": "Start here →",
      "paths.essay": "essay",
      "paths.essays": "essays",
      "home.recent": "Recent essays",
      "home.viewArchive": "View the full archive →",
      "author.label": "Author",
      "author.tagline":
        "Lawyer and State Attorney. Writes on AI agency, process metaphysics, and legal design.",
      "author.more": "More essays →",
      "author.aboutMore": "More about me →",
      "author.aboutEyebrow": "About Franklin",
      "author.stayInLoop": "Stay in the loop",
      "author.rssFeed": "RSS feed",
      "author.searchEssays": "Search essays",
      "comments.heading": "Comments",
      "comments.notConfigured": "Comments not configured yet.",
      "related.heading": "You might also like",
      "related.headingFallback": "Keep reading",
      "toc.label": "Contents",
      "lang.switchAria": "Switch language",
      "og.siteEyebrow": "Franklin Baldo's Digital Garden",
      "og.siteDescription":
        "Essays on AI agency, process metaphysics, and the architecture of legal systems.",
      "og.qrHint": "Scan to read",
      "archive.jumpToYear": "Jump to year:",
      "webmentions.heading": "Mentions across the web",
      "webmentions.like": "like",
      "webmentions.likes": "likes",
      "webmentions.repost": "repost",
      "webmentions.reposts": "reposts",
      "webmentions.from": "from",
      "webmentions.more": "more",
      "webmentions.someone": "someone",
      "webmentions.anonymous": "anonymous",
      "post.typeEssay": "Essay",
      "post.typeLetter": "Letter",
      "post.typeFiction": "Fiction",
      "post.typeTechnical": "Technical",
      "post.typeDialogue": "Dialogue",
      "archive.filterType": "Format:",
      "archive.filterAll": "All",
      "post.play": "▶ Play",
      "post.listenOnSuno": "Listen on Suno ↗",
      "post.otherVersions": "Other versions",
    },
    targets: {
      pt: {
        shortLabel: "PT",
        invitation: "Ler em Português",
        noTranslation: "Sem versão em português",
      },
    },
  },
  pt: {
    code: "pt",
    ...LANG_META.pt,
    ui: {
      "nav.home": "Início",
      "nav.archive": "Arquivo",
      "nav.tags": "Tags",
      "nav.projects": "Projetos",
      "nav.ranking": "Ranking",
      "nav.music": "Músicas",
      "nav.books": "Livros",
      "nav.search": "Buscar",
      "nav.about": "Sobre",
      "nav.menu": "Menu",
      "post.continueReading": "Continuar lendo →",
      "post.minutesRead": "min de leitura",
      "post.updated": "atualizado",
      "post.tags": "Tags:",
      "post.previousVersion": "Versão anterior",
      "post.prev": "← Anterior",
      "post.next": "Próximo →",
      "post.navLabel": "Navegação entre posts",
      "post.share": "Compartilhar",
      "post.partOf": "Parte",
      "post.of": "de",
      "post.inSeries": "na série",
      "post.series": ".",
      "post.allInSeries": "Todos os posts desta série",
      "post.thisPost": "este post",
      "series.navLabel": "Navegação da série",
      "featured.label": "Ensaio em destaque",
      "paths.heading": "Caminhos de leitura",
      "paths.blurb":
        "Sequências curadas para entrar no labirinto por uma porta específica.",
      "paths.startHere": "Começar →",
      "paths.essay": "ensaio",
      "paths.essays": "ensaios",
      "home.recent": "Ensaios recentes",
      "home.viewArchive": "Ver o arquivo completo →",
      "author.label": "Autor",
      "author.tagline":
        "Advogado e Procurador do Estado. Escreve sobre agentes de IA, metafísica do processo e design jurídico.",
      "author.more": "Mais ensaios →",
      "author.aboutMore": "Saiba mais sobre mim →",
      "author.aboutEyebrow": "Sobre Franklin",
      "author.stayInLoop": "Fique por dentro",
      "author.rssFeed": "Feed RSS",
      "author.searchEssays": "Buscar ensaios",
      "comments.heading": "Comentários",
      "comments.notConfigured": "Comentários ainda não configurados.",
      "related.heading": "Você também pode gostar",
      "related.headingFallback": "Continue lendo",
      "toc.label": "Conteúdo",
      "lang.switchAria": "Alterar idioma",
      "og.siteEyebrow": "Jardim Digital de Franklin Baldo",
      "og.siteDescription":
        "Ensaios sobre agentes de IA, metafísica do processo e a arquitetura dos sistemas jurídicos.",
      "og.qrHint": "Aponte para ler",
      "archive.jumpToYear": "Ir para o ano:",
      "webmentions.heading": "Menções na web",
      "webmentions.like": "curtida",
      "webmentions.likes": "curtidas",
      "webmentions.repost": "repostagem",
      "webmentions.reposts": "repostagens",
      "webmentions.from": "de",
      "webmentions.more": "mais",
      "webmentions.someone": "alguém",
      "webmentions.anonymous": "anônimo",
      "post.typeEssay": "Ensaio",
      "post.typeLetter": "Carta",
      "post.typeFiction": "Ficção",
      "post.typeTechnical": "Técnico",
      "post.typeDialogue": "Diálogo",
      "archive.filterType": "Formato:",
      "archive.filterAll": "Todos",
      "post.play": "▶ Tocar",
      "post.listenOnSuno": "Ouvir no Suno ↗",
      "post.otherVersions": "Outras versões",
    },
    targets: {
      en: {
        shortLabel: "EN",
        invitation: "Read in English",
        noTranslation: "No English version",
      },
    },
  },
};

function configFor(lang: string | undefined): LangConfig {
  return LANGUAGES[lang ?? _DEFAULT_LANG] ?? LANGUAGES[_DEFAULT_LANG];
}

export function t(lang: string | undefined, key: UIKey): string {
  const cfg = configFor(lang);
  return cfg.ui[key] ?? LANGUAGES[_DEFAULT_LANG].ui[key];
}

export function targetCopy(
  currentLang: string | undefined,
  targetLang: string
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

export function pick<T>(lang: string | undefined, dict: Record<string, T>): T {
  const key = lang ?? _DEFAULT_LANG;
  return dict[key] ?? dict[_DEFAULT_LANG] ?? (Object.values(dict)[0] as T);
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
  if (typeof window === "undefined") return _DEFAULT_LANG;
  const stored = localStorage.getItem("lang");
  if (stored && LANGUAGES[stored]) return stored;
  const navLang = navigator.language.toLowerCase();
  for (const cfg of Object.values(LANGUAGES)) {
    if (cfg.navMatch.some((m) => navLang.startsWith(m))) return cfg.code;
  }
  return _DEFAULT_LANG;
}

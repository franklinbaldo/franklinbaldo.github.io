import type { CollectionEntry } from "astro:content";
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
  "nav.menu",
  "nav.about",
  "nav.more",
  "nav.collections",
  "nav.playMusic",
  "nav.pauseMusic",
  "music.eyebrow",
  "music.play",
  "music.playAria",
  "music.variants",
  "music.onSuno",
  "music.coverAlt",
  "music.indexLabel",
  "music.navLabel",
  "music.allMusic",
  "post.rankLabel",
  "post.readingProgress",
  "post.borderRailText",
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
  "post.copied",
  "post.copyError",
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
  "archive.page",
  "archive.newer",
  "archive.older",
  "post.play",
  "post.playAriaLabel",
  "post.listenOnSuno",
  "post.coverAlt",
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
      "nav.menu": "Menu",
      "nav.about": "About",
      "nav.more": "More",
      "nav.collections": "Collections & lab",
      "nav.playMusic": "Play music",
      "nav.pauseMusic": "Pause music",
      "music.eyebrow": "Song",
      "music.play": "Listen now",
      "music.playAria": "Play",
      "music.variants": "Versions of this composition",
      "music.onSuno": "Open on Suno",
      "music.coverAlt": "Cover for",
      "music.indexLabel": "Music",
      "music.navLabel": "Music navigation",
      "music.allMusic": "All music",
      "post.rankLabel": "Hrönir rank",
      "post.readingProgress": "Reading progress",
      "post.borderRailText": "NOTES · FROM · THE · BORDER",
      "post.continueReading": "Continue reading →",
      "post.minutesRead": "min read",
      "post.updated": "updated",
      "post.tags": "Tags:",
      "post.previousVersion": "Previous version",
      "post.prev": "← Previous",
      "post.next": "Next →",
      "post.navLabel": "Post navigation",
      "post.share": "Share",
      "post.copied": "Link copied",
      "post.copyError": "Couldn't copy",
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
        "Writes, builds software, and makes music at the border of AI, philosophy, and literature.",
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
        "Essays, code, and music at the border of AI, philosophy, literature, and intelligent systems.",
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
      "archive.page": "Page",
      "archive.newer": "← Newer",
      "archive.older": "Older →",
      "post.play": "▶ Play",
      "post.playAriaLabel": "Play",
      "post.listenOnSuno": "Listen on Suno ↗",
      "post.coverAlt": "Cover of",
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
      "nav.menu": "Menu",
      "nav.about": "Sobre",
      "nav.more": "Mais",
      "nav.collections": "Coleções e laboratório",
      "nav.playMusic": "Tocar música",
      "nav.pauseMusic": "Pausar música",
      "music.eyebrow": "Canção",
      "music.play": "Ouvir agora",
      "music.playAria": "Reproduzir",
      "music.variants": "Versões desta composição",
      "music.onSuno": "Abrir no Suno",
      "music.coverAlt": "Capa de",
      "music.indexLabel": "Música",
      "music.navLabel": "Navegação musical",
      "music.allMusic": "Todas as músicas",
      "post.rankLabel": "ranking Hrönir",
      "post.readingProgress": "Progresso de leitura",
      "post.borderRailText": "NOTAS · DA · FRONTEIRA",
      "post.continueReading": "Continuar lendo →",
      "post.minutesRead": "min de leitura",
      "post.updated": "atualizado",
      "post.tags": "Tags:",
      "post.previousVersion": "Versão anterior",
      "post.prev": "← Anterior",
      "post.next": "Próximo →",
      "post.navLabel": "Navegação entre posts",
      "post.share": "Compartilhar",
      "post.copied": "Link copiado",
      "post.copyError": "Não foi possível copiar",
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
        "Escreve, programa e faz música na fronteira entre IA, filosofia e literatura.",
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
        "Ensaios, código e música na fronteira entre IA, filosofia, literatura e sistemas inteligentes.",
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
      "archive.page": "Página",
      "archive.newer": "← Mais recentes",
      "archive.older": "Mais antigos →",
      "post.play": "▶ Tocar",
      "post.playAriaLabel": "Tocar",
      "post.listenOnSuno": "Ouvir no Suno ↗",
      "post.coverAlt": "Capa de",
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

export function postUrl(entry: CollectionEntry<"blog">): string {
  const lang = entry.data.lang ?? _DEFAULT_LANG;
  const slug = entry.data.slug ?? entry.id;
  return `${urlPrefix(lang)}/blog/${slug}/`;
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

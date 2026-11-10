// Native Zola OG page cards. Retain literal title, translation, tags and QR values
// from the former Astro endpoints; no Astro route module is executed.
import { t } from "../../src/lib/i18n.ts";
export const pageCards = [
  { filename: "about-pt.png", qrSlug: "about-pt", fallbackSlug: "home-pt", card: {
    title: "Sobre Franklin Baldo",
    description: t("pt", "og.siteDescription"),
    tags: [],
    lang: "pt",
    kind: "home",
    path: "/pt/about/",

  } },
  { filename: "about.png", qrSlug: "about", fallbackSlug: "home", card: {
    title: "About Franklin Baldo",
    description: t("en", "og.siteDescription"),
    tags: [],
    lang: "en",
    kind: "home",
    path: "/about/",

  } },
  { filename: "archive-pt.png", qrSlug: "archive-pt", fallbackSlug: "home", card: {
    title: "Arquivo",
    description: t("pt", "og.siteDescription"),
    tags: ["ensaios", "escrita"],
    lang: "pt",
    kind: "home",
    path: "/pt/archive/",

  } },
  { filename: "archive.png", qrSlug: "archive", fallbackSlug: "home", card: {
    title: "Archive",
    description: t("en", "og.siteDescription"),
    tags: ["essays", "writing"],
    lang: "en",
    kind: "home",
    path: "/archive/",

  } },
  { filename: "books-pt.png", qrSlug: "books-pt", fallbackSlug: "home-pt", card: {
    title: "Livros",
    description:
      "Livros que li e gostei — seleção da minha estante no Goodreads.",
    tags: ["leitura", "livros"],
    lang: "pt",
    kind: "home",
    path: "/pt/livros/",

  } },
  { filename: "books.png", qrSlug: "books", fallbackSlug: "home", card: {
    title: "Books",
    description:
      "Books I've read and enjoyed — curated from my Goodreads shelf.",
    tags: ["reading", "books"],
    lang: "en",
    kind: "home",
    path: "/books/",

  } },
  { filename: "home-pt.png", qrSlug: "home-pt", fallbackSlug: "home", card: {
    title: "Franklin Baldo",
    description: t("pt", "og.siteDescription"),
    tags: [],
    lang: "pt",
    kind: "home",
    path: "/pt/",

  } },
  { filename: "home.png", qrSlug: "home", fallbackSlug: "home", card: {
    title: "Franklin Baldo",
    description: t("en", "og.siteDescription"),
    tags: [],
    lang: "en",
    kind: "home",
    path: "/",

  } },
  { filename: "music-pt.png", qrSlug: "music-pt", fallbackSlug: "home-pt", card: {
    title: "Músicas",
    description: "Músicas e playlists publicadas no Suno por Franklin Baldo.",
    tags: ["música", "suno"],
    lang: "pt",
    kind: "home",
    path: "/pt/musicas/",

  } },
  { filename: "music.png", qrSlug: "music", fallbackSlug: "home", card: {
    title: "Music",
    description: "Songs and playlists published on Suno by Franklin Baldo.",
    tags: ["music", "suno"],
    lang: "en",
    kind: "home",
    path: "/music/",

  } },
  { filename: "projects-pt.png", qrSlug: "projects-pt", fallbackSlug: "home-pt", card: {
    title: "Projetos",
    description:
      "Repositórios públicos e trabalho de código aberto de Franklin Baldo.",
    tags: ["código", "github"],
    lang: "pt",
    kind: "home",
    path: "/pt/projects/",

  } },
  { filename: "projects.png", qrSlug: "projects", fallbackSlug: "home", card: {
    title: "Projects",
    description: "Public repositories and open-source work by Franklin Baldo.",
    tags: ["code", "github"],
    lang: "en",
    kind: "home",
    path: "/projects/",

  } },
  { filename: "ranking-pt.png", qrSlug: "ranking-pt", fallbackSlug: "home-pt", card: {
    title: "Ranking",
    description:
      "Posts ranqueados por comparações par-a-par sob o sistema Hrönir.",
    tags: ["hronir", "ranking"],
    lang: "pt",
    kind: "home",
    path: "/pt/ranking/",

  } },
  { filename: "ranking.png", qrSlug: "ranking", fallbackSlug: "home", card: {
    title: "Ranking",
    description:
      "Essays ranked by pairwise comparison under the Hrönir system.",
    tags: ["hronir", "ranking"],
    lang: "en",
    kind: "home",
    path: "/ranking/",

  } },
  { filename: "search-pt.png", qrSlug: "search-pt", fallbackSlug: "home-pt", card: {
    title: "Busca",
    description: "Busca de texto completo pelos ensaios.",
    tags: ["busca"],
    lang: "pt",
    kind: "home",
    path: "/pt/search/",

  } },
  { filename: "search.png", qrSlug: "search", fallbackSlug: "home", card: {
    title: "Search",
    description: "Full-text search across all essays.",
    tags: ["search"],
    lang: "en",
    kind: "home",
    path: "/search/",

  } },
  { filename: "tags-pt.png", qrSlug: "tags-pt", fallbackSlug: "home", card: {
    title: "Etiquetas",
    description: t("pt", "og.siteDescription"),
    tags: ["tópicos", "índice"],
    lang: "pt",
    kind: "home",
    path: "/pt/tags/",

  } },
  { filename: "tags.png", qrSlug: "tags", fallbackSlug: "home", card: {
    title: "Tags",
    description: t("en", "og.siteDescription"),
    tags: ["topics", "index"],
    lang: "en",
    kind: "home",
    path: "/tags/",

  } }
];

// Native projection of the public Goodreads shelf, without an Astro runtime.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchGoodreadsBooks } from "../../src/lib/goodreads.ts";
import { escapeHtml as h, frontmatter, stableName } from "./content.mjs";

const filename = fileURLToPath(import.meta.url);
const GOODREADS_PROFILE = "https://www.goodreads.com/user/show/5942034";
const strings = {
  en: {
    title: "Books",
    description: "Books I've read and enjoyed, from my Goodreads shelf.",
    subtitle: "Books I've read and enjoyed — the rest are on my",
    shelf: "Goodreads shelf",
    error: "Couldn't load books right now.",
    empty: "No books are available right now.",
    directly: "See them directly on",
    favorites: "★ Favorites",
    all: "All",
    sort: "Sort",
    sortRating: "★ Rating",
    sortDate: "Date read",
    sortYear: "Year published",
    sortTitle: "Title A–Z",
    count: "books",
    ariaFilter: "Filter books",
    ariaSort: "Sort by",
    stars: "out of 5 stars",
    noFavorites: "No favorites to display. Choose All to see the full shelf.",
    jsonLdName: "Books Read by Franklin Baldo",
    jsonLdDescription:
      "Books Franklin Baldo has read and recommends, sourced from Goodreads.",
  },
  pt: {
    title: "Livros",
    description: "Livros que já li e gostei, da minha estante no Goodreads.",
    subtitle: "Livros que li e gostei — os demais estão na minha",
    shelf: "estante no Goodreads",
    error: "Não foi possível carregar os livros agora.",
    empty: "Nenhum livro disponível no momento.",
    directly: "Veja diretamente no",
    favorites: "★ Favoritos",
    all: "Todos",
    sort: "Ordenar",
    sortRating: "★ Avaliação",
    sortDate: "Data de leitura",
    sortYear: "Ano publicado",
    sortTitle: "Título A–Z",
    count: "livros",
    ariaFilter: "Filtrar livros",
    ariaSort: "Ordenar por",
    stars: "de 5 estrelas",
    noFavorites:
      "Nenhum favorito para mostrar. Escolha Todos para ver a estante completa.",
    jsonLdName: "Livros lidos por Franklin Baldo",
    jsonLdDescription:
      "Livros que Franklin Baldo leu e recomenda, obtidos do Goodreads.",
  },
};

// The canonical helper has no timeout option. Isolating it bounds the entire
// request, body read and XML parse, and leaves no pending request in the build.
export function loadBooks(timeout = 12_000) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx/esm", filename, "--fetch-goodreads"],
    {
      encoding: "utf8",
      timeout: Math.max(1, Math.min(Number(timeout) || 12_000, 20_000)),
      killSignal: "SIGKILL",
      maxBuffer: 4 * 1024 * 1024,
    }
  );
  if (result.error?.code === "ETIMEDOUT")
    throw new Error("Goodreads request timed out");
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(result.stderr.trim() || "Goodreads request failed");
  const books = JSON.parse(result.stdout);
  if (!Array.isArray(books)) throw new Error("Invalid Goodreads response");
  return books;
}

function webUrl(value, fallback = "") {
  try {
    const url = new URL(String(value ?? ""));
    return ["https:", "http:"].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}

const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

export function renderBooksPage(lang, rawBooks, error = null) {
  const L = strings[lang];
  if (!L) throw new Error(`Unsupported books language: ${lang}`);
  const path = lang === "pt" ? "/pt/livros/" : "/books/";
  const books = rawBooks
    .map((book) => ({
      ...book,
      title: String(book.title ?? ""),
      author_name: String(book.author_name ?? ""),
      user_rating: Math.max(
        0,
        Math.min(5, Math.round(Number(book.user_rating) || 0))
      ),
      user_read_at: String(book.user_read_at ?? ""),
      book_published: String(book.book_published ?? ""),
      link: webUrl(book.link, GOODREADS_PROFILE),
      book_image_url: webUrl(book.book_image_url),
    }))
    .sort(
      (a, b) =>
        b.user_rating - a.user_rating || a.title.localeCompare(b.title, lang)
    );
  const liked = books.filter((book) => book.user_rating >= 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: L.jsonLdName,
    description: L.jsonLdDescription,
    url: `https://franklinbaldo.github.io${path}`,
    numberOfItems: liked.length,
    itemListElement: liked.slice(0, 20).map((book, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Book",
        name: book.title,
        author: { "@type": "Person", name: book.author_name },
        url: book.link,
      },
    })),
  };
  const cards = books
    .map(
      (
        book
      ) => `<article class="book-card" data-rating="${book.user_rating}" data-date="${h(book.user_read_at)}" data-year="${h(book.book_published)}" data-title="${h(book.title)}"${book.user_rating < 4 ? ' hidden aria-hidden="true"' : ""}>
<a href="${h(book.link)}" class="cover-link" tabindex="-1" aria-hidden="true">${book.book_image_url ? `<img src="${h(book.book_image_url)}" alt="" loading="lazy" width="200" height="300">` : '<span class="book-cover-placeholder" aria-hidden="true">📖</span>'}</a>
<div class="book-info"><h2><a href="${h(book.link)}">${h(book.title)}</a></h2><p class="author">${h(book.author_name)}</p>${book.user_rating > 0 ? `<p class="rating" aria-label="${h(`${book.title} — ${book.user_rating} ${L.stars}`)}">${"★".repeat(book.user_rating)}${"☆".repeat(5 - book.user_rating)}</p>` : ""}${Number(book.book_published) > 0 ? `<p class="year"><small>${h(book.book_published)}</small></p>` : ""}</div>
</article>`
    )
    .join("\n");
  const fallback = `<p class="books-fallback"><small>${h(error ? L.error : L.empty)} ${h(L.directly)} <a href="${GOODREADS_PROFILE}">Goodreads</a>.</small></p>`;
  const controls = `<div class="books-controls">
<div class="filter-pills" role="group" aria-label="${h(L.ariaFilter)}">
<button type="button" class="pill active" data-filter="liked" aria-pressed="true">${h(L.favorites)} <span class="pill-count">${liked.length}</span></button>
<button type="button" class="pill" data-filter="all" aria-pressed="false">${h(L.all)} <span class="pill-count">${books.length}</span></button>
</div>
<label class="sort-label"><span>${h(L.sort)}</span><select id="sort-select" aria-label="${h(L.ariaSort)}"><option value="rating-desc">${h(L.sortRating)}</option><option value="date-desc">${h(L.sortDate)}</option><option value="year-desc">${h(L.sortYear)}</option><option value="title-asc">${h(L.sortTitle)}</option></select></label>
</div>
<span id="books-filter-status" class="sr-only" role="status" aria-live="polite" data-count-suffix="${h(L.count)}"></span>
<p class="results-info"><small><span id="visible-count">${liked.length}</span> ${h(L.count)}</small></p>
<p id="books-empty-filter"${liked.length ? " hidden" : ""}>${h(L.noFavorites)}</p>
<div class="books-grid" id="books-grid">${cards}</div>`;
  const body = `<section id="books-page" class="books-page" data-lang="${lang}" data-pagefind-body>
<hgroup class="collection-header"><h1>${h(L.title)}</h1><p><small>${h(L.subtitle)} <a href="${GOODREADS_PROFILE}">${h(L.shelf)}</a>.</small></p></hgroup>
${error || !books.length ? fallback : ""}
${books.length ? controls : ""}
</section>\n`;
  return {
    path,
    content:
      frontmatter(
        {
          title: L.title,
          description: L.description,
          path,
          template: "books.html",
        },
        {
          lang,
          kind: "books",
          translations:
            lang === "en" ? { pt: "/pt/livros/" } : { en: "/books/" },
          hero_image: lang === "en" ? "/og/books.png" : "/og/books-pt.png",
          books_jsonld: json(jsonLd),
        }
      ) + body,
  };
}

function writeBooksPages() {
  const target = resolve(".cache/zola-site");
  if (!existsSync(join(target, "config.toml")))
    throw new Error("Run scripts/zola/prepare.mjs before the books exporter");
  let books = [];
  let error = null;
  try {
    books = loadBooks();
  } catch (failure) {
    error = failure instanceof Error ? failure.message : String(failure);
    console.warn(
      `[books] failed to fetch Goodreads RSS: ${error.slice(0, 200)}`
    );
  }
  for (const lang of ["en", "pt"]) {
    const { path, content } = renderBooksPage(lang, books, error);
    const output = join(target, `content/pages/${stableName(path)}.md`);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, content);
  }
  console.log(
    `Zola books: ${books.length} books; bilingual ${error ? "error fallback" : "shelf"}`
  );
}

if (process.argv[1] && resolve(process.argv[1]) === filename) {
  if (process.argv.includes("--fetch-goodreads")) {
    try {
      process.stdout.write(JSON.stringify(await fetchGoodreadsBooks()));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  } else writeBooksPages();
}

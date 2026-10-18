// Native music projection: only public local catalog records are publishable.
// Astro's literal client script/styles remain reusable source assets, without
// importing or compiling any Astro component or requiring a network request.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import matter from "gray-matter";
import ts from "typescript";
import { escapeHtml as h, frontmatter, stableName } from "./content.mjs";
import { computeRatings } from "../../src/suno-rank/ranking.ts";
import { getRanking } from "../../src/lib/hronir-rank.ts";

const target = resolve(".cache/zola-site");
const manifest = JSON.parse(
  readFileSync(join(target, "manifest.json"), "utf8")
);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clips = readFileSync("data/suno-catalog.jsonl", "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((clip) => clip.isPublic === true && UUID.test(clip.id))
  .sort(
    (a, b) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")) ||
      a.id.localeCompare(b.id)
  );
const clipById = new Map(clips.map((clip) => [clip.id, clip]));
if (clipById.size !== clips.length) throw new Error("Duplicate public Suno ID");
const postById = new Map();
const genresById = new Map();
const idsByKey = new Map();
for (const post of manifest.posts) {
  if (post.data.postType !== "music") continue;
  const tracks = [
    { sunoId: post.data.sunoId, genre: post.data.genre },
    ...(post.data.tracks ?? []),
  ].filter((track) => clipById.has(track.sunoId));
  for (const track of tracks) {
    // Prefer the song's original Portuguese post when translations exist.
    if (!postById.has(track.sunoId) || post.data.lang === "pt")
      postById.set(track.sunoId, post.path);
    if (track.genre?.length)
      genresById.set(
        track.sunoId,
        track.genre.map((genre) => genre.toLowerCase().trim()).filter(Boolean)
      );
  }
  if (post.data.translationKey)
    idsByKey.set(post.data.translationKey, [
      ...(idsByKey.get(post.data.translationKey) ?? []),
      ...tracks.map((track) => track.sunoId),
    ]);
}
const rankedIds = getRanking().flatMap((row) => idsByKey.get(row.key) ?? []);
const songIds = [...new Set([...rankedIds, ...clips.map((clip) => clip.id)])];
const safeImage = (value) => (/^https?:\/\//i.test(value ?? "") ? value : "");
const songs = songIds.map((id) => {
  const clip = clipById.get(id);
  return {
    id,
    title: clip.title || "(sem título)",
    imageUrl: safeImage(clip.imageUrl),
    postUrl: postById.get(id) || "",
  };
});
function write(path, value) {
  const destination = join(target, path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, value);
}
const json = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
const firstSong = songs.slice(0, 1);
const bootstrap =
  Buffer.byteLength(h(JSON.stringify(firstSong))) <= 2048 ? firstSong : [];
write("music-player-bootstrap.json", JSON.stringify(bootstrap));
write("static/music-player.json", JSON.stringify(songs) + "\n");

const ratings = computeRatings();
const ratingById = new Map(
  ratings.map((row, index) => [row.key, { ...row, rank: index + 1 }])
);
const tiers = readdirSync("knowledge/music-tiers")
  .filter((filename) => filename.endsWith(".md"))
  .sort()
  .map((filename) => ({
    ...matter(readFileSync(join("knowledge/music-tiers", filename), "utf8"))
      .data,
    slug: filename.slice(0, -3),
  }))
  .filter((card) => clipById.has(card.suno_id))
  .sort(
    (a, b) =>
      (ratingById.get(a.suno_id)?.rank ?? Infinity) -
        (ratingById.get(b.suno_id)?.rank ?? Infinity) ||
      a.title.localeCompare(b.title)
  );
if (new Set(tiers.map((card) => card.suno_id)).size !== tiers.length)
  throw new Error("Duplicate public music-tier Suno ID");
const TIER_ORDER = ["S", "A", "B", "C", "D", "F"];
for (const card of tiers)
  if (
    !TIER_ORDER.includes(card.quality_tier) ||
    !TIER_ORDER.includes(card.interest_tier)
  )
    throw new Error(`Invalid tier on ${card.slug}`);
const strings = {
  en: {
    title: "Music tiers",
    description:
      "Canonical tiers for public Suno recordings, with audio ranking and the full catalog.",
    intro:
      'Tier board and public-song catalog from <a href="https://suno.com/@franklinbaldo">@franklinbaldo</a> on Suno, sorted by most recent · updated from the public catalog at build time.',
    tiers:
      "Letters are canonical OKF cards per Suno recording. The music Hrönir compares audio directly; sparse coverage stays low-confidence instead of becoming fake precision.",
    quality: "quality",
    interest: "interest",
    summaryQuality: "musical quality",
    summaryInterest: "interest / replay",
    confidence: "conf.",
    emptyTier: "empty — no recording classified here yet",
    emptyBoard: "No public recording has a tier card yet.",
    details: "View music card",
    strengths: "What supports it",
    problems: "What holds it back",
    history: "Tier history",
    reviewed: "reviewed",
    rank: "audio rank",
    wins: "W/N",
    listen: "listen in catalog ↓",
    favorites: "Favorites",
    recent: "Recently played",
    filter: "Filter by genre",
    all: "All",
    allSongs: "All songs",
    song: "song",
    songs: "songs",
    play: "Play",
    playAll: "Play all",
    shuffle: "Shuffle",
    sort: "Sort by",
    newest: "Newest first",
    oldest: "Oldest first",
    longest: "Longest",
    shortest: "Shortest",
    cover: "Cover art for",
    favorite: "Add to favorites",
    lyrics: "Lyrics",
    empty: "No public songs are available in the catalog yet.",
  },
  pt: {
    title: "Tiers de músicas",
    description:
      "Tiers canônicos das gravações públicas no Suno, com ranking de áudio e catálogo completo.",
    intro:
      'Tier board e catálogo das músicas públicas de <a href="https://suno.com/@franklinbaldo">@franklinbaldo</a> no Suno, ordenadas pelas mais recentes · atualizado a partir do catálogo público no build.',
    tiers:
      "As letras são fichas OKF canônicas por gravação Suno. O Hrönir de música compara o áudio diretamente; com pouca cobertura, a confiança fica baixa em vez de inventar precisão.",
    quality: "qualidade",
    interest: "interesse",
    summaryQuality: "qualidade musical",
    summaryInterest: "interesse / replay",
    confidence: "conf.",
    emptyTier: "vazio — nenhuma gravação classificada aqui ainda",
    emptyBoard: "Nenhuma gravação pública tem ficha de tier ainda.",
    details: "Ver ficha da música",
    strengths: "O que sustenta",
    problems: "O que segura",
    history: "Histórico do tier",
    reviewed: "revisão",
    rank: "ranking de áudio",
    wins: "V/N",
    listen: "ouvir no catálogo ↓",
    favorites: "Favoritas",
    recent: "Tocadas recentemente",
    filter: "Filtrar por gênero",
    all: "Todas",
    allSongs: "Todas as músicas",
    song: "música",
    songs: "músicas",
    play: "Ouvir",
    playAll: "Tocar todas",
    shuffle: "Aleatório",
    sort: "Ordenar por",
    newest: "Mais recentes",
    oldest: "Mais antigas",
    longest: "Mais longas",
    shortest: "Mais curtas",
    cover: "Capa de",
    favorite: "Adicionar aos favoritos",
    lyrics: "Letra",
    empty: "Nenhuma música pública disponível no catálogo ainda.",
  },
};
const songHref = (id) => `https://suno.com/song/${id}`;
function tierBoard(L, lang) {
  const count = (field, label) =>
    `<div><span>${h(label)}</span><div class="tier-counts">${TIER_ORDER.map((tier) => `<b>${tier} ${tiers.filter((card) => card[field] === tier).length}</b>`).join("")}</div></div>`;
  const list = (title, values) =>
    values?.length
      ? `<div><h4>${h(title)}</h4><ul>${values.map((value) => `<li>${h(value)}</li>`).join("")}</ul></div>`
      : "";
  const cards = (tier) =>
    tiers
      .filter((card) => card.quality_tier === tier)
      .map((card) => {
        const clip = clipById.get(card.suno_id);
        const row = ratingById.get(card.suno_id);
        const evidence = [
          [L.rank, row ? `#${row.rank}` : "—"],
          [
            "ordinal",
            row
              ? row.ordinal.toLocaleString(lang === "pt" ? "pt-BR" : "en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—",
          ],
          [L.wins, `${row?.wins ?? 0}/${row?.appearances ?? 0}`],
        ];
        const details =
          list(L.strengths, card.strengths) +
          list(L.problems, card.open_problems) +
          list(L.history, card.history) +
          (card.note ? `<p class="tier-note">${h(card.note)}</p>` : "");
        const reviewed =
          card.reviewed_at instanceof Date
            ? card.reviewed_at.toISOString().slice(0, 10)
            : String(card.reviewed_at ?? "");
        return `<article class="tier-card" id="music-tier-${h(card.slug)}"><div class="tier-badges"><span>${h(L.quality)} ${h(card.quality_tier)}</span><span>${h(L.interest)} ${h(card.interest_tier)}</span><span>${h(L.confidence)} ${h(card.confidence)}</span></div><h3><a href="${songHref(card.suno_id)}">${h(clip.title || card.title)}</a></h3><p>${h(card.summary)}</p><div class="tier-evidence">${evidence.map(([label, value]) => `<div><strong>${h(value)}</strong><span>${h(label)}</span></div>`).join("")}</div>${details ? `<details><summary>${h(L.details)}</summary><div class="tier-details">${details}</div></details>` : ""}<footer><small>${h(L.reviewed)} ${h(reviewed)}</small><nav aria-label="${h(clip.title || card.title)}"><a href="#${card.suno_id}">${h(L.listen)}</a></nav></footer></article>`;
      })
      .join("");
  return `<section class="tier-shell" id="music-tiers" aria-labelledby="music-tiers-heading"><header class="tier-header"><div><p class="tier-kicker">TIER BOARD</p><h2 id="music-tiers-heading">${h(L.title)}</h2></div><p>${h(L.tiers)}</p></header>${tiers.length ? `<div class="tier-scoreboard" aria-label="${h(L.title)}">${count("quality_tier", L.summaryQuality)}${count("interest_tier", L.summaryInterest)}</div><div class="tier-board">${TIER_ORDER.map((tier) => `<section class="tier-row tier-${tier.toLowerCase()}" aria-label="Tier ${tier}"><div class="tier-letter" aria-hidden="true">${tier}</div><div class="tier-content"><div class="tier-cards">${cards(tier) || `<p class="tier-empty">${h(L.emptyTier)}</p>`}</div></div></section>`).join("")}</div>` : `<p class="tier-empty-board">${h(L.emptyBoard)}</p>`}</section>`;
}
function duration(seconds) {
  if (!(Number(seconds) > 0)) return "";
  const value = Math.round(Number(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}
function songCard(clip, L, lang) {
  const title = clip.title || (lang === "pt" ? "(sem título)" : "(untitled)");
  const image = safeImage(clip.imageUrl);
  const date = new Date(clip.createdAt);
  const formattedDate = Number.isFinite(date.valueOf())
    ? date.toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "UTC",
      })
    : "";
  const tags = String(clip.styleTags || "")
    .split(/[,;]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
  return `<article class="song-card" id="${clip.id}" data-suno-id="${clip.id}" data-date="${h(clip.createdAt || "")}" data-duration="${h(Number(clip.durationSeconds) || 0)}" data-genres="${h((genresById.get(clip.id) ?? []).join(","))}" data-title="${h(title)}" data-image="${h(image)}"><a href="${songHref(clip.id)}" class="cover" aria-label="${h(`${L.play} ${title}`)}">${image ? `<img src="${h(image)}" alt="${h(`${L.cover} ${title}`)}" loading="lazy" width="300" height="300">` : `<span aria-hidden="true">♪</span>`}</a><header><h3><a href="${songHref(clip.id)}">${h(title)}</a></h3><p><small>${formattedDate ? `<time datetime="${h(clip.createdAt)}">${h(formattedDate)}</time>` : ""}${duration(clip.durationSeconds) ? ` · ${duration(clip.durationSeconds)}` : ""}</small></p></header><a class="song-play" href="${songHref(clip.id)}">▶ ${h(L.play)}</a>${tags.length ? `<p class="tags">${tags.map((tag) => `<kbd>${h(tag)}</kbd>`).join("")}</p>` : ""}<footer><div class="card-footer-row"><button class="fav-btn" type="button" data-suno-id="${clip.id}" aria-label="${h(`${L.favorite}: ${title}`)}" aria-pressed="false">♡</button></div>${String(clip.lyricsPrompt ?? "").trim() ? `<details><summary><small>${h(L.lyrics)}</small></summary><pre class="lyrics">${h(clip.lyricsPrompt)}</pre></details>` : ""}</footer></article>`;
}
const genres = [...new Set([...genresById.values()].flat())].sort();
const showGenres =
  genres.length >= 2 &&
  genres.length <= 25 &&
  genres.every((genre) => genre.length <= 40);
for (const lang of ["en", "pt"]) {
  const L = strings[lang];
  const path = lang === "pt" ? "/pt/musicas/" : "/music/";
  const body = `<div class="music-content" data-music-lang="${lang}"><hgroup><h1>${h(L.title)}</h1><p><small>${L.intro}</small></p></hgroup>${tierBoard(L, lang)}<section id="favorites-section" hidden><h2>${h(L.favorites)}</h2><div class="songs-grid" id="favorites-grid"></div></section><section id="history-section" hidden><h2>${h(L.recent)}</h2><div class="history-rail" id="history-rail"></div></section><section>${showGenres ? `<div class="genre-chips" id="genre-chips" role="group" aria-label="${h(L.filter)}"><button class="genre-chip active" data-genre="all" type="button" aria-pressed="true">${h(L.all)}</button>${genres.map((genre) => `<button class="genre-chip" data-genre="${h(genre)}" type="button" aria-pressed="false">${h(genre)}</button>`).join("")}</div>` : ""}<p class="genre-filter-status" id="genre-filter-status" role="status" aria-live="polite">${clips.length} ${h(clips.length === 1 ? L.song : L.songs)}</p><div class="songs-header"><h2>${h(L.allSongs)} <small>(${clips.length})</small></h2><div class="songs-controls"><button id="gmp-play-all" type="button">▶ ${h(L.playAll)}</button><button id="gmp-shuffle-all" type="button">⇌ ${h(L.shuffle)}</button><select id="sort-songs" aria-label="${h(L.sort)}"><option value="newest">${h(L.newest)}</option><option value="oldest">${h(L.oldest)}</option><option value="duration-desc">${h(L.longest)}</option><option value="duration-asc">${h(L.shortest)}</option></select></div></div><div class="songs-grid" id="songs-grid">${clips.map((clip) => songCard(clip, L, lang)).join("") || `<p>${h(L.empty)}</p>`}</div></section></div>`;
  const structured = {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    name: L.title,
    description: L.description,
    url: `https://franklinbaldo.github.io${path}`,
    numTracks: clips.length,
    track: clips.slice(0, 20).map((clip) => ({
      "@type": "MusicRecording",
      name: clip.title || "(sem título)",
      url: songHref(clip.id),
      datePublished: clip.createdAt?.split("T")[0],
      ...(Number(clip.durationSeconds) > 0
        ? { duration: `PT${Math.round(Number(clip.durationSeconds))}S` }
        : {}),
    })),
  };
  write(
    `content/pages/${stableName(path)}.md`,
    frontmatter(
      {
        title: L.title,
        description: L.description,
        path,
        template: "music.html",
        in_search_index: false,
      },
      {
        kind: "music",
        lang,
        translations: { en: "/music/", pt: "/pt/musicas/" },
        music_jsonld: json(structured),
      }
    ) +
      body +
      "\n"
  );
}

function literal(source, tag) {
  const match = source.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`)
  );
  if (!match) throw new Error(`Missing literal ${tag} asset`);
  return match[1];
}
const playerSource = readFileSync(
  "src/components/GlobalMusicPlayer.astro",
  "utf8"
);
let playerScript = literal(playerSource, "script").replaceAll(
  "astro:page-load",
  "zola:page-load"
);
// Persisted chrome must reflect the active language after native navigation.
playerScript = playerScript.replace(
  "    upgradeLegacyAudio();",
  "    upgradeLegacyAudio();\n    localizePlayer();"
);
// Notify the gallery in the same document when the player favorite changes.
playerScript = playerScript.replace(
  "        setFavoriteState(id);\n      });",
  "        setFavoriteState(id);\n        player.dataset.favorites = favorites().join(',');\n      });"
);
// A close while the lazy request is in flight must not reopen the player.
playerScript = playerScript.replace(
  "      let current = 0;",
  "      let current = 0;\n      let playbackRequest = 0;"
);
playerScript = playerScript.replace(
  "        await loadCatalog();\n        const index = songs.findIndex",
  "        const request = ++playbackRequest;\n        await loadCatalog();\n        if (request !== playbackRequest) return;\n        const index = songs.findIndex"
);
playerScript = playerScript.replace(
  "        const song = index >= 0 ? songs[index] : null;",
  "        if (index < 0) return;\n        const song = songs[index];"
);
playerScript = playerScript.replace(
  '      close.addEventListener("click", () => {',
  '      close.addEventListener("click", () => {\n        playbackRequest++;'
);
playerScript = playerScript.replace(
  "        void loadCatalog().then(() => {",
  "        const request = ++playbackRequest;\n        void loadCatalog().then(() => {\n          if (request !== playbackRequest) return;"
);
// Do not reset a filtered/shuffled queue on every next/previous click.
// The original loadCatalog already returns early once fetched successfully.
const localize = `
function localizePlayer() {
  const pt = document.documentElement.lang.startsWith('pt');
  const labels = pt ? ['Player de músicas','Anterior','Próxima','Favoritar','Fechar player','Abrir no Suno ↗','Tocando agora:'] : ['Music player','Previous','Next','Favorite','Close player','Open on Suno ↗','Now playing:'];
  const player = document.getElementById('gmp');
  if (!player) return;
  player.setAttribute('aria-label', labels[0]);
  ['gmp-prev','gmp-next','gmp-fav','gmp-close'].forEach((id, i) => document.getElementById(id)?.setAttribute('aria-label', labels[i+1]));
  const suno = document.getElementById('gmp-suno-link');
  if (suno) suno.textContent = labels[5];
  player.dataset.nowPlaying = labels[6];
}
`;
const compiled = ts.transpileModule(localize + playerScript, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
  reportDiagnostics: true,
});
if (
  compiled.diagnostics?.some(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  )
)
  throw new Error("Player TypeScript transpilation failed");
write(
  "static/js/music-player.js",
  `// Reused literal GlobalMusicPlayer client code; no Astro runtime.\n(() => {\n${compiled.outputText}\n})();\n`
);
const tokens = `:root{--pico-background-color:var(--paper);--pico-card-background-color:var(--surface);--pico-color:var(--ink);--pico-muted-color:var(--muted);--pico-muted-border-color:var(--line);--pico-primary:var(--accent);--pico-primary-inverse:var(--surface);--pico-code-background-color:var(--code);--pico-border-radius:.5rem;--radius-medium:.6rem;--radius-large:.9rem;--pico-font-family-sans-serif:system-ui,sans-serif;--pico-font-family-serif:Georgia,serif}\n`;
write("static/css/music-player.css", tokens + literal(playerSource, "style"));
const galleryCss = literal(
  readFileSync("src/pages/music.astro", "utf8"),
  "style"
);
const tierCss = literal(
  readFileSync("src/components/TierBoard.astro", "utf8"),
  "style"
);
const modernCss = readFileSync("src/styles/music.css", "utf8").replaceAll(
  "main:has(#songs-grid) > hgroup",
  "main:has(#songs-grid) .music-content > hgroup"
);
write(
  "static/css/music.css",
  galleryCss +
    "\n" +
    tierCss +
    "\n" +
    modernCss +
    "\n.music-content [hidden]{display:none!important}.song-play{display:block;text-align:center;padding:.5rem;border:1px solid var(--line);border-radius:.4rem}.song-card .lyrics{font-family:inherit}.music-content .history-item button{padding:0;border:0;background:none}.song-card .cover>span{display:grid;place-items:center;aspect-ratio:1;font-size:4rem}\n"
);
console.log(
  `Native music: ${clips.length} public songs, ${tiers.length} public tier cards, 2 routes; player bootstrap ${Buffer.byteLength(h(JSON.stringify(bootstrap)))} B`
);

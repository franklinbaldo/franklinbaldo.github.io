/**
 * youtube-weekly.gs
 *
 * Google Apps Script que coleta o histórico de vídeos assistidos na semana
 * e cria dois posts no blog (PT + EN) via GitHub API.
 *
 * SETUP (uma vez só):
 *  1. No editor GAS: Extensions → Advanced Services → ativar "YouTube Data API v3"
 *  2. Criar um GitHub Personal Access Token com permissão "Contents: Read and write"
 *     em https://github.com/settings/tokens
 *  3. No editor GAS: Project Settings → Script Properties → adicionar:
 *       GITHUB_TOKEN  →  ghp_seu_token_aqui
 *       GITHUB_REPO   →  franklinbaldo/franklinbaldo.github.io
 *       GITHUB_BRANCH →  main
 *  4. Para rodar automaticamente: Triggers → Add Trigger
 *       Function: createWeeklyPost  |  Event: Time-driven  |  Weekly
 */

// ─── Config ────────────────────────────────────────────────────────────────

const PROPS = PropertiesService.getScriptProperties();
const GITHUB_TOKEN = PROPS.getProperty("GITHUB_TOKEN");
const GITHUB_REPO =
  PROPS.getProperty("GITHUB_REPO") || "franklinbaldo/franklinbaldo.github.io";
const GITHUB_BRANCH = PROPS.getProperty("GITHUB_BRANCH") || "main";

// ─── Entry point ───────────────────────────────────────────────────────────

function createWeeklyPost() {
  const videos = getWatchHistoryThisWeek();

  if (videos.length === 0) {
    console.log("Nenhum vídeo assistido esta semana.");
    return;
  }

  const { mondayDate, sundayDate } = getWeekRange();
  const translationKey = `youtube-week-${formatDate(mondayDate)}`;

  const ptContent = buildMarkdown(
    videos,
    mondayDate,
    sundayDate,
    "pt",
    translationKey
  );
  const enContent = buildMarkdown(
    videos,
    mondayDate,
    sundayDate,
    "en",
    translationKey
  );

  const ptSlug = `${formatDate(mondayDate)}-youtube-da-semana`;
  const enSlug = `${formatDate(mondayDate)}-youtube-weekly-watch`;

  pushToGithub(
    `src/content/blog/${ptSlug}.md`,
    ptContent,
    `post: youtube semanal ${formatDate(mondayDate)}`
  );
  pushToGithub(
    `src/content/blog/${enSlug}.md`,
    enContent,
    `post: youtube weekly ${formatDate(mondayDate)}`
  );

  console.log(`Posts criados: ${ptSlug}.md e ${enSlug}.md`);
}

// ─── YouTube ───────────────────────────────────────────────────────────────

function getWatchHistoryThisWeek() {
  const { mondayDate } = getWeekRange();
  const cutoff = mondayDate.getTime();
  const videos = [];

  let pageToken = null;

  do {
    const params = {
      playlistId: "HL", // ID especial do YouTube para Watch History
      maxResults: 50,
      part: "snippet,contentDetails",
    };
    if (pageToken) params.pageToken = pageToken;

    let response;
    try {
      response = YouTube.PlaylistItems.list("snippet,contentDetails", params);
    } catch (e) {
      console.error("Erro ao acessar YouTube API:", e.message);
      break;
    }

    for (const item of response.items || []) {
      const publishedAt = new Date(item.snippet.publishedAt); // data em que você assistiu
      if (publishedAt.getTime() < cutoff) {
        pageToken = null; // para o loop — chegamos em vídeos anteriores à semana
        break;
      }

      videos.push({
        title: item.snippet.title,
        channel: item.snippet.videoOwnerChannelTitle || "",
        videoId: item.contentDetails.videoId,
        watchedAt: publishedAt,
      });
    }

    pageToken = response.nextPageToken || null;
  } while (pageToken);

  // remove duplicatas (mesmo vídeo assistido mais de uma vez)
  const seen = new Set();
  return videos.filter((v) => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });
}

// ─── Markdown builder ──────────────────────────────────────────────────────

function buildMarkdown(videos, mondayDate, sundayDate, lang, translationKey) {
  const isPT = lang === "pt";
  const weekLabel = `${formatDateLong(mondayDate, lang)} – ${formatDateLong(sundayDate, lang)}`;

  const title = isPT
    ? `YouTube da semana: ${weekLabel}`
    : `YouTube weekly: ${weekLabel}`;

  const description = isPT
    ? `${videos.length} vídeos que assisti entre ${weekLabel}.`
    : `${videos.length} videos I watched between ${weekLabel}.`;

  const intro = isPT
    ? `Vídeos que assisti esta semana — sem curadoria, sem julgamento, só o que estava no meu histórico.`
    : `Videos I watched this week — no curation, no judgment, just what was in my history.`;

  const videoLines = videos
    .map((v) => {
      const url = `https://www.youtube.com/watch?v=${v.videoId}`;
      const day = formatDateShort(v.watchedAt, lang);
      return `- [${escapeYaml(v.title)}](${url}) — **${v.channel}** *(${day})*`;
    })
    .join("\n");

  const tags = isPT
    ? ["youtube", "semana", "vídeos", "curadoria"]
    : ["youtube", "weekly", "videos", "curation"];

  const frontmatter = [
    "---",
    `title: "${escapeYaml(title)}"`,
    `description: "${escapeYaml(description)}"`,
    `date: "${formatDate(mondayDate)}"`,
    `lang: ${lang}`,
    `translationKey: ${translationKey}`,
    `tags:`,
    ...tags.map((t) => `  - ${t}`),
    `draft: false`,
    `author: franklin`,
    "---",
  ].join("\n");

  return `${frontmatter}\n\n${intro}\n\n## Vídeos\n\n${videoLines}\n`;
}

// ─── GitHub API ────────────────────────────────────────────────────────────

function pushToGithub(path, content, commitMessage) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const encoded = Utilities.base64Encode(content, Utilities.Charset.UTF_8);

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // verifica se o arquivo já existe (pra pegar o sha, necessário para update)
  let sha = null;
  const checkResp = UrlFetchApp.fetch(apiUrl, {
    method: "get",
    headers,
    muteHttpExceptions: true,
  });
  if (checkResp.getResponseCode() === 200) {
    sha = JSON.parse(checkResp.getContentText()).sha;
  }

  const body = {
    message: commitMessage,
    content: encoded,
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;

  const resp = UrlFetchApp.fetch(apiUrl, {
    method: "put",
    headers,
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  const code = resp.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error(`GitHub API error ${code}: ${resp.getContentText()}`);
  }
}

// ─── Date helpers ──────────────────────────────────────────────────────────

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=dom, 1=seg, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() + diffToMonday);
  mondayDate.setHours(0, 0, 0, 0);

  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  sundayDate.setHours(23, 59, 59, 999);

  return { mondayDate, sundayDate };
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateShort(d, lang) {
  return d.toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateLong(d, lang) {
  return d.toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", {
    day: "numeric",
    month: "long",
  });
}

function escapeYaml(str) {
  return (str || "").replace(/"/g, '\\"');
}

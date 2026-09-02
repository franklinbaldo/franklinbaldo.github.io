import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER = "franklinbaldo";
const SCHEMA_VERSION = "repo-factory-v1";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outputPath = resolve(root, "src/generated/repo-factory.json");
const optional = process.argv.includes("--optional");
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";

const now = new Date();
const day = 24 * 60 * 60 * 1000;
const since = {
  day: new Date(now.getTime() - day),
  week: new Date(now.getTime() - 7 * day),
  month: new Date(now.getTime() - 30 * day),
};

function runGh(args) {
  return execFileSync("gh", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    env: {
      ...process.env,
      ...(token ? { GH_TOKEN: token } : {}),
    },
  });
}

function ghJson(path, fields = {}, headers = []) {
  const args = ["api", "--method", "GET", path];
  for (const header of headers) {
    args.push("-H", header);
  }
  for (const [key, value] of Object.entries(fields)) {
    args.push("-f", `${key}=${value}`);
  }
  return JSON.parse(runGh(args));
}

function safeGh(path, fields = {}, fallback = null, headers = []) {
  try {
    return ghJson(path, fields, headers);
  } catch (error) {
    const message = String(error?.stderr || error?.message || error)
      .trim()
      .split("\n")[0];
    console.warn(`[repo-factory] ${path}: ${message || "request failed"}`);
    return fallback;
  }
}

function asDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function after(value, threshold) {
  const date = asDate(value);
  return Boolean(date && date >= threshold);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function referenceTargets(text, publicNames) {
  if (!text) return [];
  const found = new Set();
  const patterns = [
    /\bfranklinbaldo\/([A-Za-z0-9_.-]+)\b/gi,
    /github\.com\/franklinbaldo\/([A-Za-z0-9_.-]+)/gi,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const target = match[1]?.replace(/[),.;:#].*$/, "");
      if (target && publicNames.has(target)) found.add(target);
    }
  }
  return [...found];
}

function product(kind, repo, title, url, at, number = null) {
  return { kind, repo, title, url, at, number };
}

function loadFallback() {
  try {
    return JSON.parse(readFileSync(outputPath, "utf8"));
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `[repo-factory] wrote ${snapshot.repositories.length} public repositories and ${snapshot.connections.length} belts to ${outputPath}`,
  );
}

async function main() {
  if (optional && !token) {
    console.log("[repo-factory] no GitHub token in optional mode; keeping committed snapshot");
    return;
  }

  let rawRepos;
  try {
    rawRepos = ghJson(`/users/${OWNER}/repos`, {
      type: "owner",
      sort: "pushed",
      per_page: 100,
    });
  } catch (error) {
    if (!optional) throw error;
    const fallback = loadFallback();
    const detail = String(error?.stderr || error?.message || error)
      .trim()
      .split("\n")[0];
    console.warn(
      `[repo-factory] live GitHub sync unavailable${detail ? `: ${detail}` : ""}; keeping committed snapshot`,
    );
    if (!fallback) {
      throw new Error("repo factory has neither GitHub data nor a committed fallback snapshot");
    }
    return;
  }

  const publicRepos = rawRepos
    .filter((repo) => !repo.private && repo.visibility === "public" && !repo.archived)
    .sort((a, b) => String(b.pushed_at).localeCompare(String(a.pushed_at)));
  const publicNames = new Set(publicRepos.map((repo) => repo.name));
  const connectionEvidence = new Map();

  function addConnection(source, target, reason) {
    if (!publicNames.has(source) || !publicNames.has(target) || source === target) return;
    const key = `${source}\u0000${target}`;
    const reasons = connectionEvidence.get(key) ?? new Set();
    reasons.add(reason);
    connectionEvidence.set(key, reasons);
  }

  const repositories = [];
  for (const [index, repo] of publicRepos.entries()) {
    const prefix = `/repos/${OWNER}/${repo.name}`;
    console.log(`[repo-factory] ${index + 1}/${publicRepos.length} ${repo.name}`);

    const [openPullsRaw, closedPullsRaw, openIssuesRaw, runsRaw, releasesRaw] = [
      safeGh(`${prefix}/pulls`, { state: "open", per_page: 100 }, []),
      safeGh(
        `${prefix}/pulls`,
        { state: "closed", sort: "updated", direction: "desc", per_page: 50 },
        [],
      ),
      safeGh(
        `${prefix}/issues`,
        { state: "open", sort: "updated", direction: "desc", per_page: 50 },
        [],
      ),
      safeGh(`${prefix}/actions/runs`, { per_page: 50 }, { workflow_runs: [] }),
      safeGh(`${prefix}/releases`, { per_page: 20 }, []),
    ];

    const openPulls = Array.isArray(openPullsRaw) ? openPullsRaw : [];
    const closedPulls = Array.isArray(closedPullsRaw) ? closedPullsRaw : [];
    const openIssues = (Array.isArray(openIssuesRaw) ? openIssuesRaw : []).filter(
      (issue) => !issue.pull_request,
    );
    const runs = Array.isArray(runsRaw?.workflow_runs) ? runsRaw.workflow_runs : [];
    const releases = Array.isArray(releasesRaw) ? releasesRaw : [];
    const mergedPulls7d = closedPulls.filter(
      (pull) => pull.merged_at && after(pull.merged_at, since.week),
    );
    const mergedPulls30d = closedPulls.filter(
      (pull) => pull.merged_at && after(pull.merged_at, since.month),
    );
    const runs24h = runs.filter((run) => after(run.created_at, since.day));
    const runs7d = runs.filter((run) => after(run.created_at, since.week));
    const completedRuns7d = runs7d.filter((run) => run.status === "completed");
    const successfulRuns7d = completedRuns7d.filter((run) => run.conclusion === "success");
    const successfulRuns24h = runs24h.filter((run) => run.conclusion === "success");
    const failedRuns24h = runs24h.filter((run) =>
      ["failure", "cancelled", "timed_out", "startup_failure"].includes(run.conclusion),
    );
    const releases7d = releases.filter((release) => after(release.published_at, since.week));
    const releases30d = releases.filter((release) => after(release.published_at, since.month));

    const recentProducts = [
      ...mergedPulls30d.map((pull) =>
        product(
          "merge",
          repo.name,
          pull.title,
          pull.html_url,
          pull.merged_at,
          pull.number,
        ),
      ),
      ...releases30d.map((release) =>
        product(
          "release",
          repo.name,
          release.name || release.tag_name,
          release.html_url,
          release.published_at,
        ),
      ),
      ...successfulRuns7d.map((run) =>
        product(
          "run",
          repo.name,
          run.name || run.display_title || "Workflow run",
          run.html_url,
          run.updated_at || run.created_at,
          run.run_number,
        ),
      ),
    ]
      .filter((item) => item.at)
      .sort((a, b) => String(b.at).localeCompare(String(a.at)))
      .slice(0, 12);

    const evidenceSources = [
      { text: repo.description, reason: "repository description" },
      ...openIssues.slice(0, 30).flatMap((issue) => [
        { text: issue.title, reason: `issue #${issue.number}` },
        { text: issue.body, reason: `issue #${issue.number}` },
      ]),
      ...openPulls.slice(0, 30).flatMap((pull) => [
        { text: pull.title, reason: `PR #${pull.number}` },
        { text: pull.body, reason: `PR #${pull.number}` },
      ]),
      ...closedPulls.slice(0, 30).flatMap((pull) => [
        { text: pull.title, reason: `recent PR #${pull.number}` },
        { text: pull.body, reason: `recent PR #${pull.number}` },
      ]),
    ];
    for (const evidence of evidenceSources) {
      for (const target of referenceTargets(evidence.text, publicNames)) {
        addConnection(repo.name, target, evidence.reason);
      }
    }

    const latestRun = runs[0]
      ? {
          name: runs[0].name || runs[0].display_title || "Workflow run",
          status: runs[0].status,
          conclusion: runs[0].conclusion,
          url: runs[0].html_url,
          createdAt: runs[0].created_at,
          updatedAt: runs[0].updated_at,
        }
      : null;

    const pushed = asDate(repo.pushed_at);
    const freshness = pushed
      ? pushed >= since.week
        ? 20
        : pushed >= since.month
          ? 8
          : 0
      : 0;
    const activityScore = clamp(
      mergedPulls7d.length * 12 +
        runs24h.length * 5 +
        openPulls.length * 4 +
        Math.min(openIssues.length, 20) +
        releases30d.length * 15 +
        freshness,
      0,
      100,
    );
    const status =
      failedRuns24h.length > 0 && successfulRuns24h.length === 0
        ? "jammed"
        : successfulRuns24h.length > 0 || mergedPulls7d.length > 0 || openPulls.length > 0
          ? "flowing"
          : pushed && pushed >= since.month
            ? "warming"
            : "idle";

    repositories.push({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description || "",
      homepage: repo.homepage || null,
      language: repo.language || null,
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      defaultBranch: repo.default_branch,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      openIssues: Math.max(0, (repo.open_issues_count ?? 0) - openPulls.length),
      openPulls: openPulls.length,
      mergedPulls7d: mergedPulls7d.length,
      runs24h: runs24h.length,
      runs7d: runs7d.length,
      successfulRuns7d: successfulRuns7d.length,
      failedRuns24h: failedRuns24h.length,
      runSuccessRate:
        completedRuns7d.length > 0
          ? Math.round((successfulRuns7d.length / completedRuns7d.length) * 100)
          : null,
      releases30d: releases30d.length,
      productCount7d: mergedPulls7d.length + successfulRuns7d.length + releases7d.length,
      activityScore,
      status,
      latestRun,
      latestProduct: recentProducts[0] ?? null,
      recentProducts,
      recentIssues: openIssues.slice(0, 6).map((issue) => ({
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        updatedAt: issue.updated_at,
      })),
      recentPulls: openPulls.slice(0, 6).map((pull) => ({
        number: pull.number,
        title: pull.title,
        url: pull.html_url,
        updatedAt: pull.updated_at,
        draft: Boolean(pull.draft),
      })),
    });
  }

  const codeSearch = safeGh(
    "/search/code",
    { q: `franklinbaldo/ user:${OWNER}`, per_page: 100 },
    { items: [] },
    ["Accept: application/vnd.github.text-match+json"],
  );
  for (const item of codeSearch?.items ?? []) {
    const source = item.repository?.name;
    if (!publicNames.has(source)) continue;
    const fragments = (item.text_matches ?? []).map((match) => match.fragment).filter(Boolean);
    for (const fragment of fragments) {
      for (const target of referenceTargets(fragment, publicNames)) {
        addConnection(source, target, `code: ${item.path}`);
      }
    }
  }

  const connections = [...connectionEvidence.entries()]
    .map(([key, reasons]) => {
      const [source, target] = key.split("\u0000");
      return {
        source,
        target,
        weight: reasons.size,
        reasons: [...reasons].sort().slice(0, 6),
      };
    })
    .sort(
      (a, b) =>
        b.weight - a.weight ||
        a.source.localeCompare(b.source) ||
        a.target.localeCompare(b.target),
    );

  const sortedRepositories = repositories.sort(
    (a, b) =>
      b.activityScore - a.activityScore ||
      String(b.pushedAt).localeCompare(String(a.pushedAt)) ||
      a.name.localeCompare(b.name),
  );

  const totals = sortedRepositories.reduce(
    (sum, repo) => {
      sum.repositories += 1;
      sum.openIssues += repo.openIssues;
      sum.openPulls += repo.openPulls;
      sum.mergedPulls7d += repo.mergedPulls7d;
      sum.runs24h += repo.runs24h;
      sum.successfulRuns7d += repo.successfulRuns7d;
      sum.releases30d += repo.releases30d;
      return sum;
    },
    {
      repositories: 0,
      openIssues: 0,
      openPulls: 0,
      mergedPulls7d: 0,
      runs24h: 0,
      successfulRuns7d: 0,
      releases30d: 0,
    },
  );

  writeSnapshot({
    schemaVersion: SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    owner: OWNER,
    source: "GitHub REST API via gh",
    bootstrap: false,
    privacy: "public repositories only",
    totals,
    repositories: sortedRepositories,
    connections,
  });
}

await main();

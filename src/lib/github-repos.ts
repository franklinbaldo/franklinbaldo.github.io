export interface Repo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  topics: string[];
  fork: boolean;
  archived: boolean;
  private: boolean;
}

export interface FetchReposResult {
  repos: Repo[];
  error: string | null;
  fmt: Intl.DateTimeFormat;
}

const LOCALE_TO_INTL: Record<string, string> = {
  en: "en-US",
  pt: "pt-BR",
};

export async function fetchUserRepos(
  user: string,
  locale: "en" | "pt" = "en"
): Promise<FetchReposResult> {
  const token = import.meta.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;
  let repos: Repo[] = [];
  let error: string | null = null;

  try {
    const res = await fetch(
      `https://api.github.com/users/${user}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as Repo[];
    repos = data
      .filter((r) => !r.fork && !r.archived && !r.private)
      .sort(
        (a, b) =>
          b.stargazers_count - a.stargazers_count ||
          new Date(b.pushed_at).valueOf() - new Date(a.pushed_at).valueOf()
      );
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.warn(`[projects] failed to fetch repos: ${error}`);
  }

  const fmt = new Intl.DateTimeFormat(LOCALE_TO_INTL[locale] ?? "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  return { repos, error, fmt };
}

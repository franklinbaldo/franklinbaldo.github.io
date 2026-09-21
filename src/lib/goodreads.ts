import { XMLParser } from "fast-xml-parser";

export interface GoodreadsBook {
  title: string;
  link: string;
  author_name: string;
  book_image_url: string;
  user_rating: number;
  user_read_at: string;
  book_published: string;
}

const GOODREADS_RSS =
  "https://www.goodreads.com/review/list_rss/5942034?shelf=read";

export async function fetchGoodreadsBooks(): Promise<GoodreadsBook[]> {
  const res = await fetch(GOODREADS_RSS);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    cdataPropName: "__cdata",
    isArray: (name) => name === "item",
  });
  const parsed = parser.parse(xml);
  const items: Record<string, unknown>[] = parsed?.rss?.channel?.item ?? [];

  const str = (v: unknown) =>
    typeof v === "object" && v !== null && "__cdata" in v
      ? String((v as Record<string, unknown>)["__cdata"])
      : String(v ?? "");

  return items.map((item) => {
    const imageUrl = str(item["book_image_url"]);
    const coverUrl = imageUrl
      .replace("._SY75_.", "._SX200_.")
      .replace("._SX98_.", "._SX200_.");
    return {
      title: str(item["title"]),
      link: str(item["link"]),
      author_name: str(item["author_name"]),
      book_image_url: coverUrl || imageUrl,
      user_rating: Number(item["user_rating"]) || 0,
      user_read_at: str(item["user_read_at"]),
      book_published: str(item["book_published"]),
    };
  });
}

export function recentBooks(books: GoodreadsBook[], n = 3): GoodreadsBook[] {
  return [...books]
    .sort((a, b) => {
      const da = a.user_read_at
        ? new Date(a.user_read_at.replace(/\//g, "-")).valueOf()
        : 0;
      const db = b.user_read_at
        ? new Date(b.user_read_at.replace(/\//g, "-")).valueOf()
        : 0;
      return db - da;
    })
    .slice(0, n);
}

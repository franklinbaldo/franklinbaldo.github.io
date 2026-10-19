// Deterministic grouping for SSG's native archive content projection.
export function archiveGroups(entries, language, perPage = 50) {
  if (!["en", "pt"].includes(language) || !Number.isSafeInteger(perPage) || perPage < 1)
    throw new Error("Invalid archive projection parameters");
  const selected = entries.filter((entry) => entry.lang === language).toSorted((a, b) =>
    b.date.localeCompare(a.date) || a.route.localeCompare(b.route));
  const pages = [];
  for (let offset = 0; offset < selected.length; offset += perPage) {
    pages.push(selected.slice(offset, offset + perPage));
  }
  return pages;
}

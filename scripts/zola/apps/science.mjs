// The Markdown cards and their links remain the source of truth. This mirrors
// src/data/science-equations.ts without Vite's import.meta.glob or Astro loaders.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

export function readScienceCards(root = "knowledge/science-equations") {
  const dateString = (value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  function linkedSlugs(raw, directory) {
    const links = Array.from(
      raw.matchAll(/\[[^\]]+\]\(([^)]+)\)/g),
      (m) => m[1]
    );
    return [
      ...new Set(
        links
          .map((target) => target.split("#")[0])
          .filter(
            (target) =>
              target.includes("/" + directory + "/") ||
              target.startsWith("../" + directory + "/")
          )
          .map((target) => target.split("/").at(-1)?.replace(/\.md$/, ""))
          .filter(Boolean)
      ),
    ];
  }
  const read = (directory, project) =>
    readdirSync(join(root, directory))
      .filter((file) => file.endsWith(".md"))
      .sort()
      .map((file) => {
        const raw = readFileSync(join(root, directory, file), "utf8");
        const { data } = matter(raw);
        return {
          slug: file.replace(/\.md$/, ""),
          name: data.name,
          updated: dateString(data.updated),
          ...project(data, raw),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  const branches = read("branches", (data, raw) => ({
    level: data.level,
    description: data.description,
    children: linkedSlugs(raw, "branches"),
  }));
  const formulas = read("formulas", (data, raw) => ({
    latex: data.latex,
    summary: data.summary,
    status: data.status,
    sourceLabel: data.source_label,
    sourceUrl: data.source_url,
    branches: linkedSlugs(raw, "branches"),
    families: linkedSlugs(raw, "families"),
  }));
  const families = read("families", (data, raw) => ({
    canonicalLatex: data.canonical_latex,
    summary: data.summary,
    status: data.status,
    members: linkedSlugs(raw, "formulas"),
  }));
  const updated =
    [...branches, ...formulas, ...families]
      .map((item) => item.updated)
      .sort()
      .at(-1) ?? "unknown";
  return { branches, formulas, families, updated };
}

export function scienceGraph({ branches, formulas, families, updated }) {
  const branchBySlug = new Map(branches.map((branch) => [branch.slug, branch]));
  const parentBySlug = new Map();
  for (const branch of branches)
    for (const child of branch.children) parentBySlug.set(child, branch.slug);
  function topDomainFor(slug) {
    let current = slug;
    const seen = new Set();
    while (current && !seen.has(current)) {
      seen.add(current);
      const parent = parentBySlug.get(current);
      if (!parent || parent === "science") return current;
      current = parent;
    }
    return slug;
  }
  return {
    updated,
    domains: (branchBySlug.get("science")?.children ?? [])
      .map((slug) => branchBySlug.get(slug))
      .filter(Boolean)
      .map((branch) => ({
        id: branch.slug,
        label: branch.name,
        description: branch.description,
      })),
    formulas: formulas.map((formula) => ({
      id: formula.slug,
      label: formula.name,
      latex: formula.latex,
      summary: formula.summary,
      status: formula.status,
      sourceLabel: formula.sourceLabel ?? "",
      sourceUrl: formula.sourceUrl ?? "",
      domains: [...new Set(formula.branches.map(topDomainFor))],
      families: formula.families,
    })),
    families: families.map((family) => ({
      id: family.slug,
      label: family.name,
      latex: family.canonicalLatex,
      summary: family.summary,
      status: family.status,
      members: family.members,
    })),
  };
}

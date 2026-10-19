export type ScienceBranchLevel = "root" | "domain" | "field" | "subfield" | "topic";
export type FormulaStatus = "candidate" | "sourced" | "verified" | "normalized" | "audited";
export type FamilyStatus = "hypothesis" | "verified" | "audited";

export interface ScienceBranch {
  slug: string;
  name: string;
  level: ScienceBranchLevel;
  description: string;
  updated: string;
  children: string[];
}

export interface ScienceFormula {
  slug: string;
  name: string;
  latex: string;
  summary: string;
  status: FormulaStatus;
  sourceLabel?: string;
  sourceUrl?: string;
  updated: string;
  branches: string[];
  families: string[];
}

export interface EquationFamily {
  slug: string;
  name: string;
  canonicalLatex: string;
  summary: string;
  status: FamilyStatus;
  updated: string;
  members: string[];
}

type BranchModule = {
  frontmatter: {
    type: "science-branch";
    name: string;
    level: ScienceBranchLevel;
    description: string;
    updated: string | Date;
  };
};

type FormulaModule = {
  frontmatter: {
    type: "science-formula";
    name: string;
    latex: string;
    summary: string;
    status: FormulaStatus;
    source_label?: string;
    source_url?: string;
    updated: string | Date;
  };
};

type FamilyModule = {
  frontmatter: {
    type: "equation-family";
    name: string;
    canonical_latex: string;
    summary: string;
    status: FamilyStatus;
    updated: string | Date;
  };
};

const branchModules = import.meta.glob<BranchModule>(
  "../../knowledge/science-equations/branches/*.md",
  { eager: true },
);
const formulaModules = import.meta.glob<FormulaModule>(
  "../../knowledge/science-equations/formulas/*.md",
  { eager: true },
);
const familyModules = import.meta.glob<FamilyModule>(
  "../../knowledge/science-equations/families/*.md",
  { eager: true },
);
const rawModules = import.meta.glob<string>(
  "../../knowledge/science-equations/**/*.md",
  { eager: true, query: "?raw", import: "default" },
);

const dateString = (value: string | Date) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

const slugFromPath = (path: string) =>
  path.split("/").at(-1)?.replace(/\.md$/, "") ?? path;

const linkedSlugs = (path: string, directory: "branches" | "formulas" | "families") => {
  const raw = rawModules[path] ?? "";
  const links = Array.from(raw.matchAll(/\[[^\]]+\]\(([^)]+)\)/g), (match) => match[1]);
  const marker = "/" + directory + "/";
  return Array.from(
    new Set(
      links
        .map((target) => target.split("#")[0])
        .filter((target) => target.includes(marker) || target.startsWith("../" + directory + "/"))
        .map((target) => target.split("/").at(-1)?.replace(/\.md$/, ""))
        .filter((slug): slug is string => Boolean(slug)),
    ),
  );
};

export const scienceBranches: ScienceBranch[] = Object.entries(branchModules)
  .map(([path, module]) => ({
    slug: slugFromPath(path),
    name: module.frontmatter.name,
    level: module.frontmatter.level,
    description: module.frontmatter.description,
    updated: dateString(module.frontmatter.updated),
    children: linkedSlugs(path, "branches"),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const scienceFormulas: ScienceFormula[] = Object.entries(formulaModules)
  .map(([path, module]) => ({
    slug: slugFromPath(path),
    name: module.frontmatter.name,
    latex: module.frontmatter.latex,
    summary: module.frontmatter.summary,
    status: module.frontmatter.status,
    sourceLabel: module.frontmatter.source_label,
    sourceUrl: module.frontmatter.source_url,
    updated: dateString(module.frontmatter.updated),
    branches: linkedSlugs(path, "branches"),
    families: linkedSlugs(path, "families"),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const equationFamilies: EquationFamily[] = Object.entries(familyModules)
  .map(([path, module]) => ({
    slug: slugFromPath(path),
    name: module.frontmatter.name,
    canonicalLatex: module.frontmatter.canonical_latex,
    summary: module.frontmatter.summary,
    status: module.frontmatter.status,
    updated: dateString(module.frontmatter.updated),
    members: linkedSlugs(path, "formulas"),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const SCIENCE_EQUATIONS_UPDATED =
  [...scienceBranches, ...scienceFormulas, ...equationFamilies]
    .map((item) => item.updated)
    .sort()
    .at(-1) ?? "unknown";

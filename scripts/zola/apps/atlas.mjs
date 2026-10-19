import katex from "katex";
import { escapeHtml as h } from "../content.mjs";
import { scienceGraph } from "./science.mjs";

export function renderAtlas(cards, componentSource) {
  const { branches, formulas, families } = cards;
  const branchBySlug = new Map(branches.map((branch) => [branch.slug, branch]));
  const formulaBySlug = new Map(
    formulas.map((formula) => [formula.slug, formula])
  );
  const topBranches = (branchBySlug.get("science")?.children ?? [])
    .map((slug) => branchBySlug.get(slug))
    .filter(Boolean);
  const graph = scienceGraph(cards);
  const renderEquation = (latex) =>
    katex.renderToString(latex, { displayMode: true, throwOnError: false });
  // The graph's static chrome is copied verbatim; all data is projected here.
  let universe = componentSource.match(
    /(<section class="uekg-universe"[\s\S]*?)<div class="universe-footer">/
  )?.[1];
  if (!universe) throw new Error("EquationUniverse static chrome changed");
  universe = universe.replace(
    "data-graph={JSON.stringify(graphData)}",
    `data-graph="${h(JSON.stringify(graph))}"`
  );
  if (/[{}]/.test(universe.replace(/data-graph="[^"]*"/, "")))
    throw new Error("Unexpected dynamic EquationUniverse chrome");
  universe += `<div class="universe-footer"><div class="universe-stats">
    <span><strong>${formulas.length}</strong> equações</span>
    <span><strong>${families.length}</strong> famílias verificadas</span>
    <span><strong>${graph.domains.length}</strong> grandes domínios</span>
  </div><div class="spotlights" aria-label="Famílias para destacar"><span>Experimente:</span>
    ${families
      .slice(0, 4)
      .map(
        (family) =>
          `<button type="button" data-focus-family="${h(family.slug)}">${h(family.name)}</button>`
      )
      .join("")}
  </div></div></section>`;
  const head = (id, eyebrow, title, text) =>
    `<div class="section-head"><div><p class="eyebrow">${eyebrow}</p><h2 id="${id}">${title}</h2></div><p>${text}</p></div>`;
  return `<div class="atlas-shell">
    ${universe}
    <section aria-labelledby="tree-title">
      ${head("tree-title", "01 · TAXONOMIA", "A árvore começa larga", "O corpus cresce por cobertura, não por obsessão em terminar uma disciplina antes das outras.")}
      <div class="branch-grid">${topBranches
        .map(
          (branch) =>
            `<article><small>${h(branch.level)}</small><h3>${h(branch.name)}</h3><p>${h(branch.description)}</p>${
              branch.children.length
                ? `<ul>${branch.children
                    .map((slug) => branchBySlug.get(slug))
                    .filter(Boolean)
                    .map((child) => `<li>${h(child.name)}</li>`)
                    .join("")}</ul>`
                : ""
            }</article>`
        )
        .join("")}</div>
    </section>
    <section aria-labelledby="formula-title">
      ${head("formula-title", "02 · OCORRÊNCIAS", "A fórmula fica no idioma da área", "Cada ocorrência preserva sua notação e seu significado científico antes de qualquer normalização.")}
      <div class="formula-grid">${formulas
        .map(
          (formula) =>
            `<article class="formula-card" id="${h(formula.slug)}"><div class="card-meta"><span>${h(formula.status)}</span><span>${h(
              formula.branches
                .map((slug) => branchBySlug.get(slug)?.name)
                .filter(Boolean)
                .join(" · ")
            )}</span></div><h3>${h(formula.name)}</h3><div class="equation">${renderEquation(formula.latex)}</div><p>${h(formula.summary)}</p>${formula.sourceUrl ? `<p class="source"><a href="${h(formula.sourceUrl)}">Fonte: ${h(formula.sourceLabel ?? formula.sourceUrl)}</a></p>` : ""}</article>`
        )
        .join("")}</div>
    </section>
    <section aria-labelledby="family-title">
      ${head("family-title", "03 · GRAFO MATEMÁTICO", "O mesmo esqueleto reaparece", "Uma família só entra como verificada quando a transformação entre as ocorrências pode ser mostrada.")}
      ${families
        .map(
          (family) =>
            `<article class="family-card" id="${h(family.slug)}"><div><p class="eyebrow">${h(family.status)}</p><h3>${h(family.name)}</h3><p>${h(family.summary)}</p></div><div class="family-equation">${renderEquation(family.canonicalLatex)}</div><div><h4>Ocorrências ligadas</h4><ul>${family.members
              .map((slug) => formulaBySlug.get(slug))
              .filter(Boolean)
              .map(
                (formula) =>
                  `<li><a href="#${h(formula.slug)}">${h(formula.name)}</a></li>`
              )
              .join("")}</ul></div></article>`
        )
        .join("")}
    </section>
    <section class="method" aria-labelledby="method-title"><p class="eyebrow">MÉTODO</p><h2 id="method-title">Markdown primeiro, grafo depois</h2><p>A fonte de verdade são os documentos OKF em <code>knowledge/science-equations/</code>. Os links Markdown são as relações canônicas. Esta página é apenas uma projeção regenerável: a rotina recorrente pesquisa novos ramos, verifica fontes, normaliza fórmulas, testa equivalências e audita conexões antigas.</p></section>
  </div>`;
}

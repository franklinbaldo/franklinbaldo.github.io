import { escapeHtml as h } from "../content.mjs";
const link = (url, text, className = "") =>
  `<a href="${h(url)}"${className ? ` class="${className}"` : ""} target="_blank" rel="noreferrer">${text}</a>`;
const hidden = (value) => (value ? " hidden" : "");
const labels = {
  flowing: "FLOWING",
  jammed: "JAMMED",
  warming: "WARMING",
  idle: "IDLE",
};

export function renderFactory(snapshot) {
  const repositories = snapshot.repositories ?? [];
  const connections = snapshot.connections ?? [];
  const initial = repositories[0];
  const initialConnections = initial
    ? connections.filter(
        (c) => c.source === initial.name || c.target === initial.name
      )
    : [];
  const boardWidth = 1420;
  const boardHeight = Math.max(
    520,
    58 + Math.ceil(Math.max(1, repositories.length) / 4) * 188 + 36
  );
  const nodes = repositories.map((repo, index) => {
    const row = Math.floor(index / 4);
    const column = row % 2 === 0 ? index % 4 : 3 - (index % 4);
    return { repo, x: 48 + column * 338, y: 58 + row * 188 };
  });
  const nodeByName = new Map(nodes.map((node) => [node.repo.name, node]));
  const belts = connections.flatMap((connection) => {
    const source = nodeByName.get(connection.source);
    const target = nodeByName.get(connection.target);
    if (!source || !target) return [];
    const x1 = source.x + 135,
      y1 = source.y + 71,
      x2 = target.x + 135,
      y2 = target.y + 71;
    return [
      {
        ...connection,
        d: `M ${x1} ${y1} H ${Math.round((x1 + x2) / 2)} V ${y2} H ${x2}`,
      },
    ];
  });
  const productionLog = repositories
    .flatMap((repo) => repo.recentProducts ?? [])
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 30);
  const format = (value, full = false) =>
    new Intl.DateTimeFormat("en", {
      ...(full ? { year: "numeric", timeZoneName: "short" } : {}),
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(new Date(value));
  const totals = snapshot.totals;
  const stat = (name, value, description) =>
    `<article><span>${name}</span><strong>${h(value)}</strong><small>${description}</small></article>`;
  const product = (item) =>
    `<span class="product-kind kind-${h(item.kind)}">${h(item.kind)}</span>`;
  function workList(kind, title, subhead, items, empty) {
    return `<section class="inspector-block" aria-labelledby="inspector-${kind}-label">
      <div class="inspector-block-head"><h3 id="inspector-${kind}-label">${title}</h3><span>${subhead}</span></div>
      <ul id="inspector-${kind}" class="inspector-list">${items
        .slice(0, 4)
        .map(
          (item) =>
            `<li>${link(item.url, `#${h(item.number)} ${h(item.title)}`)}</li>`
        )
        .join("")}</ul>
      <p id="inspector-${kind}-empty" class="inspector-empty"${hidden(items.length > 0)}>${empty}</p>
    </section>`;
  }
  return `<section class="factory-shell" aria-labelledby="factory-title">
    <header class="factory-hero">
      <div><p class="factory-kicker">PUBLIC GITHUB · PRODUCTION MAP</p><h1 id="factory-title">Repo Factory</h1>
        <p class="factory-deck">A software portfolio rendered as a factory floor. Issues arrive as raw material, pull requests enter assembly, workflow runs process the work, and merges, releases and green runs leave the line as products.</p>
      </div>
      <div class="factory-source" aria-label="Data provenance"><span class="source-light" aria-hidden="true"></span><div>
        <strong>${snapshot.bootstrap ? "Bootstrap snapshot" : "GitHub API snapshot"}</strong>
        <span>${snapshot.generatedAt ? `generated ${h(format(snapshot.generatedAt, true))}` : "waiting for first live build"}</span><span>${h(snapshot.privacy)}</span>
      </div></div>
    </header>
    <section class="factory-metrics" aria-label="Factory totals">
      ${stat("FACTORIES", totals.repositories, "public repositories")}
      ${stat("RAW ORE", totals.openIssues, "open issues")}
      ${stat("ASSEMBLY", totals.openPulls, "open pull requests")}
      ${stat("MACHINES / 24H", totals.runs24h, "workflow runs")}
      ${stat("CRATES / 7D", totals.mergedPulls7d, "merged pull requests")}
      ${stat("RELEASES / 30D", totals.releases30d, "tagged output")}
    </section>
    <div class="factory-toolbar" aria-label="Factory map controls">
      <label class="factory-search"><span>Find a factory</span><input id="factory-search" type="search" placeholder="repo name…" autocomplete="off"></label>
      <label><span>Line state</span><select id="factory-status"><option value="all">All factories</option><option value="flowing">Flowing</option><option value="jammed">Jammed</option><option value="warming">Warming</option><option value="idle">Idle</option></select></label>
      <label class="factory-check"><input id="factory-belts" type="checkbox" checked><span>Show belts</span></label>
      <button id="factory-motion" type="button" class="factory-motion" aria-pressed="false">Pause belt motion</button>
    </div>
    <span id="factory-filter-status" role="status" aria-live="polite" class="sr-only"></span>
    ${
      initial
        ? `<div class="factory-layout">
      <section class="factory-map-frame" aria-label="Interactive repository factory map">
        <div id="factory-board" class="factory-board" style="width:${boardWidth}px;height:${boardHeight}px">
          <div class="factory-grid" aria-hidden="true"></div>
          <svg class="factory-belts" viewBox="0 0 ${boardWidth} ${boardHeight}" width="${boardWidth}" height="${boardHeight}" aria-hidden="true">
            ${belts.map((belt) => `<g data-belt data-source="${h(belt.source)}" data-target="${h(belt.target)}"><path class="belt-rail" d="${belt.d}"></path><path class="belt-flow" d="${belt.d}"></path></g>`).join("")}
          </svg>
          ${nodes
            .map(
              (
                { repo, x, y },
                index
              ) => `<button type="button" class="factory-node" style="--node-x:${x}px;--node-y:${y}px" data-repo="${h(repo.name)}" data-status="${h(repo.status)}" aria-pressed="${index === 0}" title="Inspect ${h(repo.fullName)}">
            <span class="machine-topline"><span class="machine-gear" aria-hidden="true">⚙</span><span class="machine-status">${h(labels[repo.status])}</span><span class="machine-score">${h(repo.activityScore)}%</span></span>
            <strong>${h(repo.name)}</strong><span class="machine-language">${h(repo.language ?? "mixed / unknown")}</span>
            <span class="machine-pipeline" aria-label="${h(repo.name)} production counts"><span title="Open issues">◆ ${h(repo.openIssues)}</span><i aria-hidden="true">→</i><span title="Open pull requests">▰ ${h(repo.openPulls)}</span><i aria-hidden="true">→</i><span title="Workflow runs in the last 24 hours">⚡ ${h(repo.runs24h)}</span><i aria-hidden="true">→</i><span title="Products in the last 7 days">▣ ${h(repo.productCount7d)}</span></span>
          </button>`
            )
            .join("")}
        </div>
      </section>
      <aside class="factory-inspector" aria-labelledby="inspector-name">
        <p class="inspector-eyebrow">SELECTED FACTORY</p>
        <div class="inspector-title-row"><h2 id="inspector-name">${h(initial.name)}</h2><span id="inspector-status" class="status-chip status-${h(initial.status)}">${h(labels[initial.status])}</span></div>
        <p id="inspector-description" class="inspector-description">${h(initial.description || "No repository description.")}</p>
        <a id="inspector-link" href="${h(initial.url)}" target="_blank" rel="noreferrer">Open repository ↗</a>
        <dl class="inspector-stats"><div><dt>Issues</dt><dd id="inspector-issues">${h(initial.openIssues)}</dd></div><div><dt>PRs</dt><dd id="inspector-prs">${h(initial.openPulls)}</dd></div><div><dt>Runs 24h</dt><dd id="inspector-runs">${h(initial.runs24h)}</dd></div><div><dt>Run yield</dt><dd id="inspector-yield">${initial.runSuccessRate != null ? `${h(initial.runSuccessRate)}%` : "—"}</dd></div></dl>
        <section class="inspector-block" aria-labelledby="inspector-run-label"><div class="inspector-block-head"><h3 id="inspector-run-label">Machine status</h3><span id="inspector-run-conclusion">${h(initial.latestRun?.conclusion ?? initial.latestRun?.status ?? "no run")}</span></div><a id="inspector-run-link" href="${h(initial.latestRun?.url ?? "#")}" target="_blank" rel="noreferrer"${hidden(!initial.latestRun)}>${h(initial.latestRun?.name ?? "Workflow run")}</a></section>
        ${workList("inputs", "Input hopper", "issues", initial.recentIssues ?? [], "Hopper empty.")}
        ${workList("assembly", "Assembly queue", "pull requests", initial.recentPulls ?? [], "No PRs on the belt.")}
        <section class="inspector-block" aria-labelledby="inspector-output-label"><div class="inspector-block-head"><h3 id="inspector-output-label">Output chest</h3><span>recent products</span></div><ul id="inspector-products" class="inspector-list product-list">${(
          initial.recentProducts ?? []
        )
          .slice(0, 5)
          .map(
            (item) =>
              `<li>${product(item)}${link(item.url, h(item.title))}</li>`
          )
          .join(
            ""
          )}</ul><p id="inspector-products-empty" class="inspector-empty"${hidden((initial.recentProducts?.length ?? 0) > 0)}>No recent crates in the snapshot window.</p></section>
        <section class="inspector-block" aria-labelledby="inspector-belts-label"><div class="inspector-block-head"><h3 id="inspector-belts-label">Inter-repo belts</h3><span>explicit references</span></div><ul id="inspector-belts" class="inspector-list belt-list">${initialConnections
          .slice(0, 6)
          .map((connection) => {
            const outbound = connection.source === initial.name;
            const other = outbound ? connection.target : connection.source;
            return `<li><span class="belt-direction">${outbound ? "OUT →" : "← IN"}</span>${link(`https://github.com/${snapshot.owner}/${other}`, h(other))}<small>${h(connection.reasons[0] ?? "explicit reference")}</small></li>`;
          })
          .join(
            ""
          )}</ul><p id="inspector-belts-empty" class="inspector-empty"${hidden(initialConnections.length > 0)}>No explicit public cross-repo reference found in this snapshot.</p></section>
      </aside>
    </div>`
        : `<section class="factory-empty" aria-live="polite"><span class="machine-gear" aria-hidden="true">⚙</span><div><h2>The factory is waiting for its first sync.</h2><p>The committed file is intentionally only a safe fallback. A normal GitHub Pages build runs the collector with <code>gh api</code> and fills this floor with public repositories.</p></div></section>`
    }
    <section class="factory-legend" aria-labelledby="factory-legend-title"><div><p class="factory-kicker">THE RECIPE</p><h2 id="factory-legend-title">What the machines mean</h2></div><ol>
      <li><span class="legend-icon">◆</span><strong>Issue</strong><small>raw material / work demand</small></li>
      <li><span class="legend-icon">▰</span><strong>Pull request</strong><small>assembly line</small></li>
      <li><span class="legend-icon">⚡</span><strong>Actions run</strong><small>machine cycle / quality gate</small></li>
      <li><span class="legend-icon">▣</span><strong>Merge or release</strong><small>finished product</small></li>
      <li><span class="legend-icon belt-icon">━</span><strong>Cross-repo belt</strong><small>explicit GitHub reference</small></li>
    </ol><p class="legend-note">Belts are evidence, not guesswork: the collector derives them from explicit references between public repositories in repository text, recent issues/PRs, and indexed code. Private repositories never enter the public snapshot.</p></section>
    <section class="production-log" aria-labelledby="production-log-title"><header><div><p class="factory-kicker">OUTPUT CHESTS</p><h2 id="production-log-title">Latest products</h2></div><p>Merges, releases and successful Actions runs observed by the snapshot.</p></header>
      ${productionLog.length ? `<ol>${productionLog.map((item) => `<li><time datetime="${h(item.at)}">${h(format(item.at))} UTC</time>${link(`https://github.com/${snapshot.owner}/${item.repo}`, h(item.repo), "production-repo")}${product(item)}${link(item.url, h(item.title))}</li>`).join("")}</ol>` : `<p class="inspector-empty">No finished products in the current fallback snapshot.</p>`}
    </section>
    <footer class="factory-provenance"><strong>Data contract:</strong><span>${h(snapshot.schemaVersion)}</span><span>·</span><span>${h(snapshot.source)}</span><span>·</span><span>public data only</span></footer>
  </section>
  <script id="repo-factory-data" type="application/json">${JSON.stringify(snapshot).replaceAll("<", "\\u003c")}</script>`;
}

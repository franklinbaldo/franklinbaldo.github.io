type Status = "flowing" | "jammed" | "warming" | "idle";
type WorkItem = { number: number; title: string; url: string; draft?: boolean };
type Product = { kind: "merge" | "release" | "run"; title: string; url: string };
type Repo = {
  name: string;
  url: string;
  description: string;
  status: Status;
  openIssues: number;
  openPulls: number;
  runs24h: number;
  runSuccessRate: number | null;
  latestRun: { name: string; status: string; conclusion: string | null; url: string } | null;
  recentIssues: WorkItem[];
  recentPulls: WorkItem[];
  recentProducts: Product[];
};
type Connection = { source: string; target: string; weight: number; reasons: string[] };
type Snapshot = { owner: string; repositories: Repo[]; connections: Connection[] };

const root = document.querySelector<HTMLElement>(".factory-shell");
const dataElement = document.querySelector<HTMLScriptElement>("#repo-factory-data");

if (root && dataElement && !root.dataset.initialized) {
  root.dataset.initialized = "true";
  const snapshot = JSON.parse(dataElement.textContent || "{}") as Snapshot;
  const repos = snapshot.repositories ?? [];
  const connections = snapshot.connections ?? [];
  const repoByName = new Map(repos.map((repo) => [repo.name, repo]));
  const search = root.querySelector<HTMLInputElement>("#factory-search");
  const status = root.querySelector<HTMLSelectElement>("#factory-status");
  const beltsToggle = root.querySelector<HTMLInputElement>("#factory-belts");
  const motion = root.querySelector<HTMLButtonElement>("#factory-motion");
  const board = root.querySelector<HTMLElement>("#factory-board");
  const nodes = [...root.querySelectorAll<HTMLButtonElement>(".factory-node")];
  const belts = [...root.querySelectorAll<SVGGElement>("[data-belt]")];
  const statusLabels: Record<Status, string> = {
    flowing: "FLOWING",
    jammed: "JAMMED",
    warming: "WARMING",
    idle: "IDLE",
  };

  function setText(selector: string, value: string | number) {
    const element = root?.querySelector<HTMLElement>(selector);
    if (element) element.textContent = String(value);
  }

  function setList(
    selector: string,
    emptySelector: string,
    items: WorkItem[],
    label: (item: WorkItem) => string,
  ) {
    const list = root?.querySelector<HTMLUListElement>(selector);
    const empty = root?.querySelector<HTMLElement>(emptySelector);
    if (!list || !empty) return;
    list.replaceChildren();
    for (const item of items.slice(0, 4)) {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = label(item);
      li.append(link);
      list.append(li);
    }
    empty.hidden = items.length > 0;
  }

  function setProductList(items: Product[]) {
    const list = root?.querySelector<HTMLUListElement>("#inspector-products");
    const empty = root?.querySelector<HTMLElement>("#inspector-products-empty");
    if (!list || !empty) return;
    list.replaceChildren();
    for (const item of items.slice(0, 5)) {
      const li = document.createElement("li");
      const kind = document.createElement("span");
      kind.className = `product-kind kind-${item.kind}`;
      kind.textContent = item.kind;
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = item.title;
      li.append(kind, link);
      list.append(li);
    }
    empty.hidden = items.length > 0;
  }

  function setBeltList(name: string) {
    const list = root?.querySelector<HTMLUListElement>("#inspector-belts");
    const empty = root?.querySelector<HTMLElement>("#inspector-belts-empty");
    if (!list || !empty) return;
    const related = connections.filter(
      (connection) => connection.source === name || connection.target === name,
    );
    list.replaceChildren();
    for (const connection of related.slice(0, 6)) {
      const outbound = connection.source === name;
      const other = outbound ? connection.target : connection.source;
      const li = document.createElement("li");
      const direction = document.createElement("span");
      direction.className = "belt-direction";
      direction.textContent = outbound ? "OUT →" : "← IN";
      const link = document.createElement("a");
      link.href = `https://github.com/${snapshot.owner}/${other}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = other;
      const reason = document.createElement("small");
      reason.textContent = connection.reasons[0] || "explicit reference";
      li.append(direction, link, reason);
      list.append(li);
    }
    empty.hidden = related.length > 0;
  }

  function selectRepo(name: string) {
    const repo = repoByName.get(name);
    if (!repo) return;
    for (const node of nodes) {
      node.setAttribute("aria-pressed", String(node.dataset.repo === name));
    }
    setText("#inspector-name", repo.name);
    setText("#inspector-description", repo.description || "No repository description.");
    setText("#inspector-issues", repo.openIssues);
    setText("#inspector-prs", repo.openPulls);
    setText("#inspector-runs", repo.runs24h);
    setText("#inspector-yield", repo.runSuccessRate == null ? "—" : `${repo.runSuccessRate}%`);

    const repoLink = root?.querySelector<HTMLAnchorElement>("#inspector-link");
    if (repoLink) repoLink.href = repo.url;
    const chip = root?.querySelector<HTMLElement>("#inspector-status");
    if (chip) {
      chip.className = `status-chip status-${repo.status}`;
      chip.textContent = statusLabels[repo.status];
    }

    const runLink = root?.querySelector<HTMLAnchorElement>("#inspector-run-link");
    if (repo.latestRun) {
      setText("#inspector-run-conclusion", repo.latestRun.conclusion || repo.latestRun.status);
      if (runLink) {
        runLink.hidden = false;
        runLink.href = repo.latestRun.url;
        runLink.textContent = repo.latestRun.name;
      }
    } else {
      setText("#inspector-run-conclusion", "no run");
      if (runLink) runLink.hidden = true;
    }

    setList(
      "#inspector-inputs",
      "#inspector-inputs-empty",
      repo.recentIssues ?? [],
      (item) => `#${item.number} ${item.title}`,
    );
    setList(
      "#inspector-assembly",
      "#inspector-assembly-empty",
      repo.recentPulls ?? [],
      (item) => `#${item.number} ${item.title}${item.draft ? " · draft" : ""}`,
    );
    setProductList(repo.recentProducts ?? []);
    setBeltList(repo.name);
    for (const belt of belts) {
      belt.classList.toggle(
        "is-selected",
        belt.dataset.source === repo.name || belt.dataset.target === repo.name,
      );
    }
  }

  function updateVisibility() {
    const query = (search?.value || "").trim().toLowerCase();
    const selectedStatus = status?.value || "all";
    const visible = new Set<string>();
    for (const node of nodes) {
      const name = node.dataset.repo || "";
      const matchesQuery = !query || name.toLowerCase().includes(query);
      const matchesStatus = selectedStatus === "all" || node.dataset.status === selectedStatus;
      node.hidden = !(matchesQuery && matchesStatus);
      if (!node.hidden) visible.add(name);
    }
    const showBelts = beltsToggle?.checked ?? true;
    for (const belt of belts) {
      const source = belt.dataset.source || "";
      const target = belt.dataset.target || "";
      belt.toggleAttribute("hidden", !showBelts || !visible.has(source) || !visible.has(target));
    }
    const selected = nodes.find(
      (node) => node.getAttribute("aria-pressed") === "true" && !node.hidden,
    );
    if (!selected) {
      const next = nodes.find((node) => !node.hidden);
      if (next?.dataset.repo) selectRepo(next.dataset.repo);
    }
  }

  for (const node of nodes) {
    node.addEventListener("click", () => {
      if (node.dataset.repo) selectRepo(node.dataset.repo);
    });
  }
  search?.addEventListener("input", updateVisibility);
  status?.addEventListener("change", updateVisibility);
  beltsToggle?.addEventListener("change", updateVisibility);

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  let paused = reduceMotion;
  function renderMotion() {
    board?.classList.toggle("motion-paused", paused);
    if (!motion) return;
    motion.setAttribute("aria-pressed", String(paused));
    motion.textContent = paused ? "Animate belts" : "Pause belt motion";
  }
  motion?.addEventListener("click", () => {
    paused = !paused;
    renderMotion();
  });
  renderMotion();
  if (repos[0]) selectRepo(repos[0].name);
  updateVisibility();
}

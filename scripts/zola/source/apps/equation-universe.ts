const universe = document.querySelector<HTMLElement>("#uekg-universe");

  if (universe) {
    const data = JSON.parse(universe.dataset.graph || "{}");
    const stage = universe.querySelector<HTMLElement>("[data-stage]");
    const nodeLayer = universe.querySelector<HTMLElement>("[data-nodes]");
    const edgeSvg = universe.querySelector<SVGSVGElement>("[data-edges]");
    const modeButtons = Array.from(universe.querySelectorAll<HTMLButtonElement>("[data-mode]"));
    const spotlightButtons = Array.from(universe.querySelectorAll<HTMLButtonElement>("[data-focus-family]"));
    const panel = universe.querySelector<HTMLElement>("[data-panel]");
    const panelKind = universe.querySelector<HTMLElement>("[data-panel-kind]");
    const panelTitle = universe.querySelector<HTMLElement>("[data-panel-title]");
    const panelEquation = universe.querySelector<HTMLElement>("[data-panel-equation]");
    const panelSummary = universe.querySelector<HTMLElement>("[data-panel-summary]");
    const panelSource = universe.querySelector<HTMLAnchorElement>("[data-panel-source]");

    if (stage && nodeLayer && edgeSvg && panel && panelKind && panelTitle && panelEquation && panelSummary && panelSource) {
      type GraphNode = {
        key: string;
        id: string;
        kind: "formula" | "domain" | "family" | "frontier";
        label: string;
        latex?: string;
        summary?: string;
        description?: string;
        status?: string;
        sourceLabel?: string;
        sourceUrl?: string;
        domains?: string[];
        families?: string[];
        members?: string[];
        x?: number;
        y?: number;
      };

      type Edge = { from: string; to: string; kind: "discipline" | "structure" };

      const formulas: GraphNode[] = (data.formulas || []).map((item: any) => ({
        ...item,
        key: `formula:${item.id}`,
        kind: "formula" as const,
      }));
      const domains: GraphNode[] = (data.domains || []).map((item: any) => ({
        ...item,
        key: `domain:${item.id}`,
        kind: "domain" as const,
      }));
      const families: GraphNode[] = (data.families || []).map((item: any) => ({
        ...item,
        key: `family:${item.id}`,
        kind: "family" as const,
      }));
      const frontier: GraphNode = {
        key: "frontier:open",
        id: "open-frontier",
        kind: "frontier",
        label: "Fronteira aberta",
        description: "Equações ainda sem uma família matemática verificada no Atlas.",
      };

      const nodes = [...formulas, ...domains, ...families, frontier];
      const nodeByKey = new Map(nodes.map((node) => [node.key, node]));
      const buttons = new Map<string, HTMLButtonElement>();
      const lines = new Map<string, SVGLineElement>();
      let mode: "discipline" | "structure" = "discipline";
      let focused: string | null = null;
      let autoMorphTimer: number | undefined;

      const domainForFormula = (formula: GraphNode) =>
        formula.domains?.find((id) => domains.some((domain) => domain.id === id)) ?? domains[0]?.id ?? "";

      const structureForFormula = (formula: GraphNode) =>
        formula.families?.find((id) => families.some((family) => family.id === id)) ?? frontier.id;

      const activeAnchors = () => mode === "discipline" ? domains : [...families, frontier];

      const activeEdges = (): Edge[] => {
        if (mode === "discipline") {
          return formulas
            .map((formula) => ({
              from: `domain:${domainForFormula(formula)}`,
              to: formula.key,
              kind: "discipline" as const,
            }))
            .filter((edge) => nodeByKey.has(edge.from));
        }

        const familyEdges: Edge[] = [];
        for (const formula of formulas) {
          const memberships = formula.families?.filter((id) => families.some((family) => family.id === id)) ?? [];
          if (memberships.length === 0) {
            familyEdges.push({ from: frontier.key, to: formula.key, kind: "structure" });
          } else {
            for (const familyId of memberships) {
              familyEdges.push({ from: `family:${familyId}`, to: formula.key, kind: "structure" });
            }
          }
        }
        return familyEdges;
      };

      const createNodes = () => {
        for (const node of nodes) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `graph-node ${node.kind}`;
          button.dataset.key = node.key;
          button.setAttribute("aria-label", node.label);
          button.innerHTML = `
            <span class="node-core" aria-hidden="true"></span>
            <span class="node-label"></span>
          `;
          const label = button.querySelector<HTMLElement>(".node-label");
          if (label) label.textContent = node.label;
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            focusNode(node.key, true);
          });
          nodeLayer.appendChild(button);
          buttons.set(node.key, button);
        }
      };

      const seededOffset = (text: string) => {
        let hash = 2166136261;
        for (const char of text) {
          hash ^= char.charCodeAt(0);
          hash = Math.imul(hash, 16777619);
        }
        return ((hash >>> 0) % 1000) / 1000;
      };

      const placeLayout = () => {
        const rect = stage.getBoundingClientRect();
        const width = Math.max(rect.width, 640);
        const height = Math.max(rect.height, 620);
        const compact = rect.width < 760;
        const cx = compact ? width * 0.5 : width * 0.47;
        const cy = compact ? height * 0.46 : height * 0.52;
        const anchors = activeAnchors();
        const rx = compact ? width * 0.31 : Math.min(width * 0.31, 470);
        const ry = compact ? height * 0.25 : Math.min(height * 0.31, 300);

        anchors.forEach((anchor, index) => {
          const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(anchors.length, 1);
          anchor.x = cx + Math.cos(angle) * rx;
          anchor.y = cy + Math.sin(angle) * ry;
        });

        const visibleAnchorById = new Map(anchors.map((anchor) => [anchor.id, anchor]));
        const grouped = new Map<string, GraphNode[]>();
        for (const formula of formulas) {
          const groupId = mode === "discipline" ? domainForFormula(formula) : structureForFormula(formula);
          const group = grouped.get(groupId) ?? [];
          group.push(formula);
          grouped.set(groupId, group);
        }

        for (const [groupId, group] of grouped) {
          const anchor = visibleAnchorById.get(groupId);
          if (!anchor) continue;
          group.forEach((formula, index) => {
            const offset = seededOffset(formula.id) * Math.PI * 2;
            const angle = offset + index * 2.399963229728653;
            const ring = compact
              ? 54 + 19 * Math.sqrt(index + 1)
              : 68 + 24 * Math.sqrt(index + 1);
            formula.x = (anchor.x ?? cx) + Math.cos(angle) * ring;
            formula.y = (anchor.y ?? cy) + Math.sin(angle) * ring * 0.74;
          });
        }

        for (const node of nodes) {
          const button = buttons.get(node.key);
          if (!button) continue;
          const isAnchorVisible =
            node.kind === "formula" ||
            (mode === "discipline" && node.kind === "domain") ||
            (mode === "structure" && (node.kind === "family" || node.kind === "frontier"));

          button.classList.toggle("is-hidden", !isAnchorVisible);
          if (node.x != null && node.y != null) {
            button.style.setProperty("--node-x", `${node.x}px`);
            button.style.setProperty("--node-y", `${node.y}px`);
          }
        }

        drawEdges(width, height);
      };

      const drawEdges = (width: number, height: number) => {
        edgeSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        const edges = activeEdges();
        const activeKeys = new Set<string>();

        edges.forEach((edge, index) => {
          const from = nodeByKey.get(edge.from);
          const to = nodeByKey.get(edge.to);
          if (!from || !to || from.x == null || from.y == null || to.x == null || to.y == null) return;

          const key = `${mode}:${edge.from}:${edge.to}:${index}`;
          activeKeys.add(key);
          let line = lines.get(key);
          if (!line) {
            line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.classList.add("graph-edge", edge.kind);
            edgeSvg.appendChild(line);
            lines.set(key, line);
          }
          line.setAttribute("x1", String(from.x));
          line.setAttribute("y1", String(from.y));
          line.setAttribute("x2", String(to.x));
          line.setAttribute("y2", String(to.y));
        });

        for (const [key, line] of lines) {
          const shouldShow = activeKeys.has(key);
          line.classList.toggle("is-hidden", !shouldShow);
        }

        applyFocus();
      };

      const detailKind = (node: GraphNode) => {
        if (node.kind === "formula") return `EQUAÇÃO · ${(node.status || "candidate").toUpperCase()}`;
        if (node.kind === "family") return `FAMÍLIA · ${(node.status || "hypothesis").toUpperCase()}`;
        if (node.kind === "domain") return "DOMÍNIO CIENTÍFICO";
        return "FRONTEIRA DE PESQUISA";
      };

      const updatePanel = (node: GraphNode) => {
        panelKind.textContent = detailKind(node);
        panelTitle.textContent = node.label;
        panelEquation.textContent = node.latex || "";
        panelEquation.hidden = !node.latex;
        panelSummary.textContent = node.summary || node.description || "";
        if (node.sourceUrl) {
          panelSource.hidden = false;
          panelSource.href = node.sourceUrl;
          panelSource.textContent = node.sourceLabel ? `Fonte: ${node.sourceLabel} ↗` : "Ver fonte ↗";
        } else {
          panelSource.hidden = true;
          panelSource.removeAttribute("href");
        }
        panel.classList.add("is-open");
      };

      const neighborSet = () => {
        if (!focused) return new Set<string>();
        const set = new Set<string>([focused]);
        for (const edge of activeEdges()) {
          if (edge.from === focused) set.add(edge.to);
          if (edge.to === focused) set.add(edge.from);
        }
        return set;
      };

      const applyFocus = () => {
        const neighbors = neighborSet();
        for (const [key, button] of buttons) {
          button.classList.toggle("is-focused", focused === key);
          button.classList.toggle("is-dimmed", Boolean(focused) && !neighbors.has(key));
        }
        for (const [key, line] of lines) {
          if (line.classList.contains("is-hidden")) continue;
          const parts = key.split(":");
          const edgeFrom = parts.slice(2, -2).join(":");
          const edgeTo = parts.slice(-2, -1).join(":");
          const related = !focused || key.includes(focused.replace(":", ":"));
          line.classList.toggle("is-dimmed", Boolean(focused) && !related && !neighbors.has(edgeFrom) && !neighbors.has(edgeTo));
        }
      };

      const focusNode = (key: string | null, userInitiated = false) => {
        focused = key;
        if (userInitiated && autoMorphTimer) {
          window.clearTimeout(autoMorphTimer);
          autoMorphTimer = undefined;
        }
        if (!key) {
          panel.classList.remove("is-open");
          applyFocus();
          return;
        }
        const node = nodeByKey.get(key);
        if (!node) return;
        updatePanel(node);
        applyFocus();
      };

      const switchMode = (nextMode: "discipline" | "structure", userInitiated = false) => {
        mode = nextMode;
        focused = null;
        panel.classList.remove("is-open");
        universe.dataset.mode = mode;
        modeButtons.forEach((button) => {
          const active = button.dataset.mode === mode;
          button.classList.toggle("is-active", active);
          button.setAttribute("aria-pressed", String(active));
        });
        placeLayout();
        if (userInitiated && autoMorphTimer) {
          window.clearTimeout(autoMorphTimer);
          autoMorphTimer = undefined;
        }
      };

      createNodes();
      universe.dataset.mode = mode;
      placeLayout();

      modeButtons.forEach((button) => {
        button.addEventListener("click", () => switchMode(button.dataset.mode as "discipline" | "structure", true));
      });

      spotlightButtons.forEach((button) => {
        button.addEventListener("click", () => {
          switchMode("structure", true);
          const familyId = button.dataset.focusFamily;
          if (familyId) {
            window.setTimeout(() => focusNode(`family:${familyId}`, true), 450);
          }
        });
      });

      stage.addEventListener("click", () => focusNode(null, true));
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") focusNode(null, true);
      });

      const observer = new ResizeObserver(() => placeLayout());
      observer.observe(stage);

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!prefersReducedMotion) {
        autoMorphTimer = window.setTimeout(() => {
          if (!focused && mode === "discipline") switchMode("structure", false);
        }, 3200);
      }
    }
  }

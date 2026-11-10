
  import {
    applyAction,
    createGame,
    getPublicState,
    summarizeGame,
    type GameState,
    type InvestigationKind,
    type PlayerAction,
    type PublicGameState,
  } from "./engine";

  let state: GameState | null = null;
  let initialPrice = 0.93;

  const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector);

  function randomSeed(): string {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    return `${values[0]!.toString(36)}-${values[1]!.toString(36)}`;
  }

  function money(value: number, digits = 0): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(value);
  }

  function compact(value: number): string {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }

  function signedPercent(value: number): string {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  }

  function eventClass(kind: string): string {
    return `rug-feed-${kind.replace(/[^a-z]/g, "")}`;
  }

  function renderFeed(view: PublicGameState): void {
    const feed = $("#rug-feed");
    if (!feed) return;
    feed.replaceChildren();

    for (const event of view.feed.slice(-18)) {
      const row = document.createElement("li");
      row.className = eventClass(event.kind);

      const meta = document.createElement("span");
      meta.className = "rug-feed-meta";
      meta.textContent = `T+${String(event.beat).padStart(2, "0")} · ${event.label}`;

      const text = document.createElement("p");
      text.textContent = event.text;

      row.append(meta, text);
      feed.append(row);
    }

    feed.scrollTop = feed.scrollHeight;
  }

  function renderChart(view: PublicGameState): void {
    const line = $("#rug-chart-line") as SVGPolylineElement | null;
    if (!line) return;
    const points = view.priceHistory;
    const values = points.map((point) => point.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(0.000001, max - min);
    const width = 320;
    const height = 62;
    const top = 5;
    const coords = points.map((point, index) => {
      const x = points.length <= 1 ? 0 : (index / (points.length - 1)) * width;
      const y = top + (1 - (point.price - min) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    line.setAttribute("points", coords.join(" "));
  }

  function renderResult(current: GameState): void {
    const result = $("#rug-result");
    if (!result) return;
    if (current.status === "playing") {
      result.hidden = true;
      return;
    }

    const summary = summarizeGame(current);
    result.hidden = false;
    $("#rug-verdict")!.textContent = summary.verdict;
    $("#rug-final-value")!.textContent = money(summary.finalValue, 0);
    $("#rug-final-pnl")!.textContent = signedPercent(summary.pnlPercent);
    $("#rug-archetype")!.textContent = summary.archetype.replaceAll("_", " ");
    $("#rug-capture")!.textContent = `${summary.capturePercent.toFixed(0)}%`;

    const timeline = $("#rug-timeline");
    if (timeline) {
      timeline.replaceChildren();
      for (const item of summary.creatorTimeline) {
        const row = document.createElement("li");
        const time = document.createElement("strong");
        time.textContent = `T+${String(item.beat).padStart(2, "0")}`;
        const text = document.createElement("span");
        text.textContent = item.note;
        row.append(time, text);
        timeline.append(row);
      }
    }

    for (const button of document.querySelectorAll<HTMLButtonElement>(
      "[data-rug-action], [data-rug-investigate]"
    )) {
      button.disabled = true;
    }
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function render(): void {
    if (!state) return;
    const view = getPublicState(state);
    const priceChange = ((view.market.price - initialPrice) / initialPrice) * 100;

    $("#rug-symbol")!.textContent = view.token.symbol;
    $("#rug-name")!.textContent = view.token.name;
    $("#rug-price")!.textContent = money(view.market.price, view.market.price < 1 ? 4 : 2);
    const change = $("#rug-change")!;
    change.textContent = signedPercent(priceChange);
    change.dataset.direction = priceChange >= 0 ? "up" : "down";
    $("#rug-portfolio")!.textContent = money(view.portfolioValue, 0);
    $("#rug-cash")!.textContent = money(view.player.cash, 0);
    $("#rug-liquidity")!.textContent = money(view.market.liquidity, 0);
    $("#rug-holders")!.textContent = compact(view.market.holders);
    $("#rug-beat")!.textContent = `T+${String(view.beat).padStart(2, "0")}`;
    $("#rug-seed")!.textContent = view.seed;
    $("#rug-attention")!.textContent = `Research ${"●".repeat(view.attention)}${"○".repeat(
      view.maxAttention - view.attention
    )}`;

    renderChart(view);
    renderFeed(view);
    renderResult(state);

    for (const button of document.querySelectorAll<HTMLButtonElement>("[data-rug-investigate]")) {
      button.disabled = view.status !== "playing" || view.attention <= 0;
    }
    for (const button of document.querySelectorAll<HTMLButtonElement>("[data-rug-action]")) {
      button.disabled = view.status !== "playing";
    }
  }

  function start(seed = randomSeed()): void {
    state = createGame(seed);
    initialPrice = state.priceHistory[0]?.price ?? state.market.price;
    $("#rug-intro")!.hidden = true;
    $("#rug-game")!.hidden = false;
    $("#rug-result")!.hidden = true;
    for (const button of document.querySelectorAll<HTMLButtonElement>(
      "[data-rug-action], [data-rug-investigate]"
    )) {
      button.disabled = false;
    }
    render();
  }

  function dispatch(action: PlayerAction): void {
    if (!state || state.status !== "playing") return;
    state = applyAction(state, action);
    render();
  }

  function bind(): void {
    $("#rug-start")?.addEventListener("click", () => start());
    $("#rug-new")?.addEventListener("click", () => start());
    $("#rug-reset")?.addEventListener("click", () => start());
    $("#rug-replay")?.addEventListener("click", () => state && start(state.seed));

    for (const button of document.querySelectorAll<HTMLButtonElement>("[data-rug-action]")) {
      button.addEventListener("click", () => {
        const action = button.dataset.rugAction;
        if (action === "buy") dispatch({ type: "buy" });
        if (action === "hold") dispatch({ type: "hold" });
        if (action === "sell25") dispatch({ type: "sell", fraction: 0.25 });
        if (action === "sell50") dispatch({ type: "sell", fraction: 0.5 });
        if (action === "sell100") dispatch({ type: "sell", fraction: 1 });
      });
    }

    for (const button of document.querySelectorAll<HTMLButtonElement>("[data-rug-investigate]")) {
      button.addEventListener("click", () => {
        const kind = button.dataset.rugInvestigate as InvestigationKind | undefined;
        if (kind) dispatch({ type: "investigate", kind });
      });
    }
  }

  document.addEventListener("zola:page-load", bind);


export type Archetype =
  | "sociopath"
  | "true_believer"
  | "desperate_dev"
  | "accidental_success";

export type GameStatus =
  | "playing"
  | "exited"
  | "rugged"
  | "collapsed"
  | "survived";

export type FeedKind =
  | "dev"
  | "holder"
  | "market"
  | "wallet"
  | "chain"
  | "research"
  | "system";

export type TradeAction =
  | { type: "hold" }
  | { type: "buy" }
  | { type: "sell"; fraction: 0.25 | 0.5 | 1 };

export type InvestigationKind = "wallet" | "liquidity" | "contract" | "creator";

export type PlayerAction =
  | TradeAction
  | { type: "investigate"; kind: InvestigationKind };

export interface FeedEvent {
  id: number;
  beat: number;
  kind: FeedKind;
  label: string;
  text: string;
}

export interface PricePoint {
  beat: number;
  price: number;
}

interface CreatorState {
  archetype: Archetype;
  greed: number;
  fear: number;
  competence: number;
  attachment: number;
  deception: number;
  cashPressure: number;
  suspicionEstimate: number;
  intent: "build" | "delay_then_extract" | "pump_then_dump" | "panic";
  targetLiquidity: number;
  walletMoved: number;
  hasRealCexContact: boolean;
  rugAbandoned: boolean;
  timeline: Array<{ beat: number; note: string }>;
}

export interface GameState {
  seed: string;
  rng: number;
  beat: number;
  status: GameStatus;
  token: {
    symbol: string;
    name: string;
  };
  market: {
    price: number;
    liquidity: number;
    holders: number;
    volume: number;
    hype: number;
    confidence: number;
    suspicion: number;
    topHolderConcentration: number;
    contractRisk: number;
  };
  player: {
    tokens: number;
    cash: number;
    costBasis: number;
    realized: number;
    attention: number;
    maxAttention: number;
  };
  creator: CreatorState;
  feed: FeedEvent[];
  priceHistory: PricePoint[];
  peakPortfolio: number;
  eventSeq: number;
}

export interface PublicGameState {
  seed: string;
  beat: number;
  status: GameStatus;
  token: GameState["token"];
  market: GameState["market"];
  player: GameState["player"];
  feed: FeedEvent[];
  priceHistory: PricePoint[];
  portfolioValue: number;
  pnlPercent: number;
  attention: number;
  maxAttention: number;
}

export interface GameSummary {
  status: GameStatus;
  seed: string;
  archetype: Archetype;
  finalValue: number;
  pnlPercent: number;
  peakPortfolio: number;
  capturePercent: number;
  creatorTimeline: Array<{ beat: number; note: string }>;
  verdict: string;
}

const SYMBOLS = ["DUCK", "MOON", "PEPE2", "WAGMI", "BORK", "LAMBO", "COPE"];
const NAMES = [
  "Duck Protocol",
  "Moon Department",
  "Pepe Again",
  "Wagmi Labs",
  "Bork Finance",
  "Lambo Club",
  "Cope Network",
];

const DEV_LINES: Record<string, string[]> = {
  tease: [
    "Huge announcement tonight. Can't say more yet 🔥",
    "Just got off a call that changes everything. NDA for now.",
    "You are not ready for what ships next. That's all I can say.",
  ],
  reassure: [
    "Wallet movement is operational. Stop feeding the FUD.",
    "Nothing changed in the thesis. I am still here building.",
    "Some people see one transfer and forget how treasury ops work.",
  ],
  argue_fud: [
    "Funny how the same accounts appear every time price dips.",
    "If you need me to explain every candle, this may not be your coin.",
    "FUD season right on schedule. Builders keep building.",
  ],
  ship_update: [
    "Dashboard v0 is live. Ugly, but real. Feedback welcome.",
    "Contract docs are up. Read them before yelling in caps.",
    "Pushed the wallet tracker we promised. More tomorrow.",
  ],
  silence: [
    "...",
    "brb, handling something off-chat",
    "Need an hour. Do not speculate.",
  ],
  celebrate: [
    "This community is insane. We crossed another milestone organically.",
    "I thought this would be tiny. You people broke the chart.",
    "Okay, this is officially bigger than the original plan.",
  ],
  dump_cover: [
    "Treasury diversification. We need runway if this is going to scale.",
    "Moved part of the allocation for market making and operations.",
    "Yes, tokens moved. No, that does not mean what CT thinks it means.",
  ],
};

const HOLDER_LINES = [
  "BINANCE??? 👀",
  "dev wallet moved, anyone checking this?",
  "this is either 20x or the funniest lesson of my life",
  "chart looks healthy if you ignore the part where it doesn't",
  "why is everyone panicking over one transfer",
  "LP check please. not vibes. actual LP.",
  "dev is cooking or cooking us",
];

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
const roundMoney = (value: number) => Math.round(value * 100) / 100;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

function random(state: GameState): number {
  let x = state.rng >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.rng = x >>> 0 || 1;
  return state.rng / 0x100000000;
}

function pick<T>(state: GameState, values: readonly T[]): T {
  return values[Math.floor(random(state) * values.length)]!;
}

function creatorFor(archetype: Archetype): CreatorState {
  switch (archetype) {
    case "sociopath":
      return {
        archetype,
        greed: 0.94,
        fear: 0.18,
        competence: 0.76,
        attachment: 0.08,
        deception: 0.9,
        cashPressure: 0.36,
        suspicionEstimate: 0.3,
        intent: "delay_then_extract",
        targetLiquidity: 150_000,
        walletMoved: 0,
        hasRealCexContact: false,
        rugAbandoned: false,
        timeline: [],
      };
    case "true_believer":
      return {
        archetype,
        greed: 0.35,
        fear: 0.33,
        competence: 0.5,
        attachment: 0.93,
        deception: 0.14,
        cashPressure: 0.22,
        suspicionEstimate: 0.25,
        intent: "build",
        targetLiquidity: 800_000,
        walletMoved: 0,
        hasRealCexContact: true,
        rugAbandoned: true,
        timeline: [],
      };
    case "desperate_dev":
      return {
        archetype,
        greed: 0.62,
        fear: 0.52,
        competence: 0.57,
        attachment: 0.66,
        deception: 0.48,
        cashPressure: 0.82,
        suspicionEstimate: 0.28,
        intent: "build",
        targetLiquidity: 245_000,
        walletMoved: 0,
        hasRealCexContact: false,
        rugAbandoned: false,
        timeline: [],
      };
    case "accidental_success":
      return {
        archetype,
        greed: 0.79,
        fear: 0.29,
        competence: 0.43,
        attachment: 0.2,
        deception: 0.66,
        cashPressure: 0.25,
        suspicionEstimate: 0.27,
        intent: "pump_then_dump",
        targetLiquidity: 185_000,
        walletMoved: 0,
        hasRealCexContact: false,
        rugAbandoned: false,
        timeline: [],
      };
  }
}

function addFeed(
  state: GameState,
  kind: FeedKind,
  label: string,
  text: string
): void {
  state.eventSeq += 1;
  state.feed.push({ id: state.eventSeq, beat: state.beat, kind, label, text });
  if (state.feed.length > 80) state.feed.splice(0, state.feed.length - 80);
}

function note(state: GameState, text: string): void {
  state.creator.timeline.push({ beat: state.beat, note: text });
}

function portfolioValue(state: GameState): number {
  return state.player.cash + state.player.tokens * state.market.price;
}

function applyTrade(state: GameState, action: TradeAction): void {
  if (action.type === "hold") return;

  if (action.type === "buy") {
    const spend = state.player.cash * 0.5;
    if (spend < 1) {
      addFeed(state, "system", "YOU", "Not enough cash to buy more.");
      return;
    }
    const fee = spend * 0.003;
    const received = (spend - fee) / state.market.price;
    state.player.cash -= spend;
    state.player.tokens += received;
    state.market.price *=
      1 + Math.min(0.025, spend / Math.max(state.market.liquidity, 1));
    addFeed(state, "system", "YOU", `Bought $${roundMoney(spend)} more.`);
    return;
  }

  const tokens = state.player.tokens * action.fraction;
  if (tokens <= 0) {
    addFeed(state, "system", "YOU", "No tokens left to sell.");
    return;
  }

  const gross = tokens * state.market.price;
  const slippage = clamp(gross / Math.max(state.market.liquidity, 1), 0, 0.18);
  const net = gross * (1 - slippage) * 0.997;
  state.player.tokens -= tokens;
  state.player.cash += net;
  state.player.realized += net;
  state.market.price *= Math.max(0.75, 1 - slippage * 0.65);
  addFeed(
    state,
    "system",
    "YOU",
    `Sold ${Math.round(action.fraction * 100)}% of the position for $${roundMoney(net)}.`
  );
}

function investigate(state: GameState, kind: InvestigationKind): boolean {
  if (state.player.attention <= 0) {
    addFeed(
      state,
      "system",
      "ATTENTION",
      "No investigation charge available yet."
    );
    return false;
  }

  state.player.attention -= 1;

  switch (kind) {
    case "wallet": {
      const moved = state.creator.walletMoved;
      const message =
        moved > 0
          ? `Creator-linked wallets moved about $${Math.round(moved).toLocaleString("en-US")} this run. ${
              moved > 18_000
                ? "Several transfers lead toward liquid venues."
                : "Most destinations are still ambiguous."
            }`
          : "No meaningful creator-wallet outflow detected yet.";
      addFeed(state, "research", "WALLET CHECK", message);
      break;
    }
    case "liquidity": {
      const lockQuality =
        state.creator.archetype === "sociopath" ? "short and partial" : "mixed";
      addFeed(
        state,
        "research",
        "LP CHECK",
        `Visible liquidity is $${Math.round(state.market.liquidity).toLocaleString("en-US")}. Lock coverage looks ${lockQuality}; admin-controlled LP remains possible.`
      );
      break;
    }
    case "contract": {
      const risk = state.market.contractRisk;
      addFeed(
        state,
        "research",
        "CONTRACT CHECK",
        risk > 0.65
          ? "Owner privileges are broad: fee and transfer controls are still live. Not a rug by itself, but the blast radius is real."
          : risk > 0.35
            ? "Contract keeps a few admin powers. Nothing obviously fatal, nothing fully trustless either."
            : "Contract surface is comparatively boring: limited admin power and no obvious hidden mint path."
      );
      break;
    }
    case "creator": {
      const clue =
        state.creator.archetype === "sociopath"
          ? "The creator identity is fresh, but two old aliases share phrasing and deploy timing with failed tokens."
          : state.creator.archetype === "true_believer"
            ? "The creator has years of public posts obsessing over the same idea, including long before this token existed."
            : state.creator.archetype === "desperate_dev"
              ? "The creator has a real older identity and recent hints of personal financial stress."
              : "The identity is real-ish but thin. Older posts show lots of tiny experiments and abandoned launches.";
      addFeed(state, "research", "CREATOR SEARCH", clue);
      break;
    }
  }

  return true;
}

function updateCreator(state: GameState): void {
  const creator = state.creator;
  const market = state.market;
  creator.suspicionEstimate = clamp(
    creator.suspicionEstimate * 0.72 + market.suspicion * 0.28
  );

  if (creator.archetype === "desperate_dev") {
    creator.cashPressure = clamp(
      creator.cashPressure + 0.018 + (market.confidence < 0.35 ? 0.02 : 0)
    );
    if (creator.cashPressure > 0.9 && creator.intent === "build") {
      creator.intent = "delay_then_extract";
      note(
        state,
        "Cash pressure crossed the point where taking treasury money started to feel justified."
      );
    }
  }

  if (creator.archetype === "accidental_success" && !creator.rugAbandoned) {
    if (
      market.hype > 0.8 &&
      market.liquidity > 275_000 &&
      creator.attachment > 0.45
    ) {
      creator.rugAbandoned = true;
      creator.intent = "build";
      note(
        state,
        "The project became worth more as an identity than as a one-time exit. Rug plan abandoned."
      );
    } else if (market.hype > 0.58) {
      creator.attachment = clamp(creator.attachment + 0.045);
    }
  }

  if (creator.archetype === "true_believer" && market.price < 0.42) {
    creator.fear = clamp(creator.fear + 0.08);
    if (creator.fear > 0.82) {
      creator.intent = "panic";
      note(
        state,
        "Belief remains sincere, but panic is now driving decisions."
      );
    }
  }
}

type CreatorAction =
  | "tease"
  | "reassure"
  | "argue_fud"
  | "ship_update"
  | "silence"
  | "wallet_transfer"
  | "staged_dump"
  | "remove_liquidity"
  | "celebrate";

function chooseCreatorAction(state: GameState): CreatorAction {
  const creator = state.creator;
  const market = state.market;
  const roll = random(state);
  const canExtract = !creator.rugAbandoned && creator.intent !== "build";
  const thresholdReached = market.liquidity >= creator.targetLiquidity;

  if (canExtract && thresholdReached && creator.suspicionEstimate < 0.76) {
    const extractionChance = creator.intent === "pump_then_dump" ? 0.22 : 0.3;
    if (roll < extractionChance) {
      return creator.archetype === "sociopath" &&
        market.liquidity > creator.targetLiquidity
        ? "remove_liquidity"
        : "staged_dump";
    }
  }

  if (creator.intent === "panic" && roll < 0.32) return "staged_dump";

  if (creator.suspicionEstimate > 0.58) {
    if (roll < 0.48 + creator.deception * 0.18) return "reassure";
    if (roll < 0.78) return "argue_fud";
  }

  if (creator.archetype === "true_believer" && roll < 0.38)
    return "ship_update";
  if (
    creator.archetype === "accidental_success" &&
    market.hype > 0.72 &&
    roll < 0.5
  )
    return "celebrate";
  if (creator.cashPressure > 0.76 && roll < 0.34) return "wallet_transfer";
  if (roll < 0.32) return "tease";
  if (roll < 0.52) return "ship_update";
  if (roll < 0.72) return "reassure";
  if (roll < 0.87) return "argue_fud";
  return "silence";
}

function applyCreatorAction(state: GameState, action: CreatorAction): void {
  const creator = state.creator;
  const market = state.market;

  switch (action) {
    case "tease":
      addFeed(state, "dev", "DEV", pick(state, DEV_LINES.tease));
      market.hype = clamp(market.hype + 0.08);
      market.confidence = clamp(market.confidence + 0.025);
      if (!creator.hasRealCexContact)
        note(
          state,
          "Used an ambiguous future-announcement tease without a concrete exchange deal."
        );
      break;
    case "reassure":
      addFeed(state, "dev", "DEV", pick(state, DEV_LINES.reassure));
      market.confidence = clamp(
        market.confidence + 0.04 + creator.deception * 0.025
      );
      market.suspicion = clamp(market.suspicion - 0.025);
      note(
        state,
        `Reassurance chosen because estimated holder suspicion was ${creator.suspicionEstimate.toFixed(2)}.`
      );
      break;
    case "argue_fud":
      addFeed(state, "dev", "DEV", pick(state, DEV_LINES.argue_fud));
      market.hype = clamp(market.hype + 0.02);
      market.suspicion = clamp(market.suspicion + 0.018);
      break;
    case "ship_update":
      addFeed(state, "dev", "DEV", pick(state, DEV_LINES.ship_update));
      market.confidence = clamp(market.confidence + 0.07 * creator.competence);
      market.hype = clamp(market.hype + 0.025);
      note(
        state,
        "Shipped a real project artifact; this message is materially grounded."
      );
      break;
    case "silence":
      addFeed(state, "dev", "DEV", pick(state, DEV_LINES.silence));
      market.suspicion = clamp(market.suspicion + 0.025);
      break;
    case "wallet_transfer": {
      const amount = 4_000 + random(state) * 12_000;
      creator.walletMoved += amount;
      addFeed(
        state,
        "wallet",
        "WALLET",
        `Creator-linked wallet moved $${Math.round(amount).toLocaleString("en-US")} to a fresh address.`
      );
      addFeed(state, "dev", "DEV", pick(state, DEV_LINES.dump_cover));
      market.suspicion = clamp(market.suspicion + 0.09);
      creator.cashPressure = clamp(creator.cashPressure - 0.12);
      note(
        state,
        `Moved about $${Math.round(amount).toLocaleString("en-US")} out of the creator wallet.`
      );
      break;
    }
    case "staged_dump": {
      const fraction =
        creator.intent === "panic" ? 0.18 : 0.12 + creator.greed * 0.12;
      const amount = Math.min(state.market.liquidity * fraction, 52_000);
      creator.walletMoved += amount;
      market.liquidity = Math.max(1_000, market.liquidity - amount * 0.42);
      market.price *= Math.max(0.36, 1 - 0.28 - fraction);
      market.confidence = clamp(market.confidence - 0.16);
      market.suspicion = clamp(market.suspicion + 0.24);
      addFeed(
        state,
        "wallet",
        "WHALE ALERT",
        `A creator-linked allocation sold roughly $${Math.round(amount).toLocaleString("en-US")} into the pool.`
      );
      addFeed(state, "dev", "DEV", pick(state, DEV_LINES.dump_cover));
      note(
        state,
        `Executed a staged sell worth about $${Math.round(amount).toLocaleString("en-US")}.`
      );
      if (creator.archetype === "desperate_dev" && creator.intent !== "panic") {
        creator.intent =
          market.suspicion > 0.75 ? "panic" : "delay_then_extract";
      }
      break;
    }
    case "remove_liquidity": {
      const removed = market.liquidity * (0.72 + random(state) * 0.2);
      creator.walletMoved += removed;
      market.liquidity = Math.max(500, market.liquidity - removed);
      market.price *= 0.035;
      market.confidence = 0.01;
      market.suspicion = 1;
      addFeed(
        state,
        "chain",
        "LIQUIDITY",
        `${Math.round(removed / 1000)}k liquidity removed from the pool.`
      );
      note(
        state,
        `Removed ${Math.round(removed).toLocaleString("en-US")} of liquidity and ended the game.`
      );
      state.status = "rugged";
      break;
    }
    case "celebrate":
      addFeed(state, "dev", "DEV", pick(state, DEV_LINES.celebrate));
      market.hype = clamp(market.hype + 0.075);
      market.confidence = clamp(market.confidence + 0.04);
      break;
  }
}

function moveMarket(state: GameState): void {
  if (state.status !== "playing") return;

  const market = state.market;
  const creator = state.creator;
  const noise = (random(state) - 0.5) * 0.18;
  const drift =
    (market.hype - 0.5) * 0.12 +
    (market.confidence - 0.5) * 0.09 -
    market.suspicion * 0.045 +
    noise;

  market.price = Math.max(0.015, market.price * (1 + drift));
  market.volume = Math.max(
    4_000,
    market.volume * (0.82 + random(state) * 0.44) + market.hype * 8_000
  );
  market.holders = Math.max(
    140,
    Math.round(
      market.holders +
        (market.hype - market.suspicion) * 115 +
        (random(state) - 0.5) * 90
    )
  );
  market.liquidity = Math.max(
    500,
    market.liquidity +
      (market.confidence - 0.42) * 6_500 +
      (random(state) - 0.45) * 4_400
  );
  market.hype = clamp(market.hype * 0.93 + random(state) * 0.055);
  market.confidence = clamp(
    market.confidence * 0.965 + (random(state) - 0.48) * 0.035
  );
  market.suspicion = clamp(
    market.suspicion * 0.95 + (random(state) - 0.52) * 0.025
  );

  if (creator.archetype === "true_believer")
    market.confidence = clamp(market.confidence + 0.008);
  if (
    creator.archetype === "sociopath" &&
    market.liquidity > creator.targetLiquidity * 0.8
  ) {
    market.hype = clamp(market.hype + 0.008);
  }
}

function maybeCommunityMessage(state: GameState): void {
  if (random(state) < 0.62)
    addFeed(state, "holder", "HOLDER", pick(state, HOLDER_LINES));

  if (
    state.market.price > state.priceHistory[0]!.price * 1.7 &&
    random(state) < 0.42
  ) {
    addFeed(
      state,
      "market",
      "MARKET",
      "Momentum scanners are picking up the token. Volume is accelerating."
    );
    state.market.hype = clamp(state.market.hype + 0.04);
  }

  if (state.market.suspicion > 0.72 && random(state) < 0.5) {
    addFeed(
      state,
      "holder",
      "HOLDER",
      "I am not saying rug. I am saying I want the wallet explanation before the next green candle."
    );
  }
}

function advanceBeat(state: GameState): void {
  state.beat += 1;
  if (state.beat % 4 === 0) {
    state.player.attention = Math.min(
      state.player.maxAttention,
      state.player.attention + 1
    );
  }

  updateCreator(state);
  const creatorAction = chooseCreatorAction(state);
  applyCreatorAction(state, creatorAction);
  moveMarket(state);
  maybeCommunityMessage(state);

  state.priceHistory.push({ beat: state.beat, price: state.market.price });
  if (state.priceHistory.length > 48) state.priceHistory.shift();

  state.peakPortfolio = Math.max(state.peakPortfolio, portfolioValue(state));

  if (state.status !== "playing") return;

  if (state.market.price < 0.11 && state.market.confidence < 0.14) {
    state.status = "collapsed";
    addFeed(
      state,
      "market",
      "MARKET",
      "The token is functionally dead. No single rug event — just no bid left."
    );
    note(
      state,
      "Project collapsed without a single catastrophic liquidity-removal event."
    );
    return;
  }

  if (state.beat >= 32) {
    state.status = "survived";
    addFeed(
      state,
      "system",
      "SESSION",
      "The token survived the high-risk launch window. Episode complete."
    );
    note(
      state,
      "Reached the end of the launch window without a terminal rug event."
    );
  }
}

export function createGame(seedInput: string | number = Date.now()): GameState {
  const seed = String(seedInput);
  const rng = hashSeed(seed);
  const archetypes: Archetype[] = [
    "sociopath",
    "true_believer",
    "desperate_dev",
    "accidental_success",
  ];

  const bootstrap = {
    seed,
    rng,
  } as GameState;
  const archetype = pick(bootstrap, archetypes);
  const symbolIndex = Math.floor(random(bootstrap) * SYMBOLS.length);
  const startingPrice = 0.93;
  const creator = creatorFor(archetype);

  const state: GameState = {
    seed,
    rng: bootstrap.rng,
    beat: 0,
    status: "playing",
    token: {
      symbol: `$${SYMBOLS[symbolIndex]}`,
      name: NAMES[symbolIndex]!,
    },
    market: {
      price: startingPrice,
      liquidity: 118_000 + Math.round(random(bootstrap) * 24_000),
      holders: 2_100 + Math.round(random(bootstrap) * 900),
      volume: 28_000 + Math.round(random(bootstrap) * 12_000),
      hype: 0.48 + random(bootstrap) * 0.1,
      confidence: 0.48 + random(bootstrap) * 0.08,
      suspicion: 0.24 + random(bootstrap) * 0.08,
      topHolderConcentration: 0.32 + random(bootstrap) * 0.28,
      contractRisk:
        archetype === "sociopath" ? 0.72 : 0.28 + random(bootstrap) * 0.34,
    },
    player: {
      tokens: 1_000,
      cash: 0,
      costBasis: 1_000,
      realized: 0,
      attention: 2,
      maxAttention: 2,
    },
    creator,
    feed: [],
    priceHistory: [{ beat: 0, price: startingPrice }],
    peakPortfolio: 1_180,
    eventSeq: 0,
  };
  state.rng = bootstrap.rng;

  addFeed(
    state,
    "system",
    "POSITION",
    `You bought $1,000 of ${state.token.symbol}. You are already down 7%.`
  );
  addFeed(
    state,
    "dev",
    "DEV",
    "Welcome. Ignore the noise, read what we ship, and do not confuse volatility with failure."
  );
  addFeed(
    state,
    "holder",
    "HOLDER",
    "early crew. either we are geniuses or this becomes a screenshot."
  );
  note(
    state,
    `Creator archetype initialized as ${archetype}; player cannot see this during play.`
  );

  state.peakPortfolio = portfolioValue(state);
  return state;
}

export function applyAction(state: GameState, action: PlayerAction): GameState {
  if (state.status !== "playing") return state;

  const next = structuredClone(state);

  if (action.type === "investigate") {
    const consumed = investigate(next, action.kind);
    if (!consumed) return next;
  } else {
    applyTrade(next, action);
    if (action.type === "sell" && next.player.tokens < 0.000001) {
      next.player.tokens = 0;
      next.status = "exited";
      note(next, "Player fully exited before the creator's next move.");
      next.peakPortfolio = Math.max(next.peakPortfolio, portfolioValue(next));
      return next;
    }
  }

  advanceBeat(next);
  return next;
}

export function getPublicState(state: GameState): PublicGameState {
  const value = portfolioValue(state);
  return {
    seed: state.seed,
    beat: state.beat,
    status: state.status,
    token: structuredClone(state.token),
    market: structuredClone(state.market),
    player: structuredClone(state.player),
    feed: structuredClone(state.feed),
    priceHistory: structuredClone(state.priceHistory),
    portfolioValue: value,
    pnlPercent:
      ((value - state.player.costBasis) / state.player.costBasis) * 100,
    attention: state.player.attention,
    maxAttention: state.player.maxAttention,
  };
}

export function summarizeGame(state: GameState): GameSummary {
  if (state.status === "playing")
    throw new Error("Cannot summarize an active game.");

  const finalValue = portfolioValue(state);
  const pnlPercent =
    ((finalValue - state.player.costBasis) / state.player.costBasis) * 100;
  const capturePercent =
    state.peakPortfolio <= 0 ? 0 : (finalValue / state.peakPortfolio) * 100;

  let verdict = "You survived the launch window.";
  if (state.status === "exited")
    verdict =
      pnlPercent >= 0
        ? "You got out with the bag intact."
        : "You escaped, but paid tuition.";
  if (state.status === "rugged") verdict = "The creator got to the exit first.";
  if (state.status === "collapsed")
    verdict = "No cinematic rug. The market simply died.";
  if (state.status === "survived" && state.creator.rugAbandoned)
    verdict =
      "The project survived — and the creator's plan changed along the way.";

  return {
    status: state.status,
    seed: state.seed,
    archetype: state.creator.archetype,
    finalValue,
    pnlPercent,
    peakPortfolio: state.peakPortfolio,
    capturePercent,
    creatorTimeline: structuredClone(state.creator.timeline),
    verdict,
  };
}

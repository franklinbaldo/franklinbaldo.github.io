# Rug Pull Simulator — Web MVP GDD

> Status: design draft
>
> Target: first playable web version published from `franklinbaldo.github.io`
>
> Working title: **Rug Pull Simulator**. The name is intentionally provisional because there are already small games/projects using the same phrase. Naming is a product decision, not a blocker for the prototype.

## 1. One-line pitch

**You already bought the shitcoin. Read the creator, read the market, and get out before the creator gets out through you.**

The game is not primarily about predicting a chart. It is about predicting a person — represented by an autonomous creator agent whose intentions, incentives and emotional state are only partially observable through a live stream of messages and market events.

## 2. Starting fiction

The player does **not** begin on a clean portfolio screen choosing among assets.

The mistake has already happened.

```text
You bought $1,000 of $DUCK.

You don't know who made it.
You don't know if they're going to rug.
You are already down 7%.

Good luck.
```

The first meaningful button is:

```text
ENTER TELEGRAM →
```

That establishes the central dramatic fact: this is a game about managing an existing exposure under uncertainty, not a generic trading simulator.

## 3. Player fantasy

The player fantasy is:

> **I can tell what this person is really going to do before everybody else can.**

The satisfying moment is not merely buying low and selling high. It is reading a suspicious message, combining it with wallet movement, community mood and price action, and realizing:

> _He is calming everyone down because he needs thirty more seconds._

Then selling.

The inverse should also happen. Sometimes the player becomes too cynical, sells at the first suspicious signal, and watches a chaotic but legitimate project go another 20x.

Correctly identifying a scam is therefore insufficient. The game rewards **timing under partial information**.

## 4. Design thesis

Most crypto trading games model the asset as the puzzle.

This game models the **creator as the puzzle**.

The chart, liquidity, wallet movements and chat are observations emitted by a hidden social/economic process.

At the core is a theory-of-mind loop:

```text
creator has hidden state
        ↓
creator takes actions and communicates
        ↓
market/community react
        ↓
player observes incomplete evidence
        ↓
player updates beliefs and trades/investigates
        ↓
creator observes the resulting market
        ↓
creator updates strategy
```

The difficult versions of the game become adversarial because the creator knows that holders are watching for rug signals.

## 5. Core pillars

### 5.1 Read the dev, not just the candle

Text is gameplay.

A message such as:

> `LP situation is being handled. Some whales are trying to FUD us.`

is not flavor text pasted over a price simulation. It is an action by the creator, produced in context, with a purpose.

The player should continuously ask:

- Why did the creator say this now?
- What are they trying to make holders believe?
- Does the message fit the observable chain data?
- Is this fear, incompetence, manipulation, excitement or a genuine update?
- What does the creator need from the market before their next action?

### 5.2 There is no perfect signal

Every suspicious event must admit innocent explanations, and every reassuring event must admit manipulative explanations.

Examples:

- developer wallet transfer may be marketing expenditure or preparation to dump;
- liquidity lock may be meaningful protection or just too small/short to matter;
- a CEX rumor may be a lie, a premature leak or a real negotiation;
- creator silence may mean panic, sleep, legal caution or exit preparation;
- a huge pump may reduce rug probability for a true believer and increase it for an opportunist.

The game dies if it becomes a checklist of red flags.

### 5.3 Selling too early is also losing

If obvious suspicion always means `SELL ALL`, the game collapses into binary detection.

A great run can involve knowingly staying in a project whose creator is likely malicious because the player correctly estimates that the creator is still waiting for more liquidity.

The real question is:

> **Not “is this a scam?”, but “what is this person likely to do next, and when?”**

### 5.4 The creator can change

The creator is not assigned a single immutable boolean `scammer = true`.

A project can begin legitimate and become a rug.

A creator who planned a small scam may become a true believer after unexpected success. A true believer may panic after a crash. A desperate creator may begin extracting funds after an external need. A serial rugger may decide that preserving a valuable identity is worth more than stealing this particular pool.

The game should produce stories, not reveal labels.

## 6. Session structure

Target MVP session length: **5–12 minutes**.

A session represents the compressed life of one memecoin, from the player's initial position until one of these endings:

- player exits fully;
- liquidity is catastrophically removed;
- project collapses through ordinary market failure;
- project becomes sufficiently stable/successful that the episode resolves as a win condition;
- configurable hard time limit is reached.

A typical session contains 20–60 simulation beats.

Each beat may include one or more of:

- creator message;
- holder/community message;
- influencer message;
- wallet movement;
- liquidity event;
- price/volume movement;
- contract/admin event;
- rumor/news event;
- player investigation result.

The player is not required to act on every beat. The stream should create pressure without turning into a reaction-time game.

## 7. Primary screen

The first version should be playable on one responsive screen, especially on mobile browsers.

Suggested layout:

```text
┌─────────────────────────────────────┐
│ $DUCK          $0.000041   +18.4%   │
│ You: $1,184     Cash: $0            │
│ Liquidity: $214k      Holders: 4.8k │
├─────────────────────────────────────┤
│ LIVE FEED                           │
│                                     │
│ DEV: Huge announcement tonight 🔥   │
│                                     │
│ WALLET: Dev → 4.2 ETH               │
│                                     │
│ DEV: Marketing wallet guys. Relax.  │
│                                     │
│ HOLDER: BINANCE??? 👀                │
│                                     │
├─────────────────────────────────────┤
│ [BUY] [SELL 25%] [SELL 50%]         │
│ [SELL ALL] [HOLD]                    │
├─────────────────────────────────────┤
│ Investigate:                         │
│ [Wallet] [Contract] [History] [LP]  │
└─────────────────────────────────────┘
```

The feed is the visual center. The chart is supporting evidence, not the dominant object.

A tiny sparkline can exist, but the MVP should resist becoming a miniature exchange terminal.

## 8. Player actions

### 8.1 Trading actions

Initial set:

- `BUY` — add a fixed fraction of current cash to the position;
- `SELL 25%`;
- `SELL 50%`;
- `SELL ALL`;
- `HOLD` / simply wait.

For the first prototype, fixed fractions are better than a free-form order ticket. Decisions should be fast and legible.

No leverage, derivatives, stop-loss configuration or order-book mechanics in MVP.

### 8.2 Investigation actions

The player has limited **attention**.

Possible investigations:

- `CHECK WALLET` — inspect recent creator/treasury movements;
- `CHECK LIQUIDITY` — inspect liquidity size, lock/burn status and changes;
- `CHECK CONTRACT` — inspect mint/admin/blacklist/tax capabilities in simplified form;
- `SEARCH CREATOR` — look for identity/history clues;
- `READ HOLDERS` — sample community sentiment and rumors;
- `CHECK TOP HOLDERS` — reveal concentration and suspicious coordination.

An investigation consumes time/attention. The market continues to evolve while the player looks.

This creates a real cost:

```text
spend three beats investigating
        ↓
learn something valuable
        ↓
perhaps miss +180% price movement
```

or:

```text
ignore the wallet anomaly
        ↓
LIQUIDITY REMOVED
        ↓
-99.7%
```

### 8.3 Attention budget

MVP proposal:

- one investigation charge regenerates every N beats;
- maximum 2–3 stored charges;
- trading actions do not consume investigation charges;
- some archetypes intentionally create noise to exhaust attention.

This should be tuned experimentally. The design goal is scarcity of certainty, not frustration.

## 9. Hidden creator model

The creator is represented by a private structured state plus an LLM-driven communication policy.

The LLM must **not** be responsible for the entire game economy. Numeric state and game rules remain in a deterministic simulation engine. The model decides/interprets high-level creator behavior and generates language consistent with that state.

Illustrative hidden state:

```yaml
identity:
  archetype: desperate_dev
  reputation_value: 0.34

traits:
  greed: 0.78
  fear: 0.31
  competence: 0.56
  impulsivity: 0.44
  attachment_to_project: 0.22
  deception_skill: 0.71

needs:
  cash_pressure: 0.64
  status_need: 0.49

beliefs:
  holder_suspicion: 0.41
  expected_next_liquidity: 0.73
  rug_detection_risk: 0.36

intent:
  mode: delay_then_extract
  target_liquidity: 420000
  preferred_exit: staged_dump

knowledge:
  real_cex_contact: false
  marketing_deal: true
  treasury_need: 12000

current_narrative:
  claim: cex_listing_tease
  truthfulness: deceptive
```

The player never sees this object during normal play.

### 9.1 State transitions

Hidden state updates after events.

Examples:

- liquidity rises → greed/opportunity may rise;
- holders become suspicious → fear rises, reassurance behavior becomes more likely;
- player/whales sell → creator may accelerate rug or attempt confidence restoration;
- organic influencer endorsement → attachment/status can rise;
- project unexpectedly succeeds → planned rugger may delay or abandon rug;
- price crashes → true believer may panic and become extractor;
- contract exploit rumor → competent creator may respond differently from amateur.

The simulation should therefore allow a creator's plan to mutate during the episode.

## 10. Creator archetypes

Archetypes are priors, not scripts.

### The Amateur

Started with sincere intent. Communicates badly. Moves funds in suspicious-looking ways. May accidentally create a panic and then make it worse.

### The Sociopath

Rug was contemplated from the beginning. Patient, strategically reassuring and willing to manufacture evidence of legitimacy.

### The Influencer

May never remove liquidity. Their exit is distribution into followers after pumping attention. “No rug” does not mean holders are safe.

### The True Believer

Believes an absurd project is genuinely revolutionary. Can produce many classic scam signals through delusion, incompetence and hype while having no initial intent to steal.

### The Desperate Dev

Begins legitimate. External cash pressure can push them into increasingly dubious treasury actions.

### The Mastermind

Understands the community's red-flag heuristics and deliberately manipulates them. May emit fake suspiciousness to shake out cautious holders, then create strong legitimacy signals before the real exit.

### The Serial Rugger

Optimizes for repeatability, identity separation and extraction. Historical investigation can expose weak links.

### The Accidental Success

Planned a tiny opportunistic scam and unexpectedly finds themselves controlling a token worth millions. Their objective can change dramatically mid-session.

MVP should ship with **at least four** meaningfully different archetypes. More archetypes are cheap only if they actually change inference; cosmetic labels do not count.

## 11. Creator agent contract

The creator agent receives a structured observation, not arbitrary control of the game.

Conceptually:

```json
{
  "private_state": "...",
  "public_market": "...",
  "recent_events": "...",
  "community_state": "...",
  "available_creator_actions": "..."
}
```

It returns a constrained action object such as:

```json
{
  "action": "reassure_holders",
  "message": "Marketing wallet guys. Relax. Big update tonight.",
  "claim_refs": ["marketing_transfer", "future_announcement"],
  "desired_effect": "reduce_suspicion",
  "tone": "confident"
}
```

The engine validates the action and applies numeric effects.

Important rule:

> **The LLM can choose and phrase actions; it cannot directly set price, liquidity, player balance or victory.**

This keeps the game testable and prevents prompt randomness from becoming the economy.

## 12. Truth, lies and claims

Messages should carry semantic claims that can later be checked against reality.

Example:

```yaml
claim:
  kind: cex_listing
  public_text: "Can't say which exchange yet 👀"
  truth_state: false
  creator_belief: false
  purpose: retain_holders
```

This permits several useful categories:

- true and known true;
- false and known false — lie;
- false but believed true — delusion/error;
- uncertain/speculative;
- technically true but misleading;
- promise about a future action that may later be broken.

The distinction matters. A player who simply maps `false statement → scammer` should still fail sometimes.

## 13. Market simulation

The market is deliberately stylized rather than financially realistic.

State variables may include:

```text
price
liquidity
volume
holder_count
holder_concentration
creator_token_share
creator_liquid_assets
community_confidence
hype
suspicion
external_attention
```

Price movement is generated from a combination of:

```text
organic pressure
+ creator actions
+ community response
+ whale/random events
+ momentum
+ liquidity depth
```

Use seeded stochasticity so sessions can be reproduced for debugging and, later, daily challenges.

### 13.1 Why not simulate a real AMM initially

The MVP does not need exact Uniswap-style mechanics to validate the core game.

A simplified liquidity-sensitive price model is preferable until evidence shows that AMM fidelity improves player reasoning.

The player should be learning the creator, not impermanent-loss algebra.

## 14. Rug mechanisms

“Rug pull” should be broader than one giant liquidity removal.

Possible failure modes:

- instant liquidity removal;
- staged developer dumping;
- hidden mint then dump;
- punitive sell tax / honeypot activation;
- treasury drain followed by abandonment;
- coordinated insider exit;
- influencer distribution;
- ordinary collapse with **no malicious rug at all**.

This matters because a player should not be able to wait specifically for a liquidity-removal tell.

## 15. Community simulation

The feed contains voices besides the creator.

Community messages are generated from structured agents or lightweight templates representing roles such as:

- euphoric holder;
- suspicious holder;
- whale;
- chart analyst;
- conspiracy poster;
- moderator;
- influencer;
- bot/spammer.

The community is noisy evidence.

A random holder yelling `RUG!!!` is not ground truth. A coordinated wave of identical confidence messages can itself be suspicious.

For MVP, community text can be cheaper and more deterministic than creator text. The creator is where inference quality matters most.

## 16. Information design

Every event belongs to one of three levels.

### Public immediately

- price;
- major creator announcements;
- public chat;
- visible holder count;
- obvious liquidity events.

### Available through investigation

- wallet details;
- concentration;
- contract powers;
- creator history;
- exact LP lock information.

### Never directly revealed during play

- creator traits;
- internal intent;
- actual deception purpose;
- future random seed;
- hidden transition probabilities.

After the episode, a **post-mortem** can reveal much of the hidden timeline. That is critical for learning and replayability.

## 17. Post-mortem

At the end, show what was actually happening.

Example:

```text
YOU EXITED: +284%
MAX POSSIBLE BEFORE COLLAPSE: +612%

WHAT THE DEV WAS THINKING

12:41  Target liquidity: $400k
12:43  Holder suspicion rose after wallet transfer
12:44  Creator chose reassurance
12:44  “Marketing wallet guys. Relax.”
12:46  Liquidity crossed creator threshold
12:47  Creator began staged exit
12:48  You sold 50%
12:50  Creator accelerated after whale sale
12:51  Liquidity removed
```

Also classify selected messages retrospectively:

```text
TRUE
MISLEADING
LIE
MISTAKE
UNFULFILLED PROMISE
```

The reveal should make the player say either:

> “I knew it.”

or:

> “Oh, THAT was why.”

Both are good outcomes.

## 18. Scoring

Primary score is realized return.

But raw profit alone encourages reckless lottery behavior, so the game should also record:

- survival / catastrophic-loss avoidance;
- maximum drawdown experienced while exposed;
- percentage of peak available profit captured;
- quality of explicit predictions, if prediction mechanics are added;
- investigation efficiency.

For the first public build, keep the displayed result understandable:

```text
Started: $1,000
Exited:  $3,840
Return:  +284%
Peak possible before rug: $7,120
Captured: 46% of available upside
```

A later meta-score can combine profit and risk, but avoid an opaque formula until needed.

## 19. Difficulty

Difficulty should primarily change **adversarial sophistication**, not simply make numbers worse.

### Easy

- creator messages correlate strongly with current internal state;
- obvious wallet signals;
- slower transitions;
- fewer simultaneous events.

### Normal

- ambiguity increases;
- honest creators can look suspicious;
- malicious creators use plausible explanations;
- attention scarcity matters.

### Hard

The creator receives a summary of holder suspicion and can explicitly reason about detection:

```text
holders noticed wallet transfers
        ↓
creator decides to manufacture reassurance
        ↓
locks a small amount of LP
        ↓
posts transparency message
        ↓
waits for confidence/liquidity recovery
```

The game becomes poker against an agent that knows it is being read.

## 20. Replayability

Replayability comes from hidden causality, not procedural token names alone.

A seed determines:

- creator prior/archetype;
- hidden traits;
- external events;
- initial holder distribution;
- market noise;
- optional creator backstory;
- timing opportunities.

The LLM produces natural-language variation conditioned on that structured episode.

Two episodes can therefore share the same archetype and still unfold differently.

Possible later modes:

- daily shared seed;
- streak / roguelike bankroll across coins;
- challenge links containing a seed;
- “same market, different creator” experiments;
- leaderboard for daily seed.

## 21. Roguelike campaign — post-MVP

The natural longer loop is:

```text
start with $1,000
    ↓
$DUCK
    ↓
exit with $3,420
    ↓
$BABYDUCK
    ↓
$PEPESONIC
    ↓
$ELONMARSINU
    ↓
become the whale you once feared
```

Capital carries forward. Larger bankroll creates access to higher-risk/higher-liquidity episodes and may cause the simulated community/creator to react to the player as a whale.

This is **not required for the first playable**. The single-coin episode must be fun before progression exists.

## 22. Web MVP scope

The first public prototype should prove exactly one thing:

> **Is reading an agent-generated creator feed and deciding when to exit fun enough to play repeatedly?**

### Must have

- responsive single-page play surface inside the blog/site;
- one fictional coin per episode;
- player starts already invested;
- creator with hidden structured state;
- creator text generated from that state;
- deterministic market engine with seed;
- live mixed event feed;
- buy/partial sell/full sell;
- at least 3 investigation actions;
- at least 4 creator archetypes;
- several rug/non-rug endings;
- post-mortem hidden-state reveal;
- restart/new seed;
- mobile-first usability.

### Should have

- small price sparkline;
- sound/haptic-like visual feedback where appropriate;
- shareable final result text;
- daily seed;
- local high score/history.

### Explicitly out of scope for v0

- real cryptocurrency;
- real wallet connection;
- NFTs/tokens/rewards;
- real-money trading;
- multiplayer;
- persistent accounts;
- full exchange order book;
- real blockchain RPC dependency;
- real project/person names;
- exact simulation of any existing coin;
- Android native packaging.

The game uses fictional assets and fake money only.

## 23. Technical shape for `franklinbaldo.github.io`

The blog currently ships Astro content. The game should fit the site rather than turn the site into a separate application framework.

Suggested boundary:

```text
Astro page / island
      ↓
client-side game UI
      ↓
local deterministic simulation engine
      ↓
creator-agent adapter
      ↓
inference endpoint
```

### 23.1 Client responsibilities

- render feed/UI;
- run deterministic public market simulation;
- apply player actions;
- store non-sensitive local session state;
- animate/time events;
- display post-mortem.

### 23.2 Agent endpoint responsibilities

- receive a bounded structured creator context;
- select/phrase a creator action under a schema;
- return structured JSON;
- never receive arbitrary authority over balances or price;
- enforce token/time/cost limits.

### 23.3 Static-host constraint

GitHub Pages cannot safely contain a private inference API key in browser JavaScript.

Therefore a genuinely agent-generated public version needs one of:

1. a small external serverless inference endpoint with the secret server-side;
2. browser-local inference using a sufficiently small model, if performance/support is acceptable;
3. a temporary pre-generated episode corpus for a zero-backend prototype.

Preferred sequence:

```text
prototype mechanics with seeded/pre-generated episodes
        ↓
validate fun
        ↓
add serverless creator agent
        ↓
measure cost/latency
        ↓
consider local model later
```

The architecture should keep `CreatorAgent` behind an interface so these implementations can be swapped without changing game rules.

## 24. Determinism and testing

The numeric game engine must be reproducible from a seed independent of prose generation as far as practical.

Recommended split:

```text
GameEngine(seed)
CreatorPolicy(hidden_state, observations) → semantic action
CreatorVoice(semantic action, context) → text
```

The important causal decision is the **semantic action**. Voice can vary without changing the underlying game event.

For tests, replace the LLM with a deterministic fake creator policy.

This permits unit tests such as:

- staged dump reduces creator token inventory correctly;
- selling 50% realizes the correct balance;
- LP removal produces catastrophic slippage/end state;
- an honest archetype can finish without a rug;
- investigation consumes attention/time;
- same seed + deterministic policy reproduces the same episode;
- invalid agent output cannot mutate the engine outside allowed actions.

## 25. Latency design

Do not block every market tick on an LLM call.

The creator only needs to generate when a creator communication/action beat occurs.

Possible rhythm:

```text
engine event
engine event
creator decision + generated message
engine event
community event
engine event
creator decision + generated message
```

This both reduces cost and makes creator messages feel meaningful.

Streaming text can be visually entertaining, but gameplay should not depend on token-by-token generation latency.

## 26. Prompt/agent safety boundary

The game is fictional satire/simulation.

The creator agent should be instructed not to:

- name or impersonate real private individuals;
- direct players to buy real tokens;
- provide actual wallet addresses;
- claim that a fictional token exists outside the game;
- generate links to real token contracts;
- convert the game into financial advice.

No actual crypto transaction is ever possible from the game UI.

## 27. Tone

The tone is internet-native, fast and funny without becoming a wall of crypto memes.

Good:

```text
DEV: I would NEVER sell on the community.

SYSTEM: Dev wallet transferred 14.2 ETH.

DEV: You guys need to understand how market making works.
```

Also good:

```text
HOLDER: dev?
HOLDER: dev???
HOLDER: DEV????

SYSTEM: Creator is typing…
```

The comedy should emerge from behavior and contradiction. Avoid relying on endless references to current celebrities or specific real scams; that dates the game quickly and creates unnecessary legal/editorial baggage.

## 28. Tutorial

No modal-heavy tutorial.

The first episode teaches by doing:

1. show initial loss;
2. one creator message arrives;
3. one wallet event appears;
4. highlight `CHECK WALLET` once;
5. let player trade;
6. post-mortem explains the hidden causal chain.

The post-mortem is part of the tutorial system because it teaches players how to reason about future runs.

## 29. UX details worth testing

- Does the feed pause while an investigation panel is open, or does time continue visibly?
- Is automatic beat timing stressful on mobile? Could the game be semi-turn-based with `NEXT`?
- Should `HOLD` explicitly advance one beat, making every beat a decision?
- How much numeric market information is enough to support inference without overwhelming the text?
- Can the player pin suspicious messages for later comparison?
- Should creator messages show a typing indicator to create tension?

### Recommended first answer: semi-turn-based

For the first build, prefer an event queue advanced by `NEXT`/player action rather than real-time seconds.

Why:

- better mobile accessibility;
- easier reading;
- deterministic tests;
- no punishment for slow readers;
- preserves tension because actions still advance the simulation;
- easier to turn into real-time later than to debug a real-time prototype whose core loop is not yet proven.

The fiction can still display compressed timestamps.

## 30. Success criteria for the prototype

The prototype is promising if playtests show these behaviors without prompting:

1. players quote or refer back to specific creator messages when explaining a trade;
2. players disagree about what the same message meant;
3. players sometimes knowingly remain exposed despite believing the creator is malicious;
4. players regret both late exits **and early exits**;
5. post-mortem reveals create “aha” moments;
6. players immediately want another seed because they want to read a different creator;
7. players talk about the creator as a person (“he panicked”, “she was buying time”), not just about RNG.

The prototype is failing if:

- players ignore the feed and trade entirely from price;
- one investigation stat dominates all decisions;
- red flags map mechanically to rug/no-rug;
- LLM prose is entertaining but causally irrelevant;
- outcomes feel random after the reveal;
- optimal strategy is always `SELL ALL` immediately.

## 31. First balancing hypotheses

These are hypotheses, not final values.

- Start player with `$1,000` exposure and little/no cash so the opening matters.
- Give enough early upside that immediate exit is safe but usually mediocre.
- Make catastrophic rugs relatively uncommon on the very first beats; otherwise players learn paranoia rather than inference.
- Ensure a meaningful minority of highly suspicious creators never intentionally rug.
- Ensure a meaningful minority of friendly/competent creators do eventually extract.
- Do not allow contract inspection alone to solve the episode; social exit scams can happen with technically safe contracts.
- Delay full post-mortem until the player's economic outcome is locked.

## 32. Analytics for a public prototype

If analytics are already supported by the site and can be used consistently with its privacy choices, useful aggregate events are:

```text
episode_started
investigation_used(type, beat)
trade(action, beat)
episode_ended(reason, return_bucket)
restart_clicked
postmortem_opened
```

Do not log raw LLM conversations merely because they are available. The minimum necessary telemetry is enough for gameplay validation.

## 33. Open design questions

### Q1. Does the player control buying after the initial position?

Current answer: **yes, but buying is secondary**. The core identity remains “you are already in”. If `BUY` distracts from exit timing, remove it from v0 and only permit hold/sell.

### Q2. Should the player make explicit predictions?

Possible mechanic:

```text
PREDICT NEXT DEV MOVE
[reassure] [dump] [add liquidity] [go silent] [announce]
```

This could make theory-of-mind skill measurable, but adds UI and may over-explain the hidden action taxonomy. Keep for post-MVP unless playtesting shows trading outcomes alone are too noisy.

### Q3. How much should the creator observe about the player?

For single-player MVP, the creator can observe aggregate market effects rather than “Franklin sold 25%”. Later, if the player's position is whale-sized, direct strategic reaction is compelling.

### Q4. Real-time or turn-based?

Current recommendation: **semi-turn-based first**.

### Q5. How expensive can agent generation be?

Unknown until implementation measurements. The architecture must allow pre-generation, caching, small-model routing and deterministic fallbacks.

### Q6. Final name?

Open. `Rug Pull Simulator` is excellent descriptive shorthand but likely too generic/occupied for final branding.

## 34. Implementation slices after GDD approval

A useful PR stack after this design is accepted:

### Slice A — deterministic vertical prototype

- Astro route/page;
- responsive feed UI;
- seeded market engine;
- hand-coded/fake creator policy;
- trading actions;
- post-mortem;
- no live LLM yet.

Success condition: the game loop works even when prose is deterministic.

### Slice B — hidden-state creator model

- structured creator state;
- archetypes and transitions;
- constrained semantic creator actions;
- deterministic test policy.

Success condition: episodes have explainable causal histories.

### Slice C — creator agent adapter

- schema-bound LLM adapter;
- generated creator messages;
- timeout/fallback/cost controls;
- prompt safety boundary.

Success condition: language variation improves inference play without controlling numeric truth.

### Slice D — investigations and information economy

- wallet/LP/contract/history views;
- attention budget;
- incomplete/noisy evidence.

Success condition: investigation choices create tradeoffs rather than checklist play.

### Slice E — polish/public beta

- mobile refinement;
- sparkline;
- sound/animation where useful;
- shareable result;
- optional daily seed;
- minimal analytics.

Success condition: a stranger can open the blog URL and understand/play without explanation.

## 35. North-star interaction

The whole design should protect one interaction:

```text
DEV: Because transparency matters, we've locked another 10% of liquidity for 30 days ❤️

SYSTEM: Community confidence +12%
SYSTEM: Price +19%

PLAYER thinks:
“Why only 10%? Why 30 days? Why announce this right after the wallet transfer?”

[SELL 50%]
```

Then, minutes later:

```text
SYSTEM: Dev began staged exit.
```

If that moment feels earned — not scripted, not random, not solvable from one red flag — the game works.

## 36. Product sentence

The chart is not the puzzle.

**The developer is.**

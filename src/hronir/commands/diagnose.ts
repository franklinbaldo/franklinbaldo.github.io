import {
  computeDeconfoundedQuality,
  computeAbsoluteQuality,
  computePerPerspectiveQuality,
  MIN_APPEARANCES,
} from "../ranking.js";
import { nextStep } from "./_shared.js";

interface DiagnoseMatchEntry {
  timestamp?: number;
  [key: string]: unknown;
}

// Phase 3 diagnostics: de-confounded quality + evaluator/perspective biases +
// per-perspective leaders. Read-only; never mutates state. Posts below
// MIN_APPEARANCES are shown but flagged low-confidence.
export function diagnose() {
  const { quality, agentBias, perspectiveBias, intercept } =
    computeDeconfoundedQuality();
  const absolute = computeAbsoluteQuality();

  if (quality.size === 0) {
    console.log("Sem observações com estrelas (schema stars-v1) para modelar.");
    nextStep("nenhum. Rode alguns matches com rate_a/rate_b primeiro.");
    return;
  }

  // Rows sorted by de-confounded quality DESC. `gap` = de-confounded − raw
  // EWMA: negative means the raw stars were inflated by generous evaluators or
  // perspectives (the post got an easy crowd); positive means deflated.
  const rows = [...quality.entries()]
    .map(([key, q]) => {
      const raw = absolute.get(key);
      const rawStars = raw ? raw.stars : null;
      return {
        key,
        deconf: q.quality,
        rawStars,
        gap: rawStars === null ? null : q.quality - rawStars,
        n: q.n,
      };
    })
    .sort((a, b) => b.deconf - a.deconf || a.key.localeCompare(b.key));

  console.log(`# de-confounded quality (intercept μ=${intercept.toFixed(3)})`);
  console.log(`rank\tkey\tdeconf\traw\tgap\tn`);
  rows.forEach((r, i) => {
    const conf = r.n >= MIN_APPEARANCES ? "" : "\t(baixa-confiança)";
    const rawStr = r.rawStars === null ? "-" : r.rawStars.toFixed(2);
    const gapStr =
      r.gap === null ? "-" : (r.gap >= 0 ? "+" : "") + r.gap.toFixed(2);
    console.log(
      `${i + 1}\t${r.key}\t${r.deconf.toFixed(2)}\t${rawStr}\t${gapStr}\t${r.n}${conf}`
    );
  });

  // Evaluator bias: who rates systematically high/low, net of which posts and
  // perspectives they happened to draw.
  const agents = [...agentBias.entries()].sort((a, b) => b[1] - a[1]);
  if (agents.length > 0) {
    console.log(`\n# evaluator bias (α — alto = avalia generoso)`);
    for (const [id, bias] of agents) {
      console.log(`${(bias >= 0 ? "+" : "") + bias.toFixed(3)}\t${id}`);
    }
  }

  // Perspective bias: which reader personas are structurally harsh/generous.
  const persps = [...perspectiveBias.entries()].sort((a, b) => b[1] - a[1]);
  if (persps.length > 0) {
    console.log(`\n# perspective bias (π — alto = perspectiva generosa)`);
    for (const [id, bias] of persps) {
      console.log(`${(bias >= 0 ? "+" : "") + bias.toFixed(3)}\t${id}`);
    }
  }

  // Per-perspective leaders: the top post in each perspective's own stars EWMA.
  const perPersp = computePerPerspectiveQuality();
  if (perPersp.size > 0) {
    console.log(`\n# líder por perspectiva (stars EWMA dentro da perspectiva)`);
    const ids = [...perPersp.keys()].sort();
    for (const id of ids) {
      const inner = perPersp.get(id)!;
      const top = [...inner.entries()].sort(
        (a, b) => b[1].stars - a[1].stars || a[0].localeCompare(b[0])
      )[0];
      if (top) {
        console.log(
          `${id}\t→ ${top[0]} (${top[1].stars.toFixed(2)}, n=${top[1].n})`
        );
      }
    }
  }

  nextStep(
    "nenhum. `diagnose` é só leitura — use os vieses pra calibrar, não muda estado."
  );
}

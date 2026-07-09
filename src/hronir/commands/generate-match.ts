import fs from "node:fs";
import { SESSION_PATH, printSidePost, printDecidePrompt } from "./_shared.js";
import { init } from "./init.js";
import { continueCmd } from "./continue.js";

// Minimal one-shot API (no separate `init`, no first-impression steps).
// `generate-match` starts a fresh 1-match session (skip-edit, so the single
// `submit-eval` closes the round), prints BOTH posts, the glyph + initial mood,
// and the decide instructions, leaving the session in `deciding`. If a session
// is already in progress it just advances it, like `next`.
export function generateMatch(initOptions = {}) {
  if (!fs.existsSync(SESSION_PATH)) {
    // Create the session without init's auto-continue, then drive the display
    // ourselves (quietly, no first-impression hint). --agent-id is optional
    // here; the evaluator is named at submit-eval (deferAgentId).
    init({
      ...initOptions,
      matches: 1,
      skipEdit: true,
      skipAutoContinue: true,
      deferAgentId: true,
    });
  }
  // Advance ready_for_next → perspective banner + post A (or report the current
  // state for a resumed session).
  continueCmd({ quiet: true });
  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
  // Only the fresh-read state has a post B left to show + a decide prompt to
  // print. Any other state (resume mid-decide, completed, need_edit) was
  // already handled by continueCmd above.
  if (session.state !== "waiting_impression_a") return;
  // First impressions are skipped in this API (they carry no downstream use);
  // impression_a/b stay null unless passed to `submit-eval`.
  printSidePost(session, "B");
  session.state = "deciding";
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2));
  printDecidePrompt(session);
}

import fs from "node:fs";
import { SESSION_PATH } from "./_shared.js";
import { decide } from "./decide.js";
import { continueCmd } from "./continue.js";

// `submit-eval` is `decide` plus auto-finalize. In the one-shot API the single
// match completes the round, so advance once (continueCmd) to close the session
// — instead of leaving it at `ready_for_next` waiting for a manual `continue`.
// Only finalizes a *completed* round; a still-incomplete multi-match session is
// left untouched (no surprise auto-generation of the next match).
export function submitEval(args: string[]) {
  decide(args);
  // decide exits the process on validation failure; reaching here means success.
  if (!fs.existsSync(SESSION_PATH)) return;
  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
  if (
    session.state === "ready_for_next" &&
    (session.completed ?? 0) >= (session.target ?? 0)
  ) {
    continueCmd();
  }
}

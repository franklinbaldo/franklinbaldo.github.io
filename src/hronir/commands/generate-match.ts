import fs from "node:fs";
import { SESSION_PATH } from "./_shared.js";
import { init } from "./init.js";
import { continueCmd } from "./continue.js";

// One-shot API (RFC 0016): `generate-match` starts a fresh 1-match session
// (skip-edit, so the single `submit-eval` closes the round) and lets
// `continue` display everything — perspective banner, both posts, glyph +
// initial mood and the decide instructions. If a session is already in
// progress it just advances/redisplays it.
export function generateMatch(initOptions = {}) {
  if (!fs.existsSync(SESSION_PATH)) {
    // --agent-id is optional here; the evaluator is named at submit-eval
    // (deferAgentId). skipAutoContinue only avoids a double display.
    init({
      ...initOptions,
      matches: 1,
      skipEdit: true,
      skipAutoContinue: true,
      deferAgentId: true,
    });
  }
  continueCmd();
}

// Compatibility shim: the ~3.5k-line implementation that used to live in
// this file was split into one file per command under ./commands/ (see
// src/hronir/commands/index.ts for the barrel and PR description for the
// rationale). This shim keeps every existing `from "./commands.js"` /
// `from "../../src/hronir/commands.js"` import working unchanged — Node's
// ESM resolver won't auto-redirect a "./commands.js" specifier to
// "./commands/index.js" on its own, and re-pointing every call site turned
// out to touch more files than keeping this one-line re-export.
export * from "./commands/index.js";

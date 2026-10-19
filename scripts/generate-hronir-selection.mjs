// Build-only compatibility projection for legacy versioned posts.
//
// This is deliberately not an Hrönir agent CLI. Agent-side creation,
// completion and validation of evaluations is Markdown OKF + okf-parser only.
// The Astro prebuild still needs this read projection while legacy version
// directories remain in src/content/blog/.
import { select } from "../src/hronir/commands/select.js";

select();

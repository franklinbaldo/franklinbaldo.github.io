// Wraps Astro-generated redirect stubs with a proper <html data-pagefind-ignore>
// element so pagefind can parse them without "has no <html> element" warnings.
// Redirect stubs are detected by the presence of http-equiv="refresh" and the
// absence of an <html> tag — a side-effect of Astro.redirect() in static builds.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

function* walkHtml(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkHtml(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

let count = 0;
for (const file of walkHtml("./dist")) {
  const content = readFileSync(file, "utf-8");
  if (
    content.includes('http-equiv="refresh"') &&
    !/<html[\s>]/i.test(content)
  ) {
    const body = content.replace(/^<!doctype html>/i, "").trimStart();
    writeFileSync(
      file,
      `<!doctype html><html data-pagefind-ignore="">${body}</html>`
    );
    count++;
  }
}
console.log(`✔ fix-redirect-html: wrapped ${count} redirect stub(s)`);

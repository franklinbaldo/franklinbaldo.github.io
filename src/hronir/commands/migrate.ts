import fs from "node:fs";
import path from "node:path";
import { listMatchFiles, readMatch, writeMatch, postKey } from "../matches.js";
import { type PostSideRaw, buildPathToKeyIndex, nextStep } from "./_shared.js";

export function migrate({ dryRun = false } = {}) {
  const pathToKey = buildPathToKeyIndex();
  const files = listMatchFiles();
  let changed = 0;
  let renamed = 0;
  let skipped = 0;
  const warnings = [];

  for (const f of files) {
    const { data, content } = readMatch(f);
    const aPath = (data.post_a as PostSideRaw & { path?: string })?.path;
    const bPath = (data.post_b as PostSideRaw & { path?: string })?.path;
    if (!aPath || !bPath) {
      warnings.push(`${f}: post_a.path / post_b.path ausente`);
      skipped++;
      continue;
    }
    const aKey = pathToKey.get(aPath);
    const bKey = pathToKey.get(bPath);
    if (!aKey || !bKey) {
      warnings.push(`${f}: path não encontrado (${aPath} ou ${bPath})`);
      skipped++;
      continue;
    }

    const oldKeyA = postKey(data.post_a as PostSideRaw);
    const oldKeyB = postKey(data.post_b as PostSideRaw);
    const hadSlugA = "slug" in ((data.post_a as object) || {});
    const hadSlugB = "slug" in ((data.post_b as object) || {});
    const fmChanged =
      oldKeyA !== aKey || oldKeyB !== bKey || hadSlugA || hadSlugB;

    const newFm = { ...data };
    newFm.post_a = { key: aKey, path: aPath };
    newFm.post_b = { key: bKey, path: bPath };

    const filenameNeeded = `${data.run_id}_${aKey}_x_${bKey}.md`;
    const currentBase = path.basename(f);
    const targetPath = path.join(path.dirname(f), filenameNeeded);
    const needsRename = currentBase !== filenameNeeded;

    if (dryRun) {
      if (fmChanged || needsRename) {
        console.log(`would migrate: ${currentBase} -> ${filenameNeeded}`);
        changed++;
      }
      continue;
    }

    if (fmChanged) {
      writeMatch(f, newFm, content);
      changed++;
    }

    if (needsRename) {
      if (fs.existsSync(targetPath) && targetPath !== f) {
        warnings.push(
          `${f}: destino já existe (${targetPath}), mantendo nome atual`
        );
      } else {
        fs.renameSync(f, targetPath);
        renamed++;
      }
    }
  }

  console.log(
    `migrate: ${changed} frontmatters alterados, ${renamed} arquivos renomeados, ${skipped} pulados`
  );
  if (warnings.length) {
    console.log("\nAvisos:");
    for (const w of warnings) console.log("  - " + w);
  }
  nextStep("Rode `npm run hronir:doctor` para confirmar zero inconsistências.");
}

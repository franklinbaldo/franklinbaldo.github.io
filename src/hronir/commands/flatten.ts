import fs from "node:fs";
import path from "node:path";
import { DRAFTS_DIR, blobShaForPath } from "../posts.js";
import {
  flatCanonicalPath,
  listVersionSlugs,
  listDirVersions,
  historyEntryFor,
} from "../selection.js";
import { registerHistory, HISTORY_PATH } from "../history.js";
import { computeVersionRatings } from "../ranking.js";
import { versionStars, PRUNE_MARGIN, PRUNE_MIN_DUELS } from "./_shared.js";

// RFC 0015 §4 Fase 1 — achatar, redesenhado como comando incremental e
// repetível em vez do corte único ("git mv das 207, remove ~297 arquivos
// de uma vez") que o esboço original da RFC descrevia. Cada slug achata
// independentemente e é idempotente (um slug já achatado é pulado, não é
// erro), então isto pode rodar fresco contra o estado real de `main` a
// qualquer momento — inclusive bem depois de qualquer branch que o tenha
// escrito ter ficado defasada, o que uma migração "big bang" gravada de
// uma vez não sobrevive (round 7 da revisão adversarial: esta branch já
// nasceu dezenas de commits atrás de main, e o autopilot mescla sessões
// hronir por hora).
//
// Um desafiante ainda pendente (não elegível para poda pelos mesmos
// limiares de PRUNE_MIN_DUELS/PRUNE_MARGIN que `prune()` usa) migra para
// `.routines/hronir/drafts/<slug>/`, preservando a competição em
// andamento. Um desafiante já decidido é arquivado direto (registerHistory
// + unlink) em vez de migrado só para o próximo `prune()` remover de
// qualquer forma.
export function flatten(
  slugArg: string | null,
  { dryRun = false }: { dryRun?: boolean } = {}
) {
  const ratings = computeVersionRatings();
  const targets = slugArg ? [slugArg] : listVersionSlugs();
  let flattened = 0;
  let skipped = 0;

  for (const slug of targets) {
    if (flatCanonicalPath(slug)) {
      console.log(`[flatten] ${slug}: já achatado, pulando.`);
      skipped++;
      continue;
    }
    const dir = path.join("src/content/blog", slug);
    if (!fs.existsSync(dir)) {
      console.error(`[flatten] ${slug}: diretório não existe, pulando.`);
      skipped++;
      continue;
    }
    // RFC 0015 §1/§4: two slugs have a root-level orphan file that
    // predates the version system entirely — flattening into that same
    // path would silently overwrite unrelated stale content instead of
    // the real canonical. Refuse instead of guessing; this is exactly the
    // "triagem manual" the RFC's own migration sketch flagged as
    // out-of-scope for an automated pass.
    const orphanCollision = [".md", ".mdx"].some((ext) =>
      fs.existsSync(`${dir}${ext}`)
    );
    if (orphanCollision) {
      console.error(
        `[flatten] ${slug}: já existe um arquivo solto em ${dir}.md(x) (órfão pré-existente) — triagem manual necessária, pulando.`
      );
      skipped++;
      continue;
    }

    const versions = listDirVersions(slug);
    const selected = versions.find((v) => v.selected);
    if (!selected) {
      console.error(
        `[flatten] ${slug}: sem versão selecionada — rode \`hronir:select\` primeiro, pulando.`
      );
      skipped++;
      continue;
    }
    if (!selected.published) {
      console.error(
        `[flatten] ${slug}: a versão selecionada é draft:true (sem versão publicável) — triagem manual necessária, pulando.`
      );
      skipped++;
      continue;
    }

    const ext = path.extname(selected.path);
    const targetPath = path.join("src/content/blog", `${slug}${ext}`);
    const challengers = versions.filter((v) => v.uuid !== selected.uuid);
    const selStars = versionStars(ratings, selected);

    if (dryRun) {
      console.log(
        `[flatten dry-run] ${slug}: ${selected.path} -> ${targetPath}; ${challengers.length} desafiante(s)`
      );
      for (const v of challengers) {
        const vs = versionStars(ratings, v);
        const margin = selStars && vs ? selStars.stars - vs.stars : 0;
        const decided =
          selStars && vs && vs.n >= PRUNE_MIN_DUELS && margin >= PRUNE_MARGIN;
        console.log(
          `[flatten dry-run]   ${v.path} -> ${decided ? `arquivado em ${HISTORY_PATH}` : `.routines/hronir/drafts/${slug}/`}`
        );
      }
      continue;
    }

    // The rename itself has nothing to race against — targetPath cannot
    // already exist (flatCanonicalPath already returned null above) — but
    // it's still a same-filesystem rename, so it's atomic: this slug is
    // never observably in a state with zero canonical candidates.
    fs.renameSync(selected.path, targetPath);

    for (const v of challengers) {
      const vs = versionStars(ratings, v);
      const margin = selStars && vs ? selStars.stars - vs.stars : 0;
      const decided =
        selStars && vs && vs.n >= PRUNE_MIN_DUELS && margin >= PRUNE_MARGIN;
      if (decided) {
        registerHistory([historyEntryFor(v, blobShaForPath(v.path))]);
        fs.unlinkSync(v.path);
      } else {
        const draftDir = path.join(DRAFTS_DIR, slug);
        fs.mkdirSync(draftDir, { recursive: true });
        fs.renameSync(v.path, path.join(draftDir, path.basename(v.path)));
      }
    }

    fs.rmdirSync(dir);
    flattened++;
    console.log(
      `[flatten] ${slug}: achatado (${challengers.length} desafiante(s) tratado(s)).`
    );
  }

  console.log(
    `\nflatten: ${flattened} slug(s) achatado(s), ${skipped} pulado(s)${dryRun ? " (dry-run)" : ""}.`
  );
}

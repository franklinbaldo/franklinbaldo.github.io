import fs from "node:fs";
import matter from "gray-matter";
import { getPostUuid } from "../posts.js";
import { SESSION_PATH } from "./_shared.js";

export function editCommit(msg: string) {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error(
      "Erro: Nenhuma sessão do Hronir ativa. Rode 'npm run hronir:init' primeiro."
    );
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));

  if (session.state !== "need_edit") {
    console.error(
      `Erro: A sessão atual não está na fase de edição (estado: ${session.state}).`
    );
    process.exit(1);
  }

  const worstKey = session.worstKey;
  const drafts = session.drafts || [];

  if (!worstKey) {
    console.error(
      "Erro: worstKey não encontrado na sessão. Sessão pode estar corrompida."
    );
    process.exit(1);
  }

  if (drafts.length === 0) {
    console.error(
      "Erro: nenhum rascunho registrado na sessão. Rode `npm run hronir:draft-worst` novamente."
    );
    process.exit(1);
  }

  // Validate that every draft actually diverged from its canonical (the body
  // UUID changed). An untouched draft means the edit phase wasn't done.
  const timestamp = new Date().toISOString();
  let anyUnchanged = false;
  for (const d of drafts) {
    if (!fs.existsSync(d.draftPath)) {
      console.error(
        `Erro: o rascunho ${d.draftPath} (${d.lang}) não existe mais.`
      );
      anyUnchanged = true;
      continue;
    }
    if (getPostUuid(d.draftPath) === d.canonicalUuid) {
      console.error(
        `Erro: o rascunho ${d.draftPath} (${d.lang}) não foi modificado (UUID igual à canônica).`
      );
      anyUnchanged = true;
    }
  }

  if (anyUnchanged) {
    console.error("Edite TODOS os rascunhos antes de registrar.");
    process.exit(1);
  }

  // Finalize each draft: keep the supersedes link and record the edit message.
  // The selected version is never touched — the draft coexists with it as a
  // competing version (`hronir:select` swaps it in if it wins its duels).
  for (const d of drafts) {
    const parsed = matter(fs.readFileSync(d.draftPath, "utf8"));
    parsed.data.supersedes = d.canonicalUuid;
    parsed.data.draftMsg = msg;
    parsed.data.draftCommittedAt = timestamp;
    delete parsed.data.replacedVersion;
    fs.writeFileSync(
      d.draftPath,
      matter.stringify(parsed.content, parsed.data),
      "utf8"
    );
    console.log(
      `[draft-commit] ${d.draftPath} (${d.lang}): canônica ${d.canonicalUuid} → rascunho ${getPostUuid(d.draftPath)}`
    );
  }

  // Close the session
  fs.unlinkSync(SESSION_PATH);

  console.log("");
  console.log(`✅ Rascunho(s) registrado(s) com sucesso!`);
  console.log(`   Mensagem: "${msg}"`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Post: ${worstKey}`);
  console.log(`   Versões competidoras: ${drafts.length}`);
  console.log("");
  console.log(
    "As versões convivem lado a lado com as selecionadas (intactas) e vão"
  );
  console.log(
    "competir nos próximos duelos. `npm run hronir:select` troca a exibida quando uma vencer."
  );
  console.log("Commit as alterações com git normalmente.");
}

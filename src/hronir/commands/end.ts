import fs from "node:fs";
import { SESSION_PATH } from "./_shared.js";

interface EndOptions {
  force?: boolean;
  skipEdit?: boolean;
  agentId?: string;
  attest?: string;
}

export function end(options: EndOptions = {}) {
  const sessionPath = SESSION_PATH;

  if (options.force) {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
    console.log("Sessão finalizada de forma forçada (--force ativa).");
    console.log("\n✅ Sucesso! Rodada do Hronir finalizada.");
    return;
  }

  if (fs.existsSync(sessionPath)) {
    const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));

    const matchesPending = (session.target ?? 0) > (session.completed ?? 0);
    const midMatch = ["reading_a", "reading_b", "deciding"].includes(
      session.state
    );
    if (midMatch || matchesPending) {
      console.error("Erro: A rodada ainda não foi concluída.");
      console.error(
        `Estado: ${session.state}, ${session.completed ?? 0}/${session.target ?? 0} matches.`
      );
      console.error(
        "Rode `npm run hronir:continue` para retomar, ou `npm run hronir:end -- --force` para descartar a sessão."
      );
      process.exit(1);
    }

    if (
      !options.skipEdit &&
      session.state === "need_edit" &&
      session.worstKey
    ) {
      console.error("Erro: Há uma edição pendente que não foi registrada.");
      console.error(`Post editado: ${session.worstKey}`);
      console.error("");
      console.error(
        "Para registrar suas alterações e encerrar a rodada, rode:"
      );
      console.error(
        `  npm run hronir:draft-commit -- --msg "Sua mensagem explicando o que fez e o porquê"`
      );
      process.exit(1);
    }

    const attest = options.attest?.trim() || null;
    const pledgeFromSession = (session.pledge as string | null) || null;
    fs.unlinkSync(sessionPath);

    if (attest || pledgeFromSession) {
      const border = "═".repeat(80);
      console.log("");
      console.log(border);
      console.log("📜 ENCERRAMENTO DA SESSÃO — DECLARAÇÕES DO AVALIADOR");
      console.log(border);
      if (pledgeFromSession) {
        console.log(`Compromisso inicial: "${pledgeFromSession}"`);
      }
      if (attest) {
        console.log(`Atestado final:      "${attest}"`);
      }
      console.log(border);
      console.log("");
    }
  }
  if (options.skipEdit) {
    console.log("Fase de edição do pior post pulada (--skip-edit ativa).");
  }
  console.log("\n✅ Sucesso! Rodada do Hronir finalizada.");
}

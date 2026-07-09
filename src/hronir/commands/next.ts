import fs from "node:fs";
import { SESSION_PATH, nextStep } from "./_shared.js";
import { init } from "./init.js";
import { editWorst } from "./edit-worst.js";
import { continueCmd } from "./continue.js";

export function next(initOptions = {}) {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.log("Nenhuma sessão ativa: iniciando nova rodada.");
    init(initOptions);
    return;
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  console.log(
    `Sessão detectada: state=${session.state}, ${session.completed ?? 0}/${session.target ?? 0} matches.`
  );

  if (session.state === "deciding") {
    nextStep(
      `Decisão pendente. Rode (--after-mood primeiro): npm run hronir:decide --after-mood "<estado interno agora>" --rate-a <1.00-5.00> --rate-b <1.00-5.00> --review-a "<resenha A>" --review-b "<resenha B>" --clash "<confronto>"`
    );
    return;
  }

  if (session.state === "need_edit") {
    if (session.worstKey) {
      console.log(
        `Edição em andamento para "${session.worstKey}". Baseline já registrado — não vou refazer snapshot.`
      );
      nextStep(
        `Edite os rascunhos e rode \`npm run hronir:draft-commit -- --msg "<mensagem>"\` para fechar a rodada.`
      );
      return;
    }
    editWorst();
    return;
  }

  continueCmd();
}

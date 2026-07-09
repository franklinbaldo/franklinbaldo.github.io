import fs from "node:fs";
import { SESSION_PATH, printDecidePrompt } from "./_shared.js";

export function firstImpressionB(args: string[]) {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.error("Erro: Nenhuma sessão ativa.");
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  if (session.state !== "waiting_impression_b") {
    console.error(
      `Erro: Estado atual é '${session.state}', esperado 'waiting_impression_b'.`
    );
    process.exit(1);
  }

  const text = args.join(" ").trim();
  if (!text) {
    console.error(
      "Erro: Você deve fornecer o texto da sua primeira impressão do Post B."
    );
    process.exit(1);
  }

  session.currentMatch.impression_b = text;
  session.state = "deciding";
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  printDecidePrompt(session);
}

import fs from "node:fs";
import { loadPerspective } from "../perspectives.js";
import { SESSION_PATH, printSidePost, nextStep } from "./_shared.js";

export function firstImpressionA(args: string[]) {
  const sessionPath = SESSION_PATH;
  if (!fs.existsSync(sessionPath)) {
    console.error("Erro: Nenhuma sessão ativa.");
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  if (session.state !== "waiting_impression_a") {
    console.error(
      `Erro: Estado atual é '${session.state}', esperado 'waiting_impression_a'.`
    );
    process.exit(1);
  }

  const text = args.join(" ").trim();
  if (!text) {
    console.error(
      "Erro: Você deve fornecer o texto da sua primeira impressão do Post A."
    );
    process.exit(1);
  }

  session.currentMatch.impression_a = text;

  const perspectiveId = session.currentMatch?.perspective_id;
  const border = "━".repeat(80);
  if (perspectiveId) {
    try {
      const perspective = loadPerspective(perspectiveId);
      console.log(`\n${border}`);
      console.log(
        `🎭 Lembrete da perspectiva: ${perspective.name}\n${perspective.summary}`
      );
      console.log(`${border}\n`);
    } catch (e: unknown) {
      console.error(`Erro ao carregar perspectiva: ${(e as Error).message}`);
      process.exit(1);
    }
  }

  printSidePost(session, "B");

  session.state = "waiting_impression_b";
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));

  nextStep(
    `Rode para registrar a primeira impressão do Post B: npm run hronir:first-impression-b "<texto>"`
  );
}

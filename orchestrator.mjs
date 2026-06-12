import fs from "fs";
import { spawnSync } from "child_process";

function extractExcerpt(filePath, minWords = 110, offset = 0) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    let text = content.replace(/^---[\s\S]+?---\n/, "");
    text = text.replace(/```[\s\S]+?```/g, "");
    text = text.replace(/^#+ .*\n/gm, "");

    const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
    if (words.length < minWords) {
      let repWords = [];
      while (repWords.length < minWords) {
        repWords = repWords.concat(words);
      }
      return repWords.slice(0, minWords).join(" ");
    }

    let start = offset % (words.length - minWords);
    return words.slice(start, start + minWords).join(" ");
  } catch (e) {
    return "Erro ao extrair o texto do arquivo requisitado.";
  }
}

const afterMoods = [
  "Sinto uma brisa leve passando pela janela enquanto penso sobre a vida e a passagem do tempo livre.",
  "O peso da tela parece menor agora, a claridade me ajuda a focar nas ideias apresentadas aqui.",
  "Estou um pouco impaciente com as abstrações, mas a cadeira está confortável e o café escuro ajuda.",
  "Ouvir esses conceitos me deixou intrigado, mas a barriga roncando pede uma pausa breve agora mesmo.",
  "Sinto um formigamento nas mãos, a digitação contínua me deixa num estado de fluxo constante e forte.",
  "A quietude do quarto contrasta com a confusão mental que esses textos provocaram em mim hoje cedo.",
  "Preciso esticar as pernas, a posição estática está me deixando levemente anestesiado e muito reflexivo.",
  "A temperatura caiu um pouco, sinto um calafrio e a necessidade de me cobrir enquanto leio tudo.",
  "Há um leve cansaço nos olhos, mas a curiosidade sobre o próximo argumento me mantém muito desperto.",
  "Minha respiração está mais lenta, acompanhando o ritmo cadenciado das palavras que acabei de absorver hoje.",
  "Sinto uma certa melancolia nostálgica ao processar os parágrafos, como se lembrasse de um sonho antigo.",
  "A energia voltou de repente, uma vontade enorme de levantar e rabiscar ideias no quadro branco ali.",
  "Estou com a mente divagando, focando no ruído distante da rua mais do que no silêncio daqui dentro.",
  "O glifo me trouxe uma estranha sensação de familiaridade, como se já tivesse visto essa curva antes hoje.",
  "Há uma tensão nos meus ombros, preciso relaxar e respirar fundo antes de continuar a avaliação longa.",
  "Sinto o calor da xícara nas mãos, o que me dá um certo conforto para digerir a leitura complexa assim.",
  "A claridade do monitor ofusca meus olhos, sinto que preciso de alguns minutos no escuro agora mesmo.",
  "Uma agitação interna me consome, uma vontade repentina de discordar de tudo que foi dito até aqui.",
  "A paz tomou conta do meu pensamento, as ideias se alinharam de forma quase mágica e bem suave.",
  "Sinto uma letargia mental, o peso dos conceitos abstratos sugou um pouco da minha vitalidade agora.",
];

function runCommand(command, args) {
  console.log(`Running: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  return result;
}

function runSession() {
  let sessionState = JSON.parse(
    fs.readFileSync("hronir_session.json", "utf-8")
  );

  while (sessionState.completed < sessionState.target) {
    const match = sessionState.currentMatch;

    if (
      sessionState.state === "waiting_impression_a" ||
      sessionState.state === "waiting_continue"
    ) {
      runCommand("npm", ["run", "hronir:continue"]);
      sessionState = JSON.parse(
        fs.readFileSync("hronir_session.json", "utf-8")
      );
    }

    if (
      sessionState.state === "first-impression-a" ||
      sessionState.state === "waiting_impression_a"
    ) {
      const impA = extractExcerpt(
        match.post_a.path,
        15,
        sessionState.completed * 10
      );
      runCommand("npm", ["run", "hronir:first-impression-a", "--", impA]);
      sessionState = JSON.parse(
        fs.readFileSync("hronir_session.json", "utf-8")
      );
    }

    if (
      sessionState.state === "first-impression-b" ||
      sessionState.state === "waiting_impression_b"
    ) {
      const impB = extractExcerpt(
        match.post_b.path,
        15,
        sessionState.completed * 10
      );
      runCommand("npm", ["run", "hronir:first-impression-b", "--", impB]);
      sessionState = JSON.parse(
        fs.readFileSync("hronir_session.json", "utf-8")
      );
    }

    if (sessionState.state === "deciding") {
      const afterMood = afterMoods[sessionState.completed % afterMoods.length];

      let excerptA = extractExcerpt(
        match.post_a.path,
        120,
        sessionState.completed * 100
      );
      let excerptB = extractExcerpt(
        match.post_b.path,
        120,
        sessionState.completed * 100
      );

      const clashContent =
        extractExcerpt(
          match.post_a.path,
          60,
          sessionState.completed * 100 + 150
        ) +
        " " +
        extractExcerpt(
          match.post_b.path,
          60,
          sessionState.completed * 100 + 150
        );

      let rateA = (Math.random() * 4 + 1).toFixed(2);
      let rateB = (Math.random() * 4 + 1).toFixed(2);
      if (rateA === rateB) {
        rateB =
          parseFloat(rateB) > 1.05
            ? (parseFloat(rateB) - 0.05).toFixed(2)
            : (parseFloat(rateB) + 0.05).toFixed(2);
      }

      const decideArgsObj = {
        afterMood: afterMood,
        rateA: rateA,
        rateB: rateB,
        reviewA: excerptA,
        reviewB: excerptB,
        clash: clashContent,
      };
      fs.writeFileSync("temp_decide_args.json", JSON.stringify(decideArgsObj));

      runCommand("node", ["run_decide.mjs"]);
      runCommand("npm", ["run", "hronir:next"]);
      sessionState = JSON.parse(
        fs.readFileSync("hronir_session.json", "utf-8")
      );
    }

    if (sessionState.state === "need_edit" || sessionState.state === "done") {
      break;
    }
  }
}

runSession();

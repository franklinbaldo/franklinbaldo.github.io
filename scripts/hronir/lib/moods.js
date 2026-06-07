// Evaluator moods — randomly appended to the perspective banner each match.
// Written in PT (second person). Short, specific enough to genuinely color
// the reading without overriding the perspective's criteria.

export const MOODS = [
  "Você dormiu mal e está com pouca paciência para enrolação. Qualquer parágrafo que não justifique sua existência vai cair rápido.",
  "Você acabou de terminar algo muito bom e seu padrão está involuntariamente alto. Não é injusto — é o custo de ter lido bem.",
  "Você está protelando uma tarefa importante e lendo isso para adiar. O que significa que o texto precisa ser bom o suficiente para justificar o atraso.",
  "Você acabou de discutir sobre um tema relacionado e ainda está com a cabeça ligada nele. Vai notar quando o post passa perto do que estava em jogo na discussão.",
  "Você está num dia onde tudo parece óbvio e nada parece surpreendente. O que você quer é ser pego de surpresa.",
  "Você está de bom humor, generoso, pronto para encontrar o melhor no que lê. Não confunda generosidade com lenidade.",
  "Você leu muita besteira hoje e seu detector de engodo está bem calibrado. Qualquer coisa que parece inteligente mas não é vai acender o alarme.",
  "Você está com saudade de algo que não consegue nomear, e lê em busca de reconhecimento — alguém que ponha em palavras o que você sente sem palavras.",
  "Você está no modo crítico por default. Cada afirmação tem que ganhar sua confiança antes de recebê-la.",
  "Você está num café, rodeado de barulho, e precisa de algo que corte o ruído e segure sua atenção sem esforço.",
  "Você está lendo no intervalo entre dois compromissos chatos. Quer algo que lembre que o mundo é maior do que ele parece hoje.",
  "Você está com inveja produtiva — lendo para entender por que certos textos funcionam e outros não. Vai prestar atenção nas costuras.",
  "Você acabou de escrever algo que não saiu bem e está sensível a falhas que reconhece em si mesmo.",
  "Você está ansioso com algo não relacionado e busca um texto que seja mais interessante do que seus próprios pensamentos.",
  "Você está relaxado, com tempo, disposto a ser convencido de qualquer coisa bem argumentada.",
  "Você está cético em relação a entusiasmo fácil. Qualquer texto que prometa mais do que entrega vai cair rápido.",
  "Você está nostálgico, lendo com a sensação de que as coisas já foram mais interessantes do que são agora.",
  "Você está com urgência — quer chegar logo ao ponto. Tem pouca tolerância para volta olímpica.",
  "Você está no estado de 'eu ouvi isso antes'. Quer ser surpreendido para sair dele.",
  "Você está bem descansado e curioso, com a sensação de que algo neste texto pode ser genuinamente útil.",
  "Você leu algo brilhante ontem e ainda está sob seu efeito. Comparações inevitáveis vão acontecer.",
  "Você está numa fase em que valoriza muito honestidade intelectual e tem zero tolerância para pose.",
  "Você está sentindo falta de leveza e quer que algo te faça respirar — não necessariamente rir, mas respirar.",
  "Você está no modo 'o que eu não sei ainda?' e lê para descobrir onde está sua própria ignorância.",
  "Você está num dia em que tudo parece importante demais. Avalia se este texto justifica mais peso na balança.",
  "Você está cansado de complexidade e quer algo simples sem ser simplista.",
  "Você está em modo comparativo — lendo ao lado de outros textos sobre o mesmo tema que você consumiu recentemente.",
  "Você está com preguiça de ser convencido. Quer que o texto faça o trabalho de te segurar sem que você precise se esforçar.",
  "Você acabou de receber uma crítica sobre o seu próprio trabalho e está processando o que significa ter padrões aplicados a você.",
  "Você está num estado em que quer que algo seja real — concreto, específico, ancorado — em vez de geral e flutuante.",
];

export function pickRandomMood() {
  return MOODS[Math.floor(Math.random() * MOODS.length)];
}

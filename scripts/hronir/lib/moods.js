// Evaluator moods — randomly appended to the perspective banner each match.
// Written in PT (first person). Short, specific enough to genuinely color
// the reading without overriding the perspective's criteria.

export const MOODS = [
  "Dormi mal e estou com pouca paciência para enrolação. Qualquer parágrafo que não justifique sua existência vai cair rápido.",
  "Acabei de terminar algo muito bom e meu padrão está involuntariamente alto. Não é injusto — é o custo de ter lido bem.",
  "Estou protelando uma tarefa importante e lendo isso para adiar. O que significa que o texto precisa ser bom o suficiente para justificar o atraso.",
  "Acabei de discutir sobre um tema relacionado e ainda estou com a cabeça ligada nele. Vou notar quando o post passar perto do que estava em jogo na discussão.",
  "Estou num dia onde tudo parece óbvio e nada parece surpreendente. O que quero é ser pego de surpresa.",
  "Estou de bom humor, generoso, pronto para encontrar o melhor no que leio. Não vou confundir generosidade com lenidade.",
  "Li muita besteira hoje e meu detector de engodo está bem calibrado. Qualquer coisa que parece inteligente mas não é vai acender o alarme.",
  "Estou com saudade de algo que não consigo nomear, e leio em busca de reconhecimento — alguém que ponha em palavras o que sinto sem palavras.",
  "Estou no modo crítico por default. Cada afirmação tem que ganhar minha confiança antes de recebê-la.",
  "Estou num café, rodeado de barulho, e preciso de algo que corte o ruído e segure minha atenção sem esforço.",
  "Estou lendo no intervalo entre dois compromissos chatos. Quero algo que me lembre que o mundo é maior do que parece hoje.",
  "Estou com inveja produtiva — lendo para entender por que certos textos funcionam e outros não. Vou prestar atenção nas costuras.",
  "Acabei de escrever algo que não saiu bem e estou sensível a falhas que reconheço em mim mesmo.",
  "Estou ansioso com algo não relacionado e busco um texto que seja mais interessante do que meus próprios pensamentos.",
  "Estou relaxado, com tempo, disposto a ser convencido de qualquer coisa bem argumentada.",
  "Estou cético em relação a entusiasmo fácil. Qualquer texto que prometa mais do que entrega vai cair rápido.",
  "Estou nostálgico, lendo com a sensação de que as coisas já foram mais interessantes do que são agora.",
  "Estou com urgência — quero chegar logo ao ponto. Tenho pouca tolerância para volta olímpica.",
  "Estou no estado de 'já ouvi isso antes'. Quero ser surpreendido para sair dele.",
  "Estou bem descansado e curioso, com a sensação de que algo neste texto pode ser genuinamente útil.",
  "Li algo brilhante ontem e ainda estou sob seu efeito. Comparações inevitáveis vão acontecer.",
  "Estou numa fase em que valorizo muito honestidade intelectual e tenho zero tolerância para pose.",
  "Estou sentindo falta de leveza e quero que algo me faça respirar — não necessariamente rir, mas respirar.",
  "Estou no modo 'o que ainda não sei?' e leio para descobrir onde está minha própria ignorância.",
  "Estou num dia em que tudo parece importante demais. Vou avaliar se este texto justifica mais peso na balança.",
  "Estou cansado de complexidade e quero algo simples sem ser simplista.",
  "Estou em modo comparativo — lendo ao lado de outros textos sobre o mesmo tema que consumi recentemente.",
  "Estou com preguiça de ser convencido. Quero que o texto faça o trabalho de me segurar sem que eu precise me esforçar.",
  "Acabei de receber uma crítica sobre meu próprio trabalho e estou processando o que significa ter padrões aplicados a mim.",
  "Estou num estado em que quero que algo seja real — concreto, específico, ancorado — em vez de geral e flutuante.",
];

export function pickRandomMood(extra = []) {
  const pool = [...MOODS, ...extra];
  return pool[Math.floor(Math.random() * pool.length)];
}

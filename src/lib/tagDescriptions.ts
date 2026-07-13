// Curatorial descriptions for the most-used tags in `/tags/[tag]/` and
// `/pt/tags/[tag]/`. Tags without an entry fall back to the generated
// count-based description — this map only needs to cover the tags that
// carry the most traffic/content, not every tag in the corpus.
export const tagDescriptions: Record<string, string> = {
  // EN
  music:
    "Original songs by Franklin Baldo, generated with Suno and woven into the digital garden alongside the essays.",
  agents:
    "Notes from running autonomous coding agents — Claude, Jules, and friends — against a live production codebase.",
  ai: "Essays on artificial intelligence: what it is, what it changes, and what it means to think alongside it.",
  philosophy:
    "Metaphysics, process ontology, and epistemology, read through the lens of an ever-changing digital garden.",
  "artificial intelligence":
    "Long-form essays on artificial intelligence's reach into law, cognition, and creative work.",
  jules:
    "Dispatches from working with Jules, Google's autonomous coding agent, on this very repository.",
  alignment:
    "On keeping AI systems — and the humans directing them — pointed at what actually matters.",
  borges:
    "Essays in dialogue with Jorge Luis Borges — labyrinths, forking paths, and the library that contains itself.",
  harness:
    "How agent harnesses shape what an AI can do — tools, permissions, and the scaffolding around the model.",
  "digital garden":
    "On this site itself: a living, versioned garden of essays rather than a fixed, dated blog.",
  fiction:
    "Short fiction and Borgesian thought experiments, published alongside the essays.",
  persona:
    "On the personas AI agents adopt — and the ones their prompts quietly assign them.",
  llm: "Essays about large language models — how they work, where they fail, what to make of them.",
  funes:
    "In the shadow of Borges's Funes the Memorious — essays on memory, oblivion, and total recall.",
  metaphysics:
    "What exists, what changes, and what persists — philosophy at its most foundational.",
  process:
    "On process over product: versions, revisions, and the Hrönir system that ranks them.",
  research:
    "Research notes and open questions, written in progress rather than after the fact.",
  introduction:
    "Starting points — essays that introduce a theme, a project, or this garden itself.",
  chaos:
    "On chaos, unpredictability, and the limits of control in complex systems.",
  "software engineering":
    "Notes on building software — architecture, tooling, and the craft itself.",
  probability:
    "On uncertainty, chance, and reasoning under incomplete information.",
  law: "Essays at the intersection of law, process, and automation — written by a public defender.",
  economics:
    "On incentives, markets, and the economics of attention and automation.",
  literature:
    "Essays in conversation with literature — Borges above all, but not only.",
  architecture:
    "On the architecture of systems, software, and the ideas that shape them.",
  culture: "Essays on culture, technology's effect on it, and vice versa.",
  security:
    "On security — of systems, of information, and sometimes of the self.",
  identity:
    "On identity — of authors, of agents, and of the personas language models put on.",

  // PT
  música:
    "Músicas originais de Franklin Baldo, geradas com Suno e entrelaçadas com os ensaios do jardim digital.",
  filosofia:
    "Metafísica, ontologia do processo e epistemologia, lidas através de um jardim digital em constante mudança.",
  canivete:
    "Ensaios sobre o método canivete-suíço: fazer mais com menos, cortando o supérfluo.",
  "inteligência artificial":
    "Ensaios longos sobre o alcance da inteligência artificial no direito, na cognição e na criação.",
  agentes:
    "Notas sobre rodar agentes autônomos de código — Claude, Jules e companhia — contra uma base de código em produção.",
  ia: "Ensaios sobre inteligência artificial: o que é, o que muda, o que significa pensar ao lado dela.",
  travessia: "Sobre atravessar limiares — pessoais, técnicos, filosóficos.",
  processo:
    "Sobre processo em vez de produto: versões, revisões e o sistema Hrönir que as ordena.",
  memória:
    "Na sombra de Funes, o Memorioso, de Borges — ensaios sobre memória, esquecimento e lembrança total.",
  convidado:
    "Conversas e colaborações com convidados — vozes além da de Franklin Baldo.",
  podcasts:
    "Episódios e conversas em áudio, publicadas ao lado dos ensaios escritos.",
};

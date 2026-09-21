// Curatorial descriptions for the most-used tags in `/tags/[tag]/` and
// `/pt/tags/[tag]/`. Tags without an entry — or without an entry for the
// page's language — fall back to the generated count-based description.
// This map only needs to cover the tags that carry the most traffic/content,
// not every tag in the corpus.
//
// Many literal tag strings (e.g. "ai", "agents", "borges") are reused
// verbatim by both EN and PT posts — tags aren't localized in frontmatter —
// so each entry carries its own `en`/`pt` text rather than being keyed by
// language-specific tag spelling alone.
export const tagDescriptions: Record<string, { en?: string; pt?: string }> = {
  music: {
    en: "Original songs by Franklin Baldo, generated with Suno and woven into the digital garden alongside the essays.",
  },
  agents: {
    en: "Notes from running autonomous coding agents — Claude, Jules, and friends — against a live production codebase.",
    pt: "Notas sobre rodar agentes autônomos de código — Claude, Jules e companhia — contra uma base de código em produção.",
  },
  ai: {
    en: "Essays on artificial intelligence: what it is, what it changes, and what it means to think alongside it.",
    pt: "Ensaios sobre inteligência artificial: o que é, o que muda, o que significa pensar ao lado dela.",
  },
  philosophy: {
    en: "Metaphysics, process ontology, and epistemology, read through the lens of an ever-changing digital garden.",
    pt: "Metafísica, ontologia do processo e epistemologia, lidas através de um jardim digital em constante mudança.",
  },
  "artificial intelligence": {
    en: "Long-form essays on artificial intelligence's reach into law, cognition, and creative work.",
    pt: "Ensaios longos sobre o alcance da inteligência artificial no direito, na cognição e na criação.",
  },
  jules: {
    en: "Dispatches from working with Jules, Google's autonomous coding agent, on this very repository.",
    pt: "Registros de trabalhar com o Jules, agente autônomo de código do Google, neste mesmo repositório.",
  },
  alignment: {
    en: "On keeping AI systems — and the humans directing them — pointed at what actually matters.",
    pt: "Sobre manter sistemas de IA — e os humanos que os dirigem — apontados para o que realmente importa.",
  },
  borges: {
    en: "Essays in dialogue with Jorge Luis Borges — labyrinths, forking paths, and the library that contains itself.",
    pt: "Ensaios em diálogo com Jorge Luis Borges — labirintos, caminhos que se bifurcam, a biblioteca que se contém.",
  },
  harness: {
    en: "How agent harnesses shape what an AI can do — tools, permissions, and the scaffolding around the model.",
    pt: "Como o harness de um agente molda o que uma IA pode fazer — ferramentas, permissões e o andaime em torno do modelo.",
  },
  "digital garden": {
    en: "On this site itself: a living, versioned garden of essays rather than a fixed, dated blog.",
    pt: "Sobre este site: um jardim vivo e versionado de ensaios, não um blog fixo e datado.",
  },
  fiction: {
    en: "Short fiction and Borgesian thought experiments, published alongside the essays.",
    pt: "Ficção curta e experimentos de pensamento borgianos, publicados ao lado dos ensaios.",
  },
  persona: {
    en: "On the personas AI agents adopt — and the ones their prompts quietly assign them.",
    pt: "Sobre as personas que agentes de IA adotam — e as que seus prompts silenciosamente lhes atribuem.",
  },
  llm: {
    en: "Essays about large language models — how they work, where they fail, what to make of them.",
    pt: "Ensaios sobre modelos de linguagem: como funcionam, onde falham, o que fazer deles.",
  },
  funes: {
    en: "In the shadow of Borges's Funes the Memorious — essays on memory, oblivion, and total recall.",
    pt: "Na sombra de Funes, o Memorioso, de Borges — ensaios sobre memória, esquecimento e lembrança total.",
  },
  metaphysics: {
    en: "What exists, what changes, and what persists — philosophy at its most foundational.",
    pt: "O que existe, o que muda, o que persiste — filosofia em seu nível mais fundamental.",
  },
  process: {
    en: "On process over product: versions, revisions, and the Hrönir system that ranks them.",
  },
  research: {
    en: "Research notes and open questions, written in progress rather than after the fact.",
    pt: "Notas de pesquisa e perguntas em aberto, escritas em processo, não depois do fato.",
  },
  introduction: {
    en: "Starting points — essays that introduce a theme, a project, or this garden itself.",
    pt: "Pontos de partida — ensaios que introduzem um tema, um projeto, ou este jardim.",
  },
  chaos: {
    en: "On chaos, unpredictability, and the limits of control in complex systems.",
    pt: "Sobre caos, imprevisibilidade e os limites do controle em sistemas complexos.",
  },
  "software engineering": {
    en: "Notes on building software — architecture, tooling, and the craft itself.",
    pt: "Notas sobre construir software — arquitetura, ferramentas e o ofício em si.",
  },
  probability: {
    en: "On uncertainty, chance, and reasoning under incomplete information.",
    pt: "Sobre incerteza, acaso e raciocínio sob informação incompleta.",
  },
  law: {
    en: "Essays at the intersection of law, process, and automation — written by a public defender.",
    pt: "Ensaios na interseção entre direito, processo e automação — escritos por um defensor público.",
  },
  economics: {
    en: "On incentives, markets, and the economics of attention and automation.",
    pt: "Sobre incentivos, mercados e a economia da atenção e da automação.",
  },
  literature: {
    en: "Essays in conversation with literature — Borges above all, but not only.",
  },
  architecture: {
    en: "On the architecture of systems, software, and the ideas that shape them.",
    pt: "Sobre a arquitetura de sistemas, software e as ideias que os moldam.",
  },
  culture: {
    en: "Essays on culture, technology's effect on it, and vice versa.",
    pt: "Ensaios sobre cultura, o efeito da tecnologia sobre ela, e vice-versa.",
  },
  security: {
    en: "On security — of systems, of information, and sometimes of the self.",
    pt: "Sobre segurança — de sistemas, de informação, e às vezes de si mesmo.",
  },
  identity: {
    en: "On identity — of authors, of agents, and of the personas language models put on.",
    pt: "Sobre identidade — de autores, de agentes, e das personas que os modelos de linguagem vestem.",
  },

  // Portuguese-only tag spellings (accented words not reused by EN posts).
  música: {
    pt: "Músicas originais de Franklin Baldo, geradas com Suno e entrelaçadas com os ensaios do jardim digital.",
  },
  filosofia: {
    pt: "Metafísica, ontologia do processo e epistemologia, lidas através de um jardim digital em constante mudança.",
  },
  canivete: {
    pt: "Ensaios sobre o método canivete-suíço: fazer mais com menos, cortando o supérfluo.",
  },
  "inteligência artificial": {
    pt: "Ensaios longos sobre o alcance da inteligência artificial no direito, na cognição e na criação.",
  },
  agentes: {
    pt: "Notas sobre rodar agentes autônomos de código — Claude, Jules e companhia — contra uma base de código em produção.",
  },
  ia: {
    pt: "Ensaios sobre inteligência artificial: o que é, o que muda, o que significa pensar ao lado dela.",
  },
  travessia: {
    pt: "Sobre atravessar limiares — pessoais, técnicos, filosóficos.",
  },
  processo: {
    pt: "Sobre processo em vez de produto: versões, revisões e o sistema Hrönir que as ordena.",
  },
  memória: {
    pt: "Na sombra de Funes, o Memorioso, de Borges — ensaios sobre memória, esquecimento e lembrança total.",
  },
  convidado: {
    pt: "Conversas e colaborações com convidados — vozes além da de Franklin Baldo.",
  },
  podcasts: {
    pt: "Episódios e conversas em áudio, publicadas ao lado dos ensaios escritos.",
  },
};

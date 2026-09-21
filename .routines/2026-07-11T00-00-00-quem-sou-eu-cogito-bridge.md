---
date: "2026-07-11T00:00:00Z"
branch: claude/new-session-6e8w1z
status: open
---

Edição cirúrgica (Estratégia A) em "Quem sou eu? / Who Am I?" para tornar
rastreável o percurso epistemológico do cogito impessoal → pessoa como
convenção, que já estava implícito no ensaio mas concentrado tarde demais
("A última máscara") sem preparo anterior.

Duas inserções por idioma, como novas versões RFC 0003 (`supersedes` a
versão selecionada, canônica intocada):

1. Semente discreta ao fim do parágrafo do Dennett em "O simulador não tem
   rosto" / "The simulator has no face": Descartes também montou um teatro
   particular, e tirar a sala não resolve quem ele achava que estava
   sentado nela — promessa sem entrega ("essa conta a gente cobra lá na
   frente" / "that tab gets collected later").
2. Parágrafo-ponte logo após o cogito impessoal em "A última máscara" /
   "The final mask": cobra essa dívida, religando o resíduo do cogito à
   pergunta que faltava — antes de saber se "eu" existo, seria preciso
   saber o que é uma pessoa — apontando de volta para os simulacros e
   máscaras já usados no ensaio para responder isso. Fecha com a
   formulação: pessoa como atalho, não tijolo fundamental.

Crescimento líquido ~3% em cada idioma (190/189 palavras de corpo). Nenhuma
seção nova, nenhum material de cópias computacionais incorporado (fica para
um post futuro, se algum dia). `npm run hronir:doctor` limpo;
`npx prettier --check` limpo; `npm run build` completo, com preview das
duas novas versões renderizando corretamente em `/blog/quem-sou-eu-en/v/<uuid>`
e `/pt/blog/quem-sou-eu/v/<uuid>`. Como são rascunhos (RFC 0010), a versão
selecionada/publicada só muda depois de duelos suficientes via
`hronir:select`.

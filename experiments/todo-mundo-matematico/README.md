# Todo mundo é matemático agora!

Vídeo animado de cerca de 9 minutos para o Clube dos Silveira Baldo: comédia de
divulgação científica sobre IA, formalização e o fiscal mais rigoroso da
matemática, o Lean. Feito com Remotion (React + TypeScript).

O MP4 renderizado não fica no git. Para gerá-lo, siga o pipeline abaixo.

## Pipeline

```text
data/script.json ──► tools/build_audio.py ──► public/audio/voice.wav
  (falas, vozes,          (TTS pt-BR,             src/generated/timeline.json
   pausas)                 durações reais)         legendas.srt
                                         └──► tools/build_music.py ──► public/audio/music.wav
tools/build_sfx.py ──► public/sfx/*.wav
lean/*.lean ──► lean/verificar.sh + tools/capture_lean.py ──► src/generated/lean.json
src/ (cenas) ──► remotion render ──► out/todo-mundo-e-matematico-agora.mp4
```

A animação é dirigida pela duração real da narração. Cada cena consulta
`makeCues("sN")` para saber em que frame cada fala (ou cada palavra) começa. Se
o roteiro mudar, basta regenerar o áudio: as animações se reposicionam sozinhas.

## Comandos

```bash
npm ci
npm run audio     # TTS + trilha + efeitos (precisa de uv, ffmpeg e rede)
npm run lean      # verifica as provas e grava a saída real do Lean
npm run dev       # Remotion Studio: prévia do filme e de cada cena
npm run render    # MP4 1920×1080, 30 fps
```

O `npm run lean` precisa do Lean 4 (via `elan`). Foi verificado com Lean 4.35.0.

## Lean: o que é verdade no vídeo

As provas mostradas na tela são arquivos reais em `lean/`. O vídeo exibe a
saída capturada da execução, não um texto inventado.

| Arquivo | Cena | Resultado |
| --- | --- | --- |
| `ParMaisDois.lean` | 5 | Compila. `par_mais_dois` não depende de nenhum axioma. |
| `Comutativa.lean` | 4 | Compila com `Nat.add_comm`. |
| `rejeitado/Obvio.lean` | 4 | É rejeitado de propósito: `rfl` não prova `a + b = b + a`. |
| `Festa.lean` | 8 | Compila: a conta está certa, a hipótese (12 convidados) é que está errada. |

`lean/verificar.sh` falha se algum arquivo aceito contiver `sorry`, `admit` ou
`axiom`, e também falha se o fiscal aceitar o "é óbvio".

## Áudio

- Narração e diálogos: vozes neurais do Microsoft Edge TTS (`edge-tts`), em
  pt-BR. Personagens usam vozes multilíngues lendo português (o professor tem
  sotaque alemão, o Lean, francês, e o tio, italiano).
- Trilha e efeitos: sintetizados do zero em `tools/`, sem samples de
  terceiros. A trilha abaixa sozinha (ducking) quando alguém fala.
- Legendas: `legendas.srt` (todas as falas). No vídeo, a narração aparece
  como legenda e os diálogos aparecem em balões.

## Estrutura

- `src/chars/`: personagens vetoriais (Matemático, Pessoa e variantes, IA, Lean).
- `src/scenes/`: as nove cenas, pós-créditos e créditos.
- `src/ui/kit.tsx`: câmera, balões, carimbo, confete, código, terminal e legendas.
- `src/Root.tsx`: composição completa (`TodoMundoMatematico`) e uma composição
  por cena (`Cena-s1` … `Cena-credits`) para prévia.
- `tools/stills.sh`: mosaico de quadros de uma cena, para inspeção rápida.

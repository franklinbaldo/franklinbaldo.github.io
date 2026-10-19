# Cena articulada: segunda etapa visual

Esta mudança sucede a primeira arena de propriocepção. Preserva encoder,
identidades aferentes, grafo, entrada artificial e readouts. O renderer apenas
recebe o estado atual; não devolve controles para a simulação.

## Forma, material e leitura

A cena tem duas cápsulas com superfície arredondada, junta, chão de referência,
câmera fixa e iluminação de estúdio. O ângulo interno vem diretamente do estado
físico da articulação posterior direita. As proporções e a superfície são
esquemáticas: não representam reconstrução anatômica, músculos ou forças.
O chão fornece profundidade; não existe solver de contato.

Os modos **Inspeção** e **Expressivo** mantêm pose, câmera e dados idênticos.
Inspeção mostra guias de eixo e material mais neutro; Expressivo enfatiza a
paleta. Cinco controles mudam somente a apresentação:

- Curvatura da superfície: volume da cápsula, sem mover eixos ou extremidades
- Rugosidade: largura e intensidade do brilho
- Direção da luz: azimute da luz principal
- Detalhe: amplitude das estrias longitudinais
- Paleta: cor do material, independente do marcador neural

Restaurar aparência não reinicia o estímulo nem o circuito. Alterar os controles
físicos mantém a regra anterior de reset e pausa. Não há 128 coeficientes Fourier
opacos controlando toda a imagem, nem funções sensoriais atribuídas à decoração.

## Marcador neural

O pequeno ponto frontal junto à origem do fêmur usa a média absoluta do estado
VNC já produzida pelo worker. Sua posição é gráfica, não anatômica. Escala
publicada: `clamp(abs(activity) * 1000, 0, 1)`. Sem dados: cinza; conectado com
zero: âmbar escuro; valor crescente: âmbar mais luminoso. O ganho só melhora a
visibilidade e nunca é aplicado à entrada ou ao modelo. As unidades continuam
sendo as do modelo exploratório, não spikes, tensão ou energia.

## Renderização e fallback

WebGL2 sem biblioteca externa; raymarch limitado a 64 passos, chão analítico,
sem marchas adicionais de sombra ou volume. Resolução limitada a 900×600 no
desktop, 640×420 no mobile e DPR máximo 1,5. Desenha somente quando dados,
aparência ou dimensões mudam. Não há relógio de animação decorativa: a cena
permanece estática em pausa, inclusive sob `prefers-reduced-motion`.

Falha de WebGL/compilação ou perda de contexto mostra o SVG alternativo e
preserva controles e números. Restauração de contexto reconstrói recursos e
redesenha a última pose. Testes puros cobrem geometria, limites, distinção entre
ausência/zero, perda/restauração e falhas de compilação. O smoke Chromium testa
pixels, invariância de dados com o circuito conectado, modos, teclado,
context-loss/fallback, mobile e ausência de movimento automático.

## Referência e licença

A direção visual foi informada por [Shader Skills, de gokayfem](https://github.com/gokayfem/shader-skills)
e pelo [template raymarch-sdf.glsl](https://github.com/gokayfem/shader-skills/blob/main/skills/shader-art-coding/templates/raymarch-sdf.glsl):
forma estruturada, materiais explícitos, câmera/luz e modos de inspeção. A
[licença MIT](https://github.com/gokayfem/shader-skills/blob/main/LICENSE) foi
consultada. O código desta implementação é original; não copiamos ou executamos
scripts, templates ou funções externas, nem instalamos a skill como dependência.

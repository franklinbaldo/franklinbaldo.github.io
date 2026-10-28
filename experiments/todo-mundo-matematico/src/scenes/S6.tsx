import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Person } from "../chars/Person";
import { Robot } from "../chars/Robot";
import { LeanChar } from "../chars/Lean";
import { C, body, display } from "../lib/theme";
import { kf, pop, ramp, shake, wobble } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import { Backdrop, Bubble, Camera, Confetti, Flash, PopText, SceneFade, SceneTag, Sfx, Stage, StampMark } from "../ui/kit";
import { Grill, Ground, PaperStack, Sign, Trophy } from "./props";

const c = makeCues("s6");

const Bike: React.FC = () => (
  <g stroke={C.white} strokeWidth={8} fill="none">
    <circle cx={-60} cy={30} r={44} />
    <circle cx={70} cy={30} r={44} />
    <path d="M -60 30 L -10 -30 L 50 -30 L 70 30 M -10 -30 L 10 30 L -60 30 M 50 -30 L 40 -60 M 30 -60 L 56 -60 M -10 -30 L -20 -50 M -36 -50 L -4 -50" />
  </g>
);
const Scooter: React.FC = () => (
  <g stroke={C.white} strokeWidth={8} fill="none">
    <circle cx={-60} cy={40} r={26} />
    <circle cx={60} cy={40} r={26} />
    <path d="M -60 40 L 60 40 M 50 40 L 30 -80 M 10 -80 L 50 -80" />
  </g>
);
const Stroller: React.FC = () => (
  <g stroke={C.white} strokeWidth={8} fill="none">
    <path d="M -70 -20 Q -70 -90 0 -90 L 0 -20 Z" fill="rgba(255,255,255,0.15)" />
    <path d="M -70 -20 L 60 -20 L 50 20 L -60 20 Z M 60 -20 L 90 -80 L 110 -80" />
    <circle cx={-44} cy={44} r={22} />
    <circle cx={40} cy={44} r={22} />
  </g>
);

export const S6: React.FC = () => {
  const frame = useCurrentFrame();
  const L = c.sceneLength;
  const A = 0;
  const B = c("s6_c").start - 6;
  const Cc = c("s6_f").start - 6;
  const D = c("s6_j").start - 6;
  const E = c("s6_m").start - 6;
  const phase = frame < B ? "A" : frame < Cc ? "B" : frame < D ? "C" : frame < E ? "D" : "E";
  const freeze = frame > c("s6_p").start && frame < c("s6_q").start - 6;
  const processo = c("s6_s").start + 18;

  return (
    <AbsoluteFill>
      <Backdrop />

      {/* A — a invasão dos amadores */}
      {phase === "A" && (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {Array.from({ length: 16 }).map((_, i) => {
              const at = A + 4 + i * 6;
              const x = 120 + ((i * 263) % 1700);
              const y = 980 - (i % 3) * 30;
              const [sx, sy] = shake(frame, 3, i);
              return (
                <Actor key={i} x={x + sx} y={y + sy} s={0.55 * pop(frame, at)}>
                  <Person
                    variant={(["avo", "kid", "tio", "dev", "adv", "pes", "crowd"] as const)[i % 7]}
                    mood={i % 2 ? "happy" : "shock"}
                    armR={120 + wobble(frame, 8, 40, i)}
                    armL={-60 + wobble(frame, 9, 30, i)}
                    mouth={0}
                    seed={i}
                    jump={Math.abs(Math.sin((frame + i * 7) / 5)) * 30}
                  />
                </Actor>
              );
            })}
            {Array.from({ length: 22 }).map((_, i) => {
              const t = frame - i * 3;
              if (t < 0) return null;
              return (
                <text key={i} x={(i * 211) % 1920} y={1100 - t * (6 + (i % 4))} fontFamily={display} fontWeight={800} fontSize={48 + (i % 3) * 20} fill={[C.yellow, C.cyan, C.coral, C.white][i % 4]} opacity={0.8} transform={`rotate(${wobble(frame, 30, 20, i * 9)} ${(i * 211) % 1920} ${1100 - t * (6 + (i % 4))})`}>
                  {["∀", "∃", "⊢", "=", "∑", "≤", "π", "∞", "→", "¬"][i % 10]}
                </text>
              );
            })}
          </svg>
          <PopText at={8} until={B - 4} x={960} y={300} size={110} color={C.yellow} rot={-4}>
            A INVASÃO DOS
          </PopText>
          <PopText at={18} until={B - 4} x={960} y={430} size={130} color={C.white} rot={3}>
            AMADORES!
          </PopText>
        </AbsoluteFill>
      )}

      {/* B — vovó e a pitadinha */}
      {phase === "B" && (
        <Camera keys={[[B, 1.05, 960, 540], [c("s6_d").start, 1.05, 960, 540], [c.word("s6_d", "pitadinha"), 1.12, 1000, 520], [c("s6_e").start, 1.15, 760, 560]]}>
          <Stage>
            <Ground y={940} color="#3a2a4f" />
            <rect x={0} y={0} width={1920} height={940} fill="#2a2148" opacity={0.6} />
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect key={i} x={i * 240} y={600} width={236} height={340} fill={i % 2 ? "#e8dcc8" : "#f3eadb"} opacity={0.15} />
            ))}
            {/* receita formalizada */}
            <g transform={`translate(1010 470) scale(${pop(frame, B + 10)})`}>
              <rect x={-420} y={-300} width={840} height={560} rx={20} fill="#fffaf0" stroke="#c9a96b" strokeWidth={8} />
              <text y={-230} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={52} fill={C.ink}>
                Teoria do Bolo Perfeito
              </text>
              {["1. ovos := 3", "2. farinha := 2 xícaras", "3. sal := uma pitadinha", "4. forno := até ficar bom", "∴ bolo perfeito ∎"].map((t, i) => {
                const hl = i === 2 && frame > c.word("s6_d", "pitadinha");
                return (
                  <g key={i}>
                    {hl && <rect x={-380} y={-170 + i * 80} width={760} height={66} rx={10} fill={C.yellow} opacity={0.7} />}
                    <text x={-360} y={-122 + i * 80} fontFamily="'JetBrains Mono', monospace" fontWeight={700} fontSize={40} fill={i === 4 ? "#8a2be2" : C.ink}>
                      {t}
                    </text>
                    {hl && (
                      <text x={330} y={-120 + i * 80} fontFamily={display} fontWeight={800} fontSize={56} fill={C.red}>
                        ?
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
            <Actor x={330} y={940} s={1.05}>
              <Person variant="avo" mood={frame > c("s6_e").start ? "angry" : "happy"} armR={frame > c("s6_e").start ? 110 + wobble(frame, 6, 20) : 30} look={[1, 0]} holdL={<rect x={-6} y={0} width={12} height={90} rx={6} fill="#c9a96b" />} />
            </Actor>
            <Actor x={kf(frame, [c("s6_d").start - 20, c("s6_d").start], [2150, 1580])} y={940} s={0.95} flip>
              <LeanChar tool="magnifier" look={[1, -0.6]} mood={frame > c("s6_e").start ? "shock" : "serious"} />
            </Actor>
          </Stage>
          <Bubble line="s6_d" x={1600} y={560} w={560} side="right" size={34} color={C.yellow} />
          <Bubble line="s6_e" x={360} y={480} w={480} size={40} />
        </Camera>
      )}

      {/* C — a criança e o Nobel da Arrumação */}
      {phase === "C" && (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <rect x={0} y={0} width={1920} height={1080} fill="#1d2f5e" opacity={0.6} />
            <Ground y={930} color="#5a3e2b" />
            {/* bagunça */}
            {Array.from({ length: 18 }).map((_, i) => (
              <rect key={i} x={60 + ((i * 331) % 1800)} y={880 + (i % 3) * 18} width={40 + (i % 4) * 20} height={30} rx={8} fill={[C.coral, C.cyan, C.yellow, C.green, C.purple][i % 5]} transform={`rotate(${(i * 37) % 60 - 30} ${80 + ((i * 331) % 1800)} 900)`} />
            ))}
            <path d="M 1500 900 q 40 -60 80 0 q 40 -60 80 0" stroke="#ddd" strokeWidth={14} fill="none" />
            {/* quadro com o "teorema" */}
            <g transform={`translate(960 290) scale(${0.85 * pop(frame, Cc + 6)})`}>
              <rect x={-560} y={-210} width={1120} height={400} rx={14} fill="#123b2a" stroke="#8a5a2b" strokeWidth={12} />
              <text y={-130} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={44} fill={C.yellow}>
                TEOREMA DO QUARTO
              </text>
              {(frame < c("s6_i").start
                ? ["H: ninguém entra no quarto", "⟹ ninguém vê a bagunça", "∴ não preciso arrumar!"]
                : ["ninguém entra ⟹ ninguém vê  ✔", "ninguém vê ⟹ arrumar é desnecessário  ✘", "falta uma hipótese!"]
              ).map((t, i) => (
                <text
                  key={`${frame < c("s6_i").start}-${i}`}
                  x={-500}
                  y={-50 + i * 75}
                  fontFamily={display}
                  fontWeight={800}
                  fontSize={46}
                  fill={frame >= c("s6_i").start ? [C.green, C.coral, C.yellow][i] : "#f4f4e8"}
                  opacity={ramp(frame, (frame < c("s6_i").start ? c("s6_g").start + i * 40 : c("s6_i").start + i * 30), (frame < c("s6_i").start ? c("s6_g").start + i * 40 : c("s6_i").start + i * 30) + 10)}
                >
                  {t}
                </text>
              ))}
            </g>
            <Actor x={330} y={930} s={1.15}>
              <Person variant="kid" mood={frame > c("s6_i").start + 30 ? "sad" : "smug"} armR={frame > c("s6_g").start && frame < c("s6_g").end ? 150 : 30} look={[1, -0.3]} holdR={frame > c("s6_h").start ? <Trophy x={0} y={20} s={0.5} /> : undefined} />
            </Actor>
            {frame > c("s6_h").start - 10 && (
              <Actor x={kf(frame, [c("s6_h").start - 10, c("s6_h").start + 6], [2200, 1350])} y={820} s={0.8}>
                <Robot face={frame > c("s6_i").start ? "sad" : "star"} gear={["shades", "crown", "medals", "cape"]} armR={140} />
              </Actor>
            )}
            {frame > c("s6_i").start - 16 && (
              <Actor x={kf(frame, [c("s6_i").start - 16, c("s6_i").start], [-300, 700])} y={930} s={1}>
                <LeanChar stamp={0.3} look={[1, -0.3]} />
              </Actor>
            )}
          </svg>
          {frame > c("s6_h").start && frame < c("s6_i").start + 20 && (
            <PopText at={c("s6_h").start + 4} until={c("s6_i").start + 10} x={1300} y={80} size={60} color={C.yellow} rot={4} plate>
              PRÊMIO NOBEL DA ARRUMAÇÃO
            </PopText>
          )}
          <Confetti at={c("s6_h").start + 6} x={1100} y={300} />
          <Bubble line="s6_g" x={420} y={560} w={640} size={32} />
          <Bubble line="s6_h" x={1400} y={430} w={460} side="right" size={34} color={C.cyanSoft} />
          <Bubble line="s6_i" x={770} y={700} w={560} size={32} color={C.yellow} />
        </AbsoluteFill>
      )}

      {/* D — programador e advogado */}
      {phase === "D" && (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <Ground y={930} color="#1f5a3a" />
            {/* programador */}
            <g opacity={1 - ramp(frame, c("s6_k").start - 10, c("s6_k").start + 10) * 0.6}>
              <Actor x={300} y={930} s={0.95 * pop(frame, D + 4)}>
                <Person variant="dev" mood="happy" armR={70} mouth={0} />
              </Actor>
              <g transform={`translate(560 640) scale(${pop(frame, D + 12)})`}>
                <rect x={-130} y={-90} width={260} height={170} rx={12} fill="#222" stroke="#888" strokeWidth={6} />
                <rect x={-116} y={-76} width={232} height={142} fill="#081026" />
                {[0, 1, 2, 3].map((i) => (
                  <rect key={i} x={-100} y={-60 + i * 30} width={60 + ((i * 47) % 110)} height={12} rx={6} fill={[C.coral, C.cyan, C.yellow, C.green][i]} />
                ))}
                <rect x={-160} y={80} width={320} height={16} rx={6} fill="#555" />
                {frame > c.word("s6_j", "funciona") && <text x={110} y={-100} fontSize={90} fill={C.green} fontWeight={900} transform={`scale(1)`}>✔</text>}
              </g>
            </g>
            {/* parque com placa */}
            {[1160, 1380, 1700].map((x, i) => (
              <g key={i}>
                <rect x={x - 12} y={760} width={24} height={170} fill="#6b4520" />
                <circle cx={x} cy={720} r={90 + (i % 2) * 20} fill="#2e8b57" />
              </g>
            ))}
            {frame > c("s6_j").start + 60 && <Sign x={1500} y={760} text={"ART. 1º — É PROIBIDO\nVEÍCULOS NO PARQUE"} w={560} size={36} />}
            <Actor x={1000} y={930} s={0.95 * pop(frame, c.word("s6_j", "advogado"))}>
              <Person variant="adv" mood={frame > c("s6_l").start + 20 ? "shock" : "serious"} armR={frame > c("s6_k").start && frame < c("s6_k").end ? 120 : 20} look={[1, 0]} />
            </Actor>
            {frame > c("s6_l").start - 10 && (
              <Actor x={kf(frame, [c("s6_l").start - 10, c("s6_l").start + 4], [2200, 1800])} y={930} s={0.85} flip>
                <LeanChar tool="magnifier" look={[1, -0.4]} />
              </Actor>
            )}
            {/* veículo? */}
            {[
              { w: "bicicleta", x: 350, El: Bike },
              { w: "patinete", x: 760, El: Scooter },
              { w: "carrinho", x: 1170, El: Stroller },
            ].map(({ w, x, El }) => {
              const at = c.word("s6_l", w);
              if (frame < at) return null;
              return (
                <g key={w} transform={`translate(${x} 260) scale(${pop(frame, at)})`}>
                  <circle r={150} fill={C.panel} stroke={C.yellow} strokeWidth={6} />
                  <El />
                  <text x={110} y={-90} fontFamily={display} fontWeight={800} fontSize={90} fill={C.yellow}>
                    ?
                  </text>
                </g>
              );
            })}
          </svg>
          <Bubble line="s6_k" x={1020} y={560} w={560} size={34} />
          <Bubble line="s6_l" x={1780} y={540} w={520} side="right" size={34} color={C.yellow} />
        </AbsoluteFill>
      )}

      {/* E — o tio, a definição de "melhor" e o processo */}
      {phase === "E" && (
        <Camera
          keys={[
            [E, 1, 960, 540],
            [c("s6_p").start - 2, 1, 960, 540],
            [c("s6_p").start + 4, 2.0, 700, 560],
            [c("s6_q").start - 8, 2.0, 700, 560],
            [c("s6_q").start + 6, 1, 960, 540],
          ]}
          shakeAt={[[processo, 30, 22]]}
        >
          <Stage>
            <Ground y={930} />
            <Grill x={300} y={930} s={1.1} />
            <Actor x={640} y={930 - (frame > processo ? 4000 : 0)} s={1.05}>
              <Person variant="tio" mood={freeze ? "smug" : frame > c("s6_o").start ? "shock" : "happy"} armR={frame > c("s6_n").start && frame < c("s6_n").end ? 150 : 40} look={[1, 0]} />
            </Actor>
            {/* teorema do tio */}
            {frame > c("s6_n").start && frame < c("s6_q").start && (
              <g transform={`translate(1020 230) scale(${pop(frame, c("s6_n").start)}) rotate(-3)`}>
                <rect x={-330} y={-70} width={660} height={130} rx={14} fill="#fff6dc" stroke="#c9a96b" strokeWidth={6} />
                <text y={-16} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.red}>
                  TEOREMA (do Tio)
                </text>
                <text y={34} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={36} fill={C.ink}>
                  ∀ churrasco c, meu ≥ c
                </text>
              </g>
            )}
            <Actor x={kf(frame, [c("s6_o").start - 16, c("s6_o").start], [2200, 1240])} y={930} s={0.95} flip>
              <LeanChar stamp={frame > processo - 16 && frame < processo ? ramp(frame, processo - 16, processo - 4) : 0.2} look={[1, -0.3]} />
            </Actor>
            {/* dicionário de palavras indefinidas */}
            {frame > c("s6_q").start && (
              <g transform={`translate(1000 300) scale(${pop(frame, c("s6_q").start)})`} opacity={1 - ramp(frame, processo - 10, processo)}>
                <rect x={-420} y={-160} width={840} height={330} rx={20} fill="#fff" stroke={C.ink} strokeWidth={6} />
                <text y={-100} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={42} fill={C.ink}>
                  DICIONÁRIO DE DEFINIÇÕES
                </text>
                {["pitadinha := ???", "veículo := ???", "melhor := ???", "churrasco perfeito := ???"].map((t, i) => (
                  <text key={t} x={-380} y={-40 + i * 52} fontFamily="'JetBrains Mono', monospace" fontWeight={700} fontSize={34} fill={i === 3 && frame > c("s6_r").start ? C.red : C.ink} opacity={ramp(frame, c("s6_q").start + 20 + i * 18, c("s6_q").start + 30 + i * 18)}>
                    {t}
                  </text>
                ))}
              </g>
            )}
            {/* o processo de 4.000 páginas */}
            {frame > processo - 8 && (
              <g transform={`translate(640 ${930 - kf(frame, [processo - 8, processo], [1200, 0])})`}>
                <PaperStack x={0} y={0} h={560} label={"PROCESSO Nº 1\nChurrasco Perfeito · 4.000 pp."} />
              </g>
            )}
          </Stage>
          <Bubble line="s6_n" x={680} y={600} w={560} size={36} />
          <Bubble line="s6_o" x={1260} y={560} w={460} side="right" size={38} color={C.yellow} />
          <Bubble line="s6_p" x={720} y={500} w={240} size={50} shout />
          <Bubble line="s6_s" x={1260} y={560} w={380} side="right" size={38} color={C.yellow} />
        </Camera>
      )}
      {freeze && (
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 150 }}>
          <div style={{ fontFamily: body, fontWeight: 900, fontSize: 46, color: C.ink, background: C.yellow, padding: "6px 26px", borderRadius: 12, rotate: "-3deg" }}>
            definição circular detectada
          </div>
        </AbsoluteFill>
      )}
      {phase === "E" && <StampMark at={processo + 4} text="EM ANÁLISE" x={1350} y={300} color={C.red} rot={8} size={90} sfx={false} />}
      <Flash at={processo} dur={6} />

      {[B, Cc, D, E].map((f, i) => (
        <Sfx key={i} at={f - 2} name="whoosh" volume={0.4} />
      ))}
      <Sfx at={4} name="siren" volume={0.2} />
      <Sfx at={c.word("s6_d", "pitadinha")} name="zap" volume={0.3} />
      <Sfx at={c("s6_h").start} name="success" volume={0.4} />
      <Sfx at={c("s6_i").start + 40} name="buzzer" volume={0.3} />
      {["bicicleta", "patinete", "carrinho"].map((w) => (
        <Sfx key={w} at={c.word("s6_l", w)} name="boing" volume={0.3} />
      ))}
      <Sfx at={c("s6_p").start} name="record-scratch" volume={0.5} />
      <Sfx at={processo} name="thud" volume={0.8} />
      <Sfx at={processo + 4} name="stamp" volume={0.6} />
      <SceneTag scene="s6" n={6} />
      <SceneFade length={L} inF={6} outF={6} />
    </AbsoluteFill>
  );
};

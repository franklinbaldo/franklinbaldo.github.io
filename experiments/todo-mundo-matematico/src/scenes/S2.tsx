import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Person } from "../chars/Person";
import { LeanChar } from "../chars/Lean";
import { C, display } from "../lib/theme";
import { kf, lin, pop, ramp, wobble } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import { Backdrop, Bubble, Camera, SceneFade, SceneTag, Sfx, Stage } from "../ui/kit";
import { Cake, Grill, Ground, Trophy } from "./props";

const c = makeCues("s2");
const P = (i: number) => i * 1920;

const Node: React.FC<{ x: number; y: number; at: number; label: string; color?: string; w?: number }> = ({ x, y, at, label, color = C.cyan, w = 300 }) => {
  const frame = useCurrentFrame();
  const s = pop(frame, at);
  if (s <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y={-44} width={w} height={88} rx={44} fill={C.panel} stroke={color} strokeWidth={6} />
      <text y={16} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={44} fill={C.white}>
        {label}
      </text>
    </g>
  );
};

const Edge: React.FC<{ a: [number, number]; b: [number, number]; at: number; color?: string }> = ({ a, b, at, color = C.cyan }) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, at, at + 15);
  if (p <= 0) return null;
  return <line x1={a[0]} y1={a[1]} x2={a[0] + (b[0] - a[0]) * p} y2={a[1] + (b[1] - a[1]) * p} stroke={color} strokeWidth={6} strokeDasharray="14 10" opacity={0.8} />;
};

export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const L = c.sceneLength;
  const wJogo = c.word("s2_c", "jogo");
  const wAlg = c.word("s2_c", "algoritmo");
  const wCond = c.word("s2_c", "condições");
  const wImp = c.word("s2_c", "impossível");
  const tioAt = c("s2_f").start;
  const leanIn = c("s2_g").end - 10;

  const cam: [number, number, number, number][] = [
    [0, 1.25, P(0) + 960, 520],
    [c("s2_a").end, 1.0, P(0) + 960, 540],
    [c("s2_c").start - 12, 1.0, P(0) + 960, 540],
    [c("s2_c").start + 14, 1.0, P(1) + 960, 540],
    [c("s2_d").start - 12, 1.0, P(1) + 960, 540],
    [c("s2_d").start + 14, 1.0, P(2) + 960, 540],
    [c("s2_e").start - 12, 1.0, P(2) + 960, 540],
    [c("s2_e").start + 14, 1.0, P(3) + 960, 540],
    [tioAt - 12, 1.0, P(3) + 960, 540],
    [tioAt + 16, 1.0, P(4) + 960, 540],
    [c("s2_g").start, 1.15, P(4) + 900, 560],
    [c("s2_h").start, 1.3, P(4) + 1000, 600],
  ];

  // panel 0: calculadora "só contas?"
  const calcShake = frame > c.word("s2_b", "não") && frame < c.word("s2_b", "não") + 14 ? wobble(frame, 4, 10) : 0;

  return (
    <AbsoluteFill>
      <Backdrop />
      <Camera keys={cam}>
        <Stage w={9600}>
          <Ground x0={-200} x1={9800} />

          {/* ── P0: só contas? ── */}
          <g transform={`translate(${P(0) + 960} 520) rotate(${calcShake}) scale(${1 - 0.25 * ramp(frame, c("s2_b").start, c("s2_b").start + 20)})`}>
            <rect x={-200} y={-300} width={400} height={560} rx={40} fill="#2b3a67" stroke={C.ink} strokeWidth={8} />
            <rect x={-160} y={-260} width={320} height={120} rx={14} fill="#a8e6a1" />
            <text x={140} y={-170} textAnchor="end" fontFamily="monospace" fontWeight={800} fontSize={70} fill="#163b14">
              {frame < 40 ? "2+2" : "=4"}
            </text>
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={i} x={-160 + (i % 3) * 112} y={-110 + Math.floor(i / 3) * 92} width={96} height={76} rx={14} fill={i === 11 ? C.coral : "#3f5594"} />
            ))}
          </g>
          {frame > c.word("s2_a", "contas") && frame < c("s2_b").start + 10 && (
            <text x={P(0) + 1300} y={330} fontFamily={display} fontWeight={800} fontSize={220} fill={C.yellow} transform={`rotate(${wobble(frame, 20, 8)} ${P(0) + 1300} 330)`}>
              ?
            </text>
          )}
          {(() => {
            const center: [number, number] = [P(0) + 960, 520];
            const nodes: [string, string, number, number, string][] = [
              ["regras", "regras", 420, 230, C.cyan],
              ["relações", "relações", 1500, 230, C.yellow],
              ["estruturas", "estruturas", 420, 780, C.green],
              ["consequências", "consequências", 1500, 780, C.coral],
            ];
            return nodes.map(([w, label, x, y, col]) => {
              const at = c.word("s2_b", w);
              return (
                <g key={w}>
                  <Edge a={center} b={[P(0) + x, y]} at={at} color={col} />
                  <Node x={P(0) + x} y={y} at={at} label={label} color={col} w={w === "consequências" ? 420 : 320} />
                  <Sfx at={at} name="pop" volume={0.3} />
                </g>
              );
            });
          })()}

          {/* ── P1: jogo / algoritmo / contrato ── */}
          <g transform={`translate(${P(1)} 0)`}>
            {/* jogo: duas cartas de regra que se contradizem */}
            <g transform={`translate(330 470) scale(${pop(frame, wJogo - 4)})`}>
              <rect x={-200} y={-140} width={400} height={280} rx={20} fill="#1f7a4d" stroke={C.ink} strokeWidth={6} />
              {Array.from({ length: 16 }).map((_, i) => (
                <rect key={i} x={-180 + (i % 4) * 92} y={-120 + Math.floor(i / 4) * 62} width={84} height={54} fill={(i + Math.floor(i / 4)) % 2 ? "#2ea56a" : "#25935d"} />
              ))}
              {[
                { t: "SEMPRE\njogue 2x", x: -90 - 60 * (1 - ramp(frame, wJogo + 10, wJogo + 25)), r: -12 },
                { t: "NUNCA\njogue 2x", x: 90 + 60 * (1 - ramp(frame, wJogo + 10, wJogo + 25)), r: 12 },
              ].map((card, i) => (
                <g key={i} transform={`translate(${card.x} -150) rotate(${card.r})`}>
                  <rect x={-90} y={-70} width={180} height={140} rx={14} fill="#fff" stroke={C.ink} strokeWidth={5} />
                  {card.t.split("\n").map((ln, k) => (
                    <text key={k} y={-14 + k * 40} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={i ? C.red : "#1d6fd8"}>
                      {ln}
                    </text>
                  ))}
                </g>
              ))}
              {frame > wJogo + 25 && <text x={0} y={-150} textAnchor="middle" fontSize={110} fill={C.yellow} transform={`scale(${pop(frame, wJogo + 25)})`}>⚡</text>}
              <text x={0} y={200} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={42} fill={C.white}>
                contraditórias?
              </text>
            </g>
            {/* algoritmo que termina */}
            <g transform={`translate(960 470) scale(${pop(frame, wAlg - 4)})`}>
              <circle r={150} fill="none" stroke={C.cyan} strokeWidth={14} strokeDasharray="60 22" transform={`rotate(${frame * (frame > wAlg + 50 ? 0 : 6)})`} />
              <path d="M 140 -40 L 170 10 L 112 8 Z" fill={C.cyan} transform={`rotate(${frame * (frame > wAlg + 50 ? 0 : 6)})`} />
              <text y={20} textAnchor="middle" fontFamily="monospace" fontWeight={800} fontSize={44} fill={C.white}>
                {frame > wAlg + 50 ? "FIM ✔" : "loop…"}
              </text>
              <text y={210} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={42} fill={C.white}>
                sempre termina?
              </text>
            </g>
            {/* contrato → rede de regras */}
            <g transform={`translate(1590 470) scale(${pop(frame, wCond - 4)})`}>
              {(() => {
                const m = ramp(frame, wCond + 8, wCond + 40);
                const pts: [number, number][] = [
                  [-120, -110], [40, -150], [140, -40], [-40, -10], [-150, 60], [60, 90], [150, 140], [-60, 160],
                ];
                return (
                  <g>
                    <g opacity={1 - m}>
                      <rect x={-140} y={-180} width={280} height={360} rx={10} fill="#fff" stroke={C.ink} strokeWidth={5} />
                      <text y={-130} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.ink}>
                        CONTRATO
                      </text>
                      {Array.from({ length: 9 }).map((_, i) => (
                        <rect key={i} x={-110} y={-100 + i * 30} width={220 - (i % 3) * 40} height={10} rx={5} fill="#ccd" />
                      ))}
                    </g>
                    <g opacity={m}>
                      {pts.map((a, i) =>
                        pts.slice(i + 1).filter((_, k) => (i + k) % 3 === 0).map((b, k) => <line key={`${i}-${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.yellow} strokeWidth={4} />),
                      )}
                      {pts.map(([x, y], i) => (
                        <g key={i}>
                          <circle cx={x} cy={y} r={26} fill={i === 3 && frame > wImp ? C.red : C.panel} stroke={C.yellow} strokeWidth={5} />
                          <text x={x} y={y + 10} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={26} fill={C.white}>
                            {["se", "e", "ou", "✗", "não", "se", "então", "exceto"][i].slice(0, 3)}
                          </text>
                        </g>
                      ))}
                    </g>
                  </g>
                );
              })()}
              <text y={230} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={42} fill={C.white}>
                {frame > wImp ? "impossível!" : "condições"}
              </text>
            </g>
            <Actor x={1830} y={900} s={0.6}>
              <Person variant="adv" mood={frame > wImp ? "shock" : "serious"} mouth={0} look={[1, -0.5]} />
            </Actor>
          </g>

          {/* ── P2: ninguém sem bolo + vovó ── */}
          <g transform={`translate(${P(2)} 0)`}>
            <rect x={460} y={620} width={1000} height={40} rx={20} fill="#8a5a2b" />
            <Cake x={960} y={620} s={1.3} slices={frame > c.word("s2_d", "ninguém") ? 10 : 0} />
            {Array.from({ length: 10 }).map((_, i) => {
              const ang = Math.PI + (i / 9) * Math.PI;
              const x = 960 + Math.cos(ang) * 620;
              const at = c.word("s2_d", "festa") + i * 2;
              return (
                <g key={i}>
                  <Actor x={x} y={900} s={0.5 + 0.04 * (i % 2)}>
                    <Person variant={i % 4 === 1 ? "kid" : "crowd"} shirt={[C.coral, C.cyan, C.green, C.purple, C.orange][i % 5]} skin={[C.skin1, C.skin2, C.skin3, C.skin4][i % 4]} mood={frame > at ? "happy" : "neutral"} mouth={0} seed={i} armR={frame > at ? 120 : 10} />
                  </Actor>
                  {frame > at && <Cake x={x + 50} y={560} s={0.22 * pop(frame, at)} />}
                </g>
              );
            })}
            <g transform="translate(960 220)">
              <text textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={56} fill={C.yellow} opacity={ramp(frame, c.word("s2_d", "regras"), c.word("s2_d", "regras") + 10)}>
                ∀ convidado, ∃ fatia de bolo
              </text>
            </g>
          </g>

          {/* ── P3: perguntas normais de pessoas normais (e a criança) ── */}
          <g transform={`translate(${P(3)} 0)`}>
            {[
              { v: "pes" as const, q: "E se…?" },
              { v: "avo" as const, q: "quanto de farinha?" },
              { v: "dev" as const, q: "termina?" },
              { v: "kid" as const, q: "posso não arrumar?" },
              { v: "adv" as const, q: "é contraditório?" },
            ].map((p, i) => {
              const x = 240 + i * 360;
              const at = c("s2_e").start + 60 + i * 18;
              return (
                <g key={i}>
                  <Actor x={x} y={900} s={0.85}>
                    <Person variant={p.v} mood={frame > at ? "happy" : "neutral"} mouth={0} seed={i + 3} armR={frame > at ? 130 : 10} />
                  </Actor>
                  {frame > at && (
                    <g transform={`translate(${x} ${p.v === "kid" ? 520 : 400}) scale(${pop(frame, at)})`}>
                      <rect x={-150} y={-60} width={300} height={90} rx={30} fill="#fff" stroke={C.ink} strokeWidth={5} />
                      <text y={0} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={p.q.length > 12 ? 30 : 40} fill={C.ink}>
                        {p.q}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {/* teorema da criança */}
            {frame > c.word("s2_e", "normais", 0) && (
              <g transform={`translate(1500 300) scale(${pop(frame, c.word("s2_e", "normais", 0))}) rotate(4)`}>
                <rect x={-260} y={-90} width={520} height={120} rx={14} fill="#fff6dc" stroke="#c9a96b" strokeWidth={6} />
                <text y={-40} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={30} fill={C.red}>
                  TEOREMA DO QUARTO
                </text>
                <text y={2} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={26} fill={C.ink}>
                  arrumar ⟹ desarrumar ⟹ ∴ ∅
                </text>
              </g>
            )}
          </g>

          {/* ── P4: o tio do churrasco ── */}
          <g transform={`translate(${P(4)} 0)`}>
            <Grill x={560} y={900} s={1.3} />
            <Actor x={880} y={900} s={0.95}>
              <Person
                variant="tio"
                mood={frame > c("s2_h").start ? "shock" : "happy"}
                armR={frame > c("s2_g").start && frame < c("s2_h").start ? 160 : 40}
                look={[1, 0]}
                holdR={frame > c("s2_g").start ? <Trophy x={0} y={30} s={0.6} /> : undefined}
              />
            </Actor>
            {/* gráfico carne × convidados */}
            <g transform="translate(1180 200) scale(0.85)" opacity={ramp(frame, c.word("s2_f", "fórmula"), c.word("s2_f", "fórmula") + 12)}>
              <rect x={-20} y={-40} width={560} height={360} rx={20} fill={C.panel} stroke={C.cyan} strokeWidth={5} />
              <line x1={40} y1={280} x2={500} y2={280} stroke={C.white} strokeWidth={4} />
              <line x1={40} y1={280} x2={40} y2={10} stroke={C.white} strokeWidth={4} />
              <text x={270} y={312} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={24} fill={C.white}>
                convidados
              </text>
              <text x={20} y={0} fontFamily={display} fontWeight={800} fontSize={24} fill={C.white}>
                kg de carne
              </text>
              <path
                d={(() => {
                  const p = lin(frame, c.word("s2_f", "fórmula"), c.word("s2_f", "fórmula") + 50);
                  const pts: string[] = [];
                  for (let i = 0; i <= 40 * p; i++) {
                    const x = 40 + i * 11;
                    const y = 280 - (i < 30 ? i * 6 : 180 + (i - 30) ** 2 * 3);
                    pts.push(`${i === 0 ? "M" : "L"} ${x} ${Math.max(20, y)}`);
                  }
                  return pts.join(" ");
                })()}
                stroke={C.yellow}
                strokeWidth={8}
                fill="none"
              />
              <text x={380} y={60} fontFamily={display} fontWeight={800} fontSize={26} fill={C.coral}>
                + picanha!
              </text>
            </g>
            {frame > c("s2_g").start && (
              <g transform={`translate(560 170) scale(${pop(frame, c("s2_g").start)})`}>
                <rect x={-280} y={-60} width={560} height={110} rx={16} fill={C.yellow} stroke={C.ink} strokeWidth={6} />
                <text y={-10} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={32} fill={C.ink}>
                  CAMPEÃO INTERGALÁCTICO
                </text>
                <text y={30} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={32} fill={C.ink}>
                  DO CHURRASCO
                </text>
              </g>
            )}
            <Actor x={kf(frame, [leanIn, leanIn + 25], [2200, 1180])} y={900} s={0.95} flip>
              <LeanChar tool="magnifier" look={[1, -0.4]} />
            </Actor>
          </g>
        </Stage>
        <Bubble line="s2_g" x={P(4) + 980} y={430} w={560} size={38} />
        <Bubble line="s2_h" x={P(4) + 1180} y={560} w={420} side="right" size={40} color={C.yellow} />
      </Camera>
      {[c("s2_c").start, c("s2_d").start, c("s2_e").start, tioAt].map((f, i) => (
        <Sfx key={i} at={f - 10} name="whoosh" volume={0.35} />
      ))}
      <Sfx at={wJogo + 25} name="zap" volume={0.4} />
      <Sfx at={wAlg + 50} name="ding" volume={0.35} />
      <Sfx at={wImp} name="buzzer" volume={0.3} />
      <Sfx at={c("s2_g").start} name="success" volume={0.35} />
      <Sfx at={leanIn} name="slide-up" volume={0.3} />
      <SceneTag scene="s2" n={2} />
      <SceneFade length={L} inF={6} outF={6} />
    </AbsoluteFill>
  );
};

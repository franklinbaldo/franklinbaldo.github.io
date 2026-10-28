import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Person } from "../chars/Person";
import { Robot } from "../chars/Robot";
import { LeanChar } from "../chars/Lean";
import { C, display } from "../lib/theme";
import { kf, pop, ramp, wobble } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import lean from "../generated/lean.json";
import { Backdrop, Bubble, Camera, CodePanel, PopText, SceneFade, SceneTag, Sfx, Stage, StampMark, Terminal } from "../ui/kit";
import { Coxinha } from "./props";

const c = makeCues("s8");
const SEAT = (i: number) => 330 + i * 115;
const SHIRTS = [C.coral, C.cyan, C.green, C.purple, C.orange, "#e84393", "#0984e3", "#fdcb6e", "#00b894", "#d63031"];
const SKINS = [C.skin1, C.skin2, C.skin3, C.skin4];

const Chair: React.FC<{ x: number; spot?: number }> = ({ x, spot = 0 }) => (
  <g transform={`translate(${x} 0)`}>
    {spot > 0 && <path d={`M -60 0 L -140 820 L 140 820 L 60 0 Z`} fill="#fffbe0" opacity={0.12 * spot} transform="translate(0 0)" />}
    <rect x={-44} y={640} width={88} height={160} rx={12} fill="#8a5a2b" stroke="#4a2e12" strokeWidth={4} />
  </g>
);

const Table: React.FC<{ seats: number; coxinhas: number }> = ({ seats, coxinhas }) => (
  <g>
    <rect x={250} y={740} width={SEAT(seats - 1) - 250 + 80} height={30} rx={8} fill="#f3e2c0" />
    <rect x={260} y={770} width={SEAT(seats - 1) - 260 + 70} height={130} fill="#c0392b" />
    {Array.from({ length: Math.floor((SEAT(seats - 1) - 260 + 70) / 40) }).map((_, i) => (
      <rect key={i} x={260 + i * 40} y={770} width={20} height={130} fill="#e74c3c" opacity={0.6} />
    ))}
    {Array.from({ length: seats }).map((_, i) => (
      <g key={i}>
        <ellipse cx={SEAT(i)} cy={745} rx={46} ry={12} fill="#fff" stroke="#ccc" strokeWidth={3} />
        {Array.from({ length: Math.min(3, Math.max(0, coxinhas - i * 3)) }).map((__, k) => (
          <Coxinha key={k} x={SEAT(i) - 26 + k * 26} y={724} s={0.6} rot={(k - 1) * 10} />
        ))}
      </g>
    ))}
  </g>
);

export const S8: React.FC = () => {
  const frame = useCurrentFrame();
  const L = c.sceneLength;
  const diagram = c("s8_h").start;
  const back = c("s8_j").start - 8;
  const showTable = frame < c("s8_e").start + 20 || (frame >= c("s8_g").start && frame < diagram) || frame >= back;
  const coxCount = Math.floor(kf(frame, [c.word("s8_e", "coxinhas", 0), c.word("s8_e", "coxinhas", 1) + 10], [0, 36]));
  const seats = frame > c("s8_c").end ? 12 : 10;
  const spot = frame > c("s8_g").start ? ramp(frame, c("s8_g").start, c("s8_g").start + 15) : 0;

  const cam: [number, number, number, number][] = [
    [0, 1, 960, 540],
    [c("s8_e").start, 1, 960, 540],
    [c("s8_g").start, 1, 960, 540],
    [c.word("s8_g", "errado") - 10, 1.5, 1500, 620],
    [diagram - 2, 1.5, 1500, 620],
    [back, 1.2, 1300, 620],
  ];

  return (
    <AbsoluteFill>
      <Backdrop tint="#2a1f5e" />
      {showTable && (
        <Camera keys={cam}>
          <Stage>
            {/* bandeirinhas */}
            {Array.from({ length: 24 }).map((_, i) => (
              <path key={i} d={`M ${i * 82} ${120 + Math.sin(i / 2) * 10} l 40 0 l -20 50 Z`} fill={[C.yellow, C.coral, C.cyan, C.green][i % 4]} />
            ))}
            <path d={`M 0 120 ${Array.from({ length: 24 }).map((_, i) => `L ${i * 82 + 40} ${120 + Math.sin(i / 2) * 10}`).join(" ")}`} stroke="#fff" strokeWidth={2} fill="none" />
            {Array.from({ length: seats }).map((_, i) => (
              <Chair key={i} x={SEAT(i)} spot={i >= 10 ? spot : 0} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <Actor key={i} x={SEAT(i)} y={1010} s={0.86}>
                <Person
                  variant={i === 3 ? "avo" : i === 6 ? "tio" : "crowd"}
                  shirt={SHIRTS[i]}
                  skin={SKINS[i % 4]}
                  mood={frame > back ? "shock" : "happy"}
                  mouth={0}
                  seed={i}
                  armR={frame > c("s8_b").start + 20 && frame < c("s8_b").end ? 140 + wobble(frame, 9, 20, i * 3) : 20}
                />
              </Actor>
            ))}
            <g transform="translate(0 90)">
              <Table seats={seats} coxinhas={frame > c("s8_e").start ? 36 : 0} />
            </g>
            {/* robô */}
            {frame > c("s8_c").start - 12 && (
              <Actor
                x={frame < back ? kf(frame, [c("s8_c").start - 12, c("s8_c").start + 4], [2200, 1720]) : kf(frame, [back, back + 30, c.word("s8_j", "doze") - 10, c.word("s8_j", "doze")], [1720, SEAT(10) + 30, SEAT(10) + 30, SEAT(11) + 30])}
                y={640}
                s={0.62}
              >
                <Robot
                  face={frame > c("s8_k").start ? "sad" : frame > back ? "think" : "happy"}
                  gear={["party", "shades", "medals"]}
                  armR={frame > back ? 110 : 60}
                  holdR={frame > back ? <Coxinha x={0} y={10} s={1.4} /> : undefined}
                />
              </Actor>
            )}
          </Stage>
          <Bubble line="s8_c" x={1700} y={300} w={460} side="right" size={40} color={C.cyanSoft} />
          <Bubble line="s8_j" x={SEAT(10)} y={430} w={520} side="right" size={34} color={C.cyanSoft} />
        </Camera>
      )}

      {/* contador de convidados */}
      {frame > c("s8_b").start && frame < c("s8_e").start + 20 && (
        <div style={{ position: "absolute", left: 80, top: 200, display: "flex", gap: 30, transform: `scale(${pop(frame, c("s8_b").start + 10)})`, transformOrigin: "0 0" }}>
          <div style={{ background: C.panel, border: `6px solid ${C.green}`, borderRadius: 24, padding: "10px 28px", fontFamily: display, color: C.white, fontSize: 40, fontWeight: 800 }}>
            na mesa: <span style={{ fontSize: 70, color: C.green }}>10</span>
          </div>
          {frame > c("s8_c").start + 10 && (
            <div style={{ background: C.panel, border: `6px solid ${C.coral}`, borderRadius: 24, padding: "10px 28px", fontFamily: display, color: C.white, fontSize: 40, fontWeight: 800, transform: `scale(${pop(frame, c("s8_c").start + 10)})` }}>
              a IA entendeu: <span style={{ fontSize: 70, color: C.coral }}>12</span>
            </div>
          )}
        </div>
      )}

      {/* a conta perfeita, conferida pelo Lean de verdade */}
      {frame >= c("s8_e").start + 20 && frame < c("s8_g").start && (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {Array.from({ length: 36 }).map((_, i) => {
              if (i >= coxCount) return null;
              return <Coxinha key={i} x={1180 + (i % 9) * 72} y={170 + Math.floor(i / 9) * 80} s={1.2 * pop(frame, c.word("s8_e", "coxinhas", 0) + i * 0.9)} rot={(i * 23) % 30 - 15} />;
            })}
            <text x={1470} y={540} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={72} fill={C.yellow}>
              12 × 3 = {coxCount || "?"}
            </text>
          </svg>
          <CodePanel code={lean["Festa.lean"].code.split("\n").slice(5).join("\n")} x={60} y={120} w={1040} size={27} title="Festa.lean" highlight={[0]} border={frame > c("s8_f").start ? C.green : C.cyan} />
          <Terminal x={60} y={700} w={1040} cmd="lean Festa.lean; echo exit=$?" output={`${lean["Festa.lean"].output}\nexit=${lean["Festa.lean"].exit}`} typeAt={c("s8_e").end - 50} outAt={c("s8_f").start} size={28} />
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <Actor x={1650} y={1050} s={1} flip>
              <LeanChar stamp={frame > c("s8_f").end - 30 && frame < c("s8_f").end - 12 ? ramp(frame, c("s8_f").end - 30, c("s8_f").end - 18) : 0.1} stampInk={C.green} look={[1, -0.3]} />
            </Actor>
          </svg>
          <Bubble line="s8_f" x={1560} y={680} w={520} side="right" size={34} color={C.yellow} />
          <StampMark at={c("s8_f").end - 12} text="MATEMATICAMENTE CORRETO" x={960} y={600} color={C.green} rot={-8} size={84} />
        </AbsoluteFill>
      )}

      {/* lição: onde mora o erro */}
      {frame >= diagram && frame < back && (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {[
              { x: 330, t: "MUNDO REAL", v: "10 pessoas", col: C.white, at: diagram + 4 },
              { x: 960, t: "HIPÓTESE", v: "convidados := 12", col: C.coral, at: c.word("s8_h", "hipóteses") },
              { x: 1590, t: "CONCLUSÃO", v: "36 coxinhas", col: C.green, at: c.word("s8_h", "decorre") },
            ].map((b) => (
              <g key={b.t} transform={`translate(${b.x} 420) scale(${pop(frame, b.at)})`}>
                <rect x={-250} y={-120} width={500} height={240} rx={30} fill={C.panel} stroke={b.col} strokeWidth={7} />
                <text y={-40} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={44} fill={b.col}>
                  {b.t}
                </text>
                <text y={40} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontWeight={700} fontSize={b.v.length > 12 ? 30 : 40} fill={C.white}>
                  {b.v}
                </text>
              </g>
            ))}
            {/* seta mundo → hipótese: precisa de observação */}
            <g opacity={ramp(frame, c.word("s8_h", "hipóteses") + 10, c.word("s8_h", "hipóteses") + 20)}>
              <path d="M 590 420 L 700 420" stroke={C.coral} strokeWidth={10} strokeDasharray="20 12" />
              <path d="M 700 400 L 706 420 L 700 440" stroke={C.coral} strokeWidth={10} fill="none" />
              <text x={645} y={600} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.coral}>
                {frame > c("s8_i").start ? "precisa de observação" : "o erro mora aqui!"}
              </text>
              <text x={645} y={640} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.coral}>
                {frame > c("s8_i").start ? "e evidência" : ""}
              </text>
            </g>
            {/* seta hipótese → conclusão: o Lean confere */}
            <g opacity={ramp(frame, c.word("s8_h", "decorre"), c.word("s8_h", "decorre") + 10)}>
              <path d="M 1220 420 L 1330 420" stroke={C.green} strokeWidth={10} />
              <path d="M 1330 400 L 1336 420 L 1330 440" stroke={C.green} strokeWidth={10} fill="none" />
              <text x={1275} y={600} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.green}>
                Lean confere
              </text>
              <text x={1275} y={640} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.green}>
                esta seta ✔
              </text>
            </g>
          </svg>
          {frame > c.word("s8_i", "transforma") && (
            <PopText at={c.word("s8_i", "transforma")} x={960} y={830} size={50} color={C.yellow} plate>
              prova perfeita ≠ hipótese verdadeira
            </PopText>
          )}
        </AbsoluteFill>
      )}

      <PopText at={c("s8_a").start} until={c("s8_b").start} x={960} y={500} size={140} color={C.coral} rot={-6}>
        PEGADINHA!
      </PopText>
      {frame > c.word("s8_g", "errado") - 6 && frame < diagram && (
        <PopText at={c.word("s8_g", "errado") - 6} until={diagram - 4} x={960} y={150} size={64} color={C.white} plate>
          a resposta certa… para o problema errado
        </PopText>
      )}
      {frame >= back && <StampMark at={c("s8_k").start + 10} text="CONVIDADOS NÃO LOCALIZADOS" x={960} y={300} rot={-6} size={74} />}

      <Sfx at={c("s8_a").start} name="boing" volume={0.5} />
      <Sfx at={c("s8_c").start - 12} name="whoosh" volume={0.4} />
      <Sfx at={c("s8_c").start + 10} name="buzzer" volume={0.25} />
      <Sfx at={c("s8_e").start + 20} name="whoosh" volume={0.35} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Sfx key={i} at={c.word("s8_e", "coxinhas", 0) + i * 6} name="pop" volume={0.25} />
      ))}
      <Sfx at={c("s8_e").end - 50} name="typing" volume={0.4} />
      <Sfx at={c("s8_f").start} name="success" volume={0.4} />
      <Sfx at={c("s8_g").start} name="whoosh" volume={0.35} />
      <Sfx at={c.word("s8_g", "errado")} name="record-scratch" volume={0.35} />
      <Sfx at={diagram} name="whoosh" volume={0.35} />
      <Sfx at={back} name="whoosh" volume={0.35} />
      <SceneTag scene="s8" n={8} />
      <SceneFade length={L} inF={6} outF={6} />
    </AbsoluteFill>
  );
};

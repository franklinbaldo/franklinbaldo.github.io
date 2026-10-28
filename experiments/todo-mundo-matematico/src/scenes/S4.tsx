import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Person } from "../chars/Person";
import { Robot } from "../chars/Robot";
import { LeanChar } from "../chars/Lean";
import { C, body, display } from "../lib/theme";
import { kf, pop, ramp, wobble } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import lean from "../generated/lean.json";
import { Backdrop, Bubble, Camera, CodePanel, Confetti, PopText, SceneFade, SceneTag, Sfx, Stage, StampMark } from "../ui/kit";
import { Sign } from "./props";

const c = makeCues("s4");
const N = 8;
const BX = 520;
const BW = 110;
const BY = 620;
const JUST = ["hipótese", "def.", "lema 1", "Nat.add_comm", "rw", "lema 2", "simp", "∎"];

/** Ponte de blocos lógicos sobre o abismo. */
const Bridge: React.FC<{ builtAt: number[]; hole: number; collapseAt?: number; checks?: number[]; labels?: boolean }> = ({ builtAt, hole, collapseAt, checks = [], labels }) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {Array.from({ length: N }).map((_, i) => {
        if (i === hole) return null;
        const at = builtAt[i] ?? 99999;
        if (frame < at) return null;
        const p = pop(frame, at, 30, 12);
        let dy = (1 - p) * -160;
        let rot = 0;
        if (collapseAt !== undefined && frame > collapseAt + Math.abs(i - hole) * 2) {
          const t = frame - collapseAt - Math.abs(i - hole) * 2;
          dy = 0.9 * t * t;
          rot = t * (i < hole ? -3 : 3);
        }
        const x = BX + i * BW;
        const ok = checks[i] !== undefined && frame > checks[i];
        return (
          <g key={i} transform={`translate(${x + BW / 2} ${BY + 40 + dy}) rotate(${rot})`}>
            <rect x={-BW / 2 + 3} y={-40} width={BW - 6} height={80} rx={12} fill={ok ? C.green : C.cyan} stroke={C.ink} strokeWidth={5} />
            {labels && (
              <text y={8} textAnchor="middle" fontFamily={body} fontWeight={900} fontSize={JUST[i].length > 8 ? 15 : 22} fill={C.ink}>
                {JUST[i]}
              </text>
            )}
            {ok && <path d="M -14 -60 L -4 -50 L 16 -74" transform={`scale(${pop(frame, checks[i])})`} stroke={C.green} strokeWidth={8} fill="none" strokeLinecap="round" />}
          </g>
        );
      })}
    </g>
  );
};

const Cliffs: React.FC = () => (
  <g>
    <path d={`M -400 ${BY} L ${BX} ${BY} L ${BX - 40} 1200 L -400 1200 Z`} fill="#22407e" />
    <path d={`M ${BX + N * BW} ${BY} L 2400 ${BY} L 2400 1200 L ${BX + N * BW + 40} 1200 Z`} fill="#22407e" />
    <rect x={-400} y={BY - 8} width={BX + 400} height={14} fill={C.cyan} opacity={0.5} />
    <rect x={BX + N * BW} y={BY - 8} width={1000} height={14} fill={C.cyan} opacity={0.5} />
    <text x={260} y={BY + 110} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={54} fill={C.white}>
      HIPÓTESES
    </text>
    <text x={1660} y={BY + 110} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={54} fill={C.white}>
      CONCLUSÃO
    </text>
    <text x={1660} y={BY + 170} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={36} fill={C.yellow}>
      a + b = b + a
    </text>
  </g>
);

/** Peça de montar (genérica, sem marca). */
const Brick: React.FC<{ x: number; y: number; w?: number; color: string; label: string; s?: number }> = ({ x, y, w = 200, color, label, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: Math.round(w / 50) }).map((_, i) => (
      <rect key={i} x={-w / 2 + 12 + i * 50} y={-62} width={26} height={16} rx={4} fill={color} stroke={C.ink} strokeWidth={3} />
    ))}
    <rect x={-w / 2} y={-48} width={w} height={70} rx={8} fill={color} stroke={C.ink} strokeWidth={4} />
    <text y={-2} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={26} fill={C.ink}>
      {label}
    </text>
  </g>
);

export const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const L = c.sceneLength;
  const canyon = c("s4_c").start;
  const proper = c("s4_l").start;
  const lib = c("s4_n").start - 10;

  // fases da ponte
  const build1 = Array.from({ length: N }, (_, i) => canyon + 12 + i * 8);
  const obvioIn = c("s4_d").start;
  const collapse1 = c("s4_e").end - 6;
  const rebuild2 = c("s4_f").start - 4;
  const build2 = Array.from({ length: N }, (_, i) => rebuild2 + i * 2);
  const collapse2 = c("s4_h").end - 4;
  const rebuild3 = c("s4_i").start - 4;
  const build3 = Array.from({ length: N }, (_, i) => rebuild3 + i * 2);
  const build4 = Array.from({ length: N }, (_, i) => proper + 10 + i * 12);
  const checks4 = Array.from({ length: N }, (_, i) => proper + 40 + i * 16);

  const phase = frame < canyon ? 0 : frame < lib ? 1 : 2;

  let bridge: React.ReactNode = null;
  let signText = "";
  if (frame < rebuild2) {
    bridge = <Bridge builtAt={build1} hole={4} collapseAt={collapse1} />;
    signText = frame < collapse1 - 8 ? "É ÓBVIO" : "";
  } else if (frame < rebuild3) {
    bridge = <Bridge builtAt={build2} hole={4} collapseAt={collapse2} />;
    signText = frame < c("s4_g").start ? "É EVIDENTE" : frame < collapse2 - 6 ? "CONFIA\nEM MIM" : "";
  } else if (frame < proper) {
    bridge = <Bridge builtAt={build3} hole={4} />;
    signText = frame < c.word("s4_i", "definitivamente") ? "TODO MUNDO\nSABE" : "VI NUM\nVÍDEO";
  } else {
    bridge = <Bridge builtAt={build4} hole={-1} checks={checks4} labels />;
  }
  const signDrop = frame < rebuild2 ? obvioIn : frame < c("s4_g").start ? rebuild2 + 10 : frame < rebuild3 ? c("s4_g").start : frame < c.word("s4_i", "definitivamente") ? rebuild3 + 10 : c.word("s4_i", "definitivamente");
  // Lean arranca o cartaz
  const yank = frame > c("s4_e").start + 8 && frame < rebuild2 ? ramp(frame, c("s4_e").start + 8, c("s4_e").start + 20) : 0;

  const cam: [number, number, number, number][] = [
    [0, 1.0, 960, 540],
    [canyon - 1, 1.0, 960, 540],
    [canyon, 0.95, 960, 560],
    [c("s4_d").start, 1.15, 1010, 560],
    [c("s4_e").end, 1.05, 1010, 600],
    [c("s4_k").start - 4, 1.05, 1010, 580],
    [c("s4_k").start + 6, 1.9, 1460, 520],
    [c("s4_k").end + 10, 1.9, 1460, 520],
    [proper + 10, 0.95, 960, 560],
    [lib - 1, 0.95, 960, 560],
    [lib, 1, 960, 540],
  ];

  const leanTool = frame > c("s4_e").start && frame < rebuild2 ? "none" : "stamp";
  const stampLift = (at: number) => (frame > at - 18 && frame < at ? ramp(frame, at - 18, at - 6) : frame >= at && frame < at + 6 ? 0 : 0);
  const rejects = [c("s4_f").end, c("s4_h").end - 10, c.word("s4_i", "definitivamente") - 6, c("s4_i").end];

  return (
    <AbsoluteFill>
      <Backdrop />
      {phase === 0 && (
        <AbsoluteFill>
          {/* holofote de apresentação */}
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <path d={`M 860 -40 L 1060 -40 L 1300 940 L 620 940 Z`} fill="#fffbe0" opacity={0.08 + 0.04 * Math.sin(frame / 8)} />
            <ellipse cx={960} cy={930} rx={340} ry={50} fill="#fffbe0" opacity={0.15} />
            <Actor x={kf(frame, [0, 14], [1300, 960])} y={930} s={1.5}>
              <LeanChar stamp={frame < c("s4_b").start ? 0.9 : 0.1} mood={frame < c("s4_b").start ? "serious" : "neutral"} look={[0, 0]} />
            </Actor>
          </svg>
          {/* ficha técnica */}
          <div
            style={{
              position: "absolute",
              left: 1290,
              top: 200,
              width: 520,
              transform: `scale(${pop(frame, 20)})`,
              transformOrigin: "0 0",
              background: "#fff",
              border: `6px solid ${C.ink}`,
              borderRadius: 24,
              padding: "22px 28px",
              fontFamily: body,
              fontWeight: 800,
              color: C.ink,
              fontSize: 30,
              lineHeight: 1.35,
              boxShadow: "0 12px 0 rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontFamily: display, fontSize: 64, lineHeight: 1 }}>LEAN</div>
            <div style={{ color: "#5a6a90", marginBottom: 10 }}>Fiscal da Matemática</div>
            <div>✔ aceita: lógica, passo a passo</div>
            <div style={{ color: C.red }}>✘ não aceita: “é óbvio”</div>
            <div style={{ color: C.red }}>✘ não aceita: “confia em mim”</div>
          </div>
          {/* cadeia de passos sendo conferida */}
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {["afirmação", "passo 1", "passo 2", "passo 3", "conclusão"].map((t, i) => {
              const at = c.word("s4_b", "conferir") + i * 14;
              const x = 140 + i * 230;
              if (frame < c.word("s4_b", "afirmações")) return null;
              return (
                <g key={t} transform={`translate(${x} 200) scale(${pop(frame, c.word("s4_b", "afirmações") + i * 6)})`}>
                  {i > 0 && <line x1={-140} y1={0} x2={-92} y2={0} stroke={C.white} strokeWidth={6} />}
                  <rect x={-92} y={-44} width={184} height={88} rx={18} fill={frame > at ? C.green : C.panel} stroke={C.white} strokeWidth={4} />
                  <text y={12} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={30} fill={frame > at ? C.ink : C.white}>
                    {t}
                  </text>
                  {frame > at && <text y={-60} textAnchor="middle" fontSize={44} fill={C.green} fontWeight={900}>✔</text>}
                </g>
              );
            })}
          </svg>
          {Array.from({ length: 5 }).map((_, i) => (
            <Sfx key={i} at={c.word("s4_b", "conferir") + i * 14} name="click" volume={0.35} />
          ))}
        </AbsoluteFill>
      )}

      {phase === 1 && (
        <Camera keys={cam} shakeAt={[[collapse1, 20, 10], [collapse2, 20, 10]]}>
          <Stage>
            <Cliffs />
            {bridge}
            {signText && (
              <g transform={`translate(${BX + 4.5 * BW + yank * 500} ${BY + 50 - (1 - pop(frame, signDrop)) * 300 - yank * 200}) rotate(${yank * 40})`}>
                <Sign x={0} y={0} text={signText} w={260} size={signText.includes("\n") ? 36 : 44} color={signText.includes("VÍDEO") ? "#ffe4e4" : "#fff3c4"} post={false} />
              </g>
            )}
            {/* robô construtor na margem esquerda */}
            <Actor x={kf(frame, [proper, proper + 120], [380, 1300])} y={BY - 10} s={0.75}>
              <Robot
                face={frame > c("s4_m").start ? "star" : frame > c("s4_j").start && frame < proper ? "sad" : frame > c("s4_g").start && frame < c("s4_h").start ? "love" : frame > c("s4_d").start && frame < c("s4_e").start ? "wink" : "happy"}
                gear={["shades", "crown"]}
                armR={frame > c("s4_d").start && frame < c("s4_d").end ? 130 : 40 + wobble(frame, 12, 20)}
              />
            </Actor>
            {/* Lean na margem direita */}
            <Actor x={kf(frame, [c("s4_e").start, c("s4_e").start + 10, rebuild2, rebuild2 + 10], [1560, 1250, 1250, 1560])} y={BY} s={0.9} flip>
              <LeanChar
                tool={leanTool}
                stamp={Math.max(...rejects.map(stampLift), frame > c("s4_m").start - 18 && frame < c("s4_m").start ? ramp(frame, c("s4_m").start - 18, c("s4_m").start - 6) : 0)}
                stampInk={frame > proper ? C.green : C.red}
                mood={frame > c("s4_m").start + 4 ? "happy" : "serious"}
                look={[1, 0.2]}
              />
            </Actor>
            {/* pessoa atravessa a ponte aprovada */}
            {frame > c("s4_m").start + 10 && (
              <Actor x={kf(frame, [c("s4_m").start + 10, lib], [200, 900])} y={BY - Math.abs(Math.sin(frame / 4)) * 10} s={0.62}>
                <Person variant="pes" mood="happy" armR={140} mouth={0} />
              </Actor>
            )}
          </Stage>
          <Bubble line="s4_d" x={480} y={330} w={420} size={38} color={C.cyanSoft} />
          <Bubble line="s4_e" x={1300} y={330} w={420} side="right" size={42} color={C.yellow} />
          <Bubble line="s4_g" x={480} y={330} w={400} size={38} color={C.cyanSoft} />
          <Bubble line="s4_h" x={1560} y={330} w={460} side="right" size={38} color={C.yellow} />
          <Bubble line="s4_j" x={480} y={330} w={440} size={38} color={C.cyanSoft} />
          <Bubble line="s4_k" x={1500} y={430} w={330} side="right" size={44} color={C.yellow} />
        </Camera>
      )}

      {/* código real: "é óbvio" rejeitado, depois a prova de verdade */}
      {frame > c("s4_d").start + 10 && frame < c("s4_f").start && (
        <div style={{ position: "absolute", left: 60, top: 690, opacity: 1 - ramp(frame, c("s4_f").start - 8, c("s4_f").start) }}>
          <CodePanel code={lean["rejeitado/Obvio.lean"].code.split("\n").slice(1).join("\n")} x={0} y={0} w={760} size={24} title="Obvio.lean" border={frame > c("s4_e").start ? C.red : C.cyan} />
          {frame > c("s4_e").start && (
            <div style={{ position: "absolute", left: 800, top: 0, width: 760, transform: `scale(${pop(frame, c("s4_e").start)})`, transformOrigin: "0 0", background: "#2a0710", border: `4px solid ${C.red}`, borderRadius: 18, padding: "12px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: 21, color: "#ffc9cf", whiteSpace: "pre" }}>
              {lean["rejeitado/Obvio.lean"].output.replace("rejeitado/", "").split("\n").slice(0, 5).join("\n")}
            </div>
          )}
        </div>
      )}
      {frame > proper + 20 && frame < lib && (
        <div style={{ position: "absolute", left: 60, top: 60 }}>
          <CodePanel code={lean["Comutativa.lean"].code.split("\n").slice(1, 3).join("\n")} x={0} y={0} w={880} size={24} title="Comutativa.lean  ✔ compilou" border={C.green} />
        </div>
      )}

      {phase === 1 && (
        <>
          <StampMark at={rejects[0]} text="REJEITADO" x={1010} y={420} until={collapse2 - 30} size={80} />
          <StampMark at={rejects[1]} text="REJEITADO" x={1050} y={330} rot={8} until={rebuild3} size={80} />
          <StampMark at={rejects[2]} text="REJEITADO" x={980} y={430} rot={-6} until={c("s4_i").end - 2} size={80} />
          <StampMark at={rejects[3]} text="REJEITADO" x={1030} y={360} rot={10} until={c("s4_j").end} size={80} />
          <StampMark at={c("s4_m").start} text="APROVADO" x={960} y={330} color={C.green} rot={-8} until={lib - 4} size={130} />
          <Confetti at={c("s4_m").start + 4} x={960} y={330} />
        </>
      )}

      {phase === 2 && (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {/* estantes da Mathlib */}
            <g opacity={1 - ramp(frame, c("s4_o").start + 30, c("s4_o").start + 60)} transform={`translate(960 560) scale(${0.85 + 0.15 * ramp(frame, lib, lib + 60)}) translate(-960 -560)`}>
              {Array.from({ length: 4 }).map((_, r) => (
                <g key={r}>
                  <rect x={200} y={330 + r * 150} width={1520} height={16} fill="#6b4520" />
                  {Array.from({ length: 22 }).map((__, k) => {
                    const at = lib + 6 + (r * 22 + k) * 1.2;
                    if (frame < at) return null;
                    const h = 80 + ((r * 7 + k * 13) % 40);
                    return (
                      <g key={k} transform={`translate(${220 + k * 68} ${330 + r * 150 - h})`}>
                        <rect width={56} height={h} rx={6} fill={[C.cyan, C.yellow, C.green, C.coral, C.purple, C.orange][(r + k) % 6]} stroke={C.ink} strokeWidth={3} opacity={0.9} />
                        <text x={28} y={h / 2 + 10} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={24} fill={C.ink}>
                          {["∀", "∃", "ℕ", "ℝ", "∫", "π", "≤", "⊢"][(r + k * 3) % 8]}
                        </text>
                      </g>
                    );
                  })}
                </g>
              ))}
            </g>
            {/* peças de montar se encaixando */}
            {frame > c("s4_o").start + 20 &&
              [
                { l: "definição", col: C.cyan },
                { l: "lema", col: C.yellow },
                { l: "teorema", col: C.green },
                { l: "lema", col: C.coral },
                { l: "definição", col: C.purple },
                { l: "SUA IDEIA", col: C.orange },
              ].map((b, i) => {
                const at = c("s4_o").start + 30 + i * 22;
                const p = pop(frame, at, 30, 14);
                const x = 960 + (i % 2 ? 60 : -60) * (i < 5 ? 1 : 0);
                const y = 900 - i * 72;
                if (frame < at) return null;
                return <Brick key={i} x={x + (1 - p) * (i % 2 ? 700 : -700)} y={y - (1 - p) * 300} w={i === 5 ? 320 : 260} color={b.col} label={b.l} />;
              })}
          </svg>
          {/* gente construindo */}
          {frame > c("s4_p").start && (
            <svg width={1920} height={1080} style={{ position: "absolute" }}>
              {[
                { v: "kid" as const, x: 520 },
                { v: "avo" as const, x: 330 },
                { v: "dev" as const, x: 1420 },
                { v: "tio" as const, x: 1610 },
              ].map((p, i) => (
                <Actor key={i} x={p.x} y={980} s={0.7 * pop(frame, c("s4_p").start + i * 6)}>
                  <Person variant={p.v} mood="happy" armR={130 + wobble(frame, 10, 20, i * 4)} mouth={0} seed={i} />
                </Actor>
              ))}
            </svg>
          )}
          <PopText at={lib + 14} until={c("s4_o").start + 40} x={960} y={110} size={84} color={C.yellow}>
            MATHLIB
          </PopText>
          <PopText at={lib + 30} until={c("s4_o").start + 40} x={960} y={190} size={38} color={C.white} stroke={false}>
            biblioteca colaborativa de matemática formalizada
          </PopText>
          <PopText at={c.word("s4_p", "constrói")} until={L} x={960} y={130} size={92} color={C.yellow} rot={-3}>
            VOCÊ CONSTRÓI!
          </PopText>
          {Array.from({ length: 6 }).map((_, i) => (
            <Sfx key={i} at={c("s4_o").start + 30 + i * 22 + 6} name="click" volume={0.45} />
          ))}
        </AbsoluteFill>
      )}

      <Sfx at={canyon} name="whoosh" volume={0.4} />
      {build1.map((f, i) => (i % 2 ? null : <Sfx key={i} at={f} name="pop" volume={0.2} />))}
      <Sfx at={obvioIn} name="boing" volume={0.4} />
      <Sfx at={collapse1} name="collapse" volume={0.6} />
      <Sfx at={c("s4_e").start + 4} name="buzzer" volume={0.35} />
      <Sfx at={collapse2} name="collapse" volume={0.5} />
      <Sfx at={c("s4_m").start + 2} name="success" volume={0.5} />
      {checks4.map((f, i) => (
        <Sfx key={`c${i}`} at={f} name="click" volume={0.3} />
      ))}
      <Sfx at={lib} name="whoosh" volume={0.4} />
      <SceneTag scene="s4" n={4} />
      <SceneFade length={L} inF={6} outF={6} />
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Robot } from "../chars/Robot";
import { LeanChar } from "../chars/Lean";
import { C, body, display } from "../lib/theme";
import { kf, pop, ramp, wobble } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import lean from "../generated/lean.json";
import { Backdrop, Bubble, CodePanel, Confetti, PopText, SceneFade, SceneTag, Sfx, StampMark, Terminal } from "../ui/kit";
import { Ball } from "./props";

const c = makeCues("s5");
const CODE = lean["ParMaisDois.lean"].code.split("\n").slice(6).join("\n");

/** Um par: cápsula com duas bolinhas. */
const Pair: React.FC<{ x: number; y: number; s?: number; color?: string; glow?: boolean }> = ({ x, y, s = 1, color = C.cyan, glow }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-62} y={-36} width={124} height={72} rx={36} fill="rgba(255,255,255,0.08)" stroke={glow ? C.yellow : "rgba(255,255,255,0.5)"} strokeWidth={4} />
    <Ball x={-28} y={0} r={26} color={color} face="happy" />
    <Ball x={28} y={0} r={26} color={color} face="happy" />
  </g>
);

const Brace: React.FC<{ x0: number; x1: number; y: number; label: string; color?: string; o?: number }> = ({ x0, x1, y, label, color = C.yellow, o = 1 }) => {
  const m = (x0 + x1) / 2;
  return (
    <g opacity={o}>
      <path d={`M ${x0} ${y} Q ${x0} ${y + 24} ${x0 + 30} ${y + 24} L ${m - 20} ${y + 24} Q ${m} ${y + 24} ${m} ${y + 48} Q ${m} ${y + 24} ${m + 20} ${y + 24} L ${x1 - 30} ${y + 24} Q ${x1} ${y + 24} ${x1} ${y}`} stroke={color} strokeWidth={6} fill="none" />
      <text x={m} y={y + 100} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={52} fill={color}>
        {label}
      </text>
    </g>
  );
};

export const S5: React.FC = () => {
  const frame = useCurrentFrame();
  const L = c.sceneLength;
  const ex = [c("s5_c").start, c("s5_d").start, c("s5_e").start];
  const general = c("s5_i").start;
  const morePair = c.word("s5_i", "acrescente");
  const lonely = c.word("s5_i", "nenhuma");
  const billions = c.word("s5_j", "bilhões");
  const codeAt = c("s5_k").start + 20;
  const termAt = c("s5_m").start;
  const verdict = c("s5_n").start;
  const compare = c("s5_o").start;

  // fase 1: exemplos (quantos pares estão na mesa)
  const pairsShown = frame < ex[0] ? 1 : frame < ex[1] ? 2 : frame < ex[2] ? 3 : 4;
  const showExamples = frame >= c("s5_b").start && frame < c("s5_h").start + 10;
  const showGeneral = frame >= c("s5_h").start + 10 && frame < codeAt - 10;
  const showCode = frame >= codeAt - 10 && frame < compare;

  return (
    <AbsoluteFill>
      <Backdrop density={18} />

      {/* enunciado no "quadro" */}
      {frame < codeAt - 10 && (
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 110,
            transform: `translate(-50%, 0) scale(${pop(frame, c("s5_b").start)})`,
            background: "#123b2a",
            border: "10px solid #8a5a2b",
            borderRadius: 16,
            padding: "14px 46px",
            fontFamily: display,
            fontWeight: 800,
            fontSize: 64,
            color: "#f4f4e8",
            whiteSpace: "nowrap",
          }}
        >
          par <span style={{ color: C.yellow }}>+ 2</span> = par <span style={{ fontSize: 40, color: "#b8d8c8" }}>(sempre?)</span>
        </div>
      )}

      {showExamples && (
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          {Array.from({ length: pairsShown }).map((_, i) => {
            const at = i === 0 ? c("s5_b").start + 20 : ex[i - 1] + 12;
            const p = pop(frame, at, 30, 12);
            return <Pair key={i} x={360 + i * 150} y={520 - (1 - p) * 320} glow={i === pairsShown - 1 && frame > at && frame < at + 30} />;
          })}
          <text x={360 + (pairsShown - 1) * 75} y={640} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={60} fill={C.white}>
            {pairsShown * 2} bolinhas
          </text>
          {/* testes à direita */}
          {["2 + 2 = 4", "4 + 2 = 6", "6 + 2 = 8"].map((t, i) =>
            frame > ex[i] ? (
              <g key={t} transform={`translate(1380 ${330 + i * 110}) scale(${pop(frame, ex[i])})`}>
                <rect x={-230} y={-46} width={460} height={92} rx={20} fill={C.panel} stroke={C.cyan} strokeWidth={4} />
                <text x={-40} y={18} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={52} fill={C.white}>
                  {t}
                </text>
                <text x={170} y={20} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={40} fill={C.green}>
                  par ✔
                </text>
              </g>
            ) : null,
          )}
          {frame > c("s5_g").start && (
            <g opacity={ramp(frame, c("s5_g").start, c("s5_g").start + 10)}>
              <text x={1380} y={700} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={44} fill={C.coral}>
                3 testes ≠ todos os números
              </text>
              {/* reta numérica infinita */}
              {Array.from({ length: 9 }).map((_, i) => {
                const n = [10, 12, 14, 100, 1000, 9998, 123456, 10 ** 6, 10 ** 9][i];
                const x = 760 + i * 210 - ((frame - c("s5_g").start) * 3) % 210;
                return (
                  <g key={i} transform={`translate(${x} 880)`}>
                    <circle r={10} fill={C.white} />
                    <text y={-26} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={26} fill={C.white}>
                      {n.toLocaleString("pt-BR")}
                    </text>
                    <text y={60} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={44} fill={C.yellow}>
                      ?
                    </text>
                  </g>
                );
              })}
              <line x1={0} y1={880} x2={1920} y2={880} stroke={C.white} strokeWidth={4} />
            </g>
          )}
        </svg>
      )}

      {/* a IA comemora; Lean contesta */}
      {frame > c("s5_f").start - 10 && frame < c("s5_h").start + 10 && (
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <Actor x={kf(frame, [c("s5_f").start - 10, c("s5_f").start + 4], [2200, 1660])} y={760} s={0.8}>
            <Robot face={frame > c("s5_g").start ? "sad" : "star"} gear={["shades", "crown", "trophy", "medals"]} armR={frame < c("s5_g").start ? 150 : 40} />
          </Actor>
          <Actor x={kf(frame, [c("s5_g").start - 12, c("s5_g").start], [-300, 260])} y={1000} s={1}>
            <LeanChar stamp={0.3} look={[1, -0.3]} />
          </Actor>
        </svg>
      )}
      <Bubble line="s5_f" x={1700} y={420} w={480} side="right" size={38} color={C.cyanSoft} />
      <Bubble line="s5_g" x={280} y={680} w={560} size={36} color={C.yellow} />

      {/* explicação geral */}
      {showGeneral && (
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <text x={960} y={300} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={58} fill={C.yellow} opacity={ramp(frame, c.word("s5_h", "explicação"), c.word("s5_h", "explicação") + 10)}>
            explicação geral
          </text>
          {frame < billions - 10 ? (
            <g>
              {/* k pares (com reticências) */}
              {[0, 1, 2].map((i) => (
                <Pair key={i} x={360 + i * 150} y={520} s={pop(frame, general + i * 6)} />
              ))}
              <text x={790} y={540} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={80} fill={C.white} opacity={ramp(frame, general + 20, general + 30)}>
                …
              </text>
              <Pair x={940} y={520} s={pop(frame, general + 24)} />
              <Brace x0={290} x1={1010} y={580} label="n = k pares" o={ramp(frame, general + 30, general + 45)} />
              {/* mais um par */}
              {frame > morePair && <Pair x={kf(frame, [morePair, morePair + 20], [1700, 1110])} y={520} color={C.yellow} glow />}
              {frame > morePair + 20 && <Brace x0={290} x1={1180} y={690} label="n + 2 = k + 1 pares" color={C.green} o={ramp(frame, morePair + 20, morePair + 34)} />}
              {/* bolinha solitária: não existe */}
              {frame > lonely && (
                <g transform={`translate(1450 ${400 + wobble(frame, 30, 10)}) scale(${pop(frame, lonely)})`}>
                  <Ball x={0} y={0} r={34} color={C.coral} face="sad" />
                  <line x1={-60} y1={-60} x2={60} y2={60} stroke={C.red} strokeWidth={12} />
                  <line x1={60} y1={-60} x2={-60} y2={60} stroke={C.red} strokeWidth={12} />
                  <text y={-80} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={40} fill={C.coral}>
                    sobra: 0
                  </text>
                </g>
              )}
            </g>
          ) : (
            <g>
              {/* bilhões de pares */}
              {(() => {
                const z = kf(frame, [billions - 10, billions + 50], [1, 0.08]);
                const cols = 60;
                const rows = 34;
                return (
                  <g transform={`translate(960 600) scale(${z})`}>
                    {Array.from({ length: rows }).map((_, r) =>
                      Array.from({ length: cols }).map((__, k) => {
                        const d = Math.abs(r - rows / 2) + Math.abs(k - cols / 2);
                        if (d * 0.8 > (frame - billions + 10) * 1.6 && d > 2) return null;
                        return <Pair key={`${r}-${k}`} x={(k - cols / 2) * 150} y={(r - rows / 2) * 90} color={(r + k) % 5 === 0 ? C.yellow : C.cyan} />;
                      }),
                    )}
                  </g>
                );
              })()}
              <g transform="translate(960 230)">
                <rect x={-520} y={-70} width={1040} height={120} rx={30} fill="rgba(7,19,48,0.85)" stroke={C.cyan} strokeWidth={5} />
                <text y={18} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={70} fill={C.white}>
                  {Math.round(kf(frame, [billions - 10, billions + 50], [4, 4e9], (t) => t ** 4)).toLocaleString("pt-BR")} bolinhas
                </text>
              </g>
              <text x={960} y={980} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={48} fill={C.green}>
                sobra: 0 · ainda é par ✔
              </text>
            </g>
          )}
        </svg>
      )}

      {/* o código Lean real */}
      {showCode && (
        <AbsoluteFill style={{ opacity: ramp(frame, codeAt - 10, codeAt + 5) }}>
          <CodePanel
            code={CODE}
            x={kf(frame, [termAt - 10, termAt + 10], [250, 60])}
            y={60}
            w={1420}
            size={26}
            title="ParMaisDois.lean"
            reveal={ramp(frame, codeAt, codeAt + 40)}
            highlight={
              frame > c.word("s5_l", "usar")
                ? [6, 7]
                : frame > c.word("s5_l", "mostramos")
                  ? [4]
                  : frame > c.word("s5_l", "definimos")
                    ? [1]
                    : []
            }
            border={frame > verdict ? C.green : C.cyan}
          />
          {frame > termAt && (
            <Terminal
              x={kf(frame, [termAt - 10, termAt + 10], [250, 60])}
              y={720}
              w={1100}
              cmd="lean ParMaisDois.lean; echo exit=$?"
              output={`${lean["ParMaisDois.lean"].output}\nexit=${lean["ParMaisDois.lean"].exit}`}
              typeAt={termAt + 10}
              outAt={verdict}
              size={30}
            />
          )}
          {frame > termAt && (
            <svg width={1920} height={1080} style={{ position: "absolute" }}>
              <Actor x={1700} y={1040} s={1.05} flip>
                <LeanChar stamp={frame > verdict - 18 && frame < verdict ? ramp(frame, verdict - 18, verdict - 6) : 0.1} stampInk={C.green} mood={frame > verdict + 4 ? "happy" : "serious"} look={[1, -0.3]} />
              </Actor>
            </svg>
          )}
          <div style={{ position: "absolute", left: 1210, top: 735, fontFamily: body, fontWeight: 900, fontSize: 26, color: "#9fb3d1", width: 330, opacity: frame > verdict + 30 ? 1 : 0 }}>
            saída real do Lean {lean.version.split(",")[0].replace("Lean (version ", "")}
          </div>
        </AbsoluteFill>
      )}
      {frame > verdict && frame < compare && (
        <>
          <StampMark at={verdict} text="VERIFICADO" x={1150} y={420} color={C.green} rot={-10} size={110} until={compare} />
          <Confetti at={verdict + 3} x={1150} y={420} n={110} />
        </>
      )}
      <Bubble line="s5_n" x={1640} y={640} w={520} side="right" size={34} color={C.yellow} />

      {/* comparação final */}
      {frame >= compare && (
        <AbsoluteFill style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 70 }}>
          {[
            { t: "IA sozinha", s: "“parece certo”", col: C.coral, at: compare + 10, icon: "?" },
            { t: "IA + Lean", s: "estrutura da prova conferida", col: C.green, at: c.word("s5_o", "ferramenta"), icon: "✔" },
          ].map((k) => (
            <div
              key={k.t}
              style={{
                width: 640,
                height: 520,
                transform: `scale(${pop(frame, k.at)})`,
                background: C.panel,
                border: `8px solid ${k.col}`,
                borderRadius: 40,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: display,
                color: C.white,
                textAlign: "center",
                padding: 30,
              }}
            >
              <div style={{ fontSize: 200, lineHeight: 1, color: k.col, fontWeight: 800 }}>{k.icon}</div>
              <div style={{ fontSize: 70, fontWeight: 800 }}>{k.t}</div>
              <div style={{ fontSize: 44, fontWeight: 600, color: "#c9d6ea" }}>{k.s}</div>
            </div>
          ))}
        </AbsoluteFill>
      )}

      <PopText at={c("s5_a").start} until={c("s5_b").start} x={960} y={540} size={120} color={C.yellow} rot={-4}>
        VAMOS EXPERIMENTAR!
      </PopText>

      {ex.map((f, i) => (
        <Sfx key={i} at={f + 12} name="pop" volume={0.4} />
      ))}
      {ex.map((f, i) => (
        <Sfx key={`d${i}`} at={f + 30} name="ding" volume={0.25} />
      ))}
      <Sfx at={c("s5_f").start - 10} name="whoosh" volume={0.4} />
      <Sfx at={c("s5_g").start - 12} name="record-scratch" volume={0.4} />
      <Sfx at={morePair} name="whoosh" volume={0.35} />
      <Sfx at={lonely} name="buzzer" volume={0.25} />
      <Sfx at={billions - 8} name="slide-up" volume={0.4} />
      <Sfx at={termAt + 10} name="typing" volume={0.45} />
      <Sfx at={verdict + 2} name="success" volume={0.5} />
      <SceneTag scene="s5" n={5} />
      <SceneFade length={L} inF={6} outF={6} />
    </AbsoluteFill>
  );
};

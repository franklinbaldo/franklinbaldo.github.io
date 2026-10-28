import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Mathematician } from "../chars/Mathematician";
import { Robot } from "../chars/Robot";
import { LeanChar } from "../chars/Lean";
import { C, display } from "../lib/theme";
import { kf, pop, ramp } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import { Backdrop, Bubble, Camera, PopText, SceneFade, SceneTag, Sfx, Stage } from "../ui/kit";

const c = makeCues("s7");

const BUILDINGS = [
  { x: 110, w: 180, h: 420, word: "leis", icon: "§", label: "leis" },
  { x: 330, w: 150, h: 560, word: "administrativas", icon: "☰", label: "regras" },
  { x: 520, w: 210, h: 360, word: "programas", icon: "{ }", label: "programas" },
  { x: 780, w: 170, h: 640, word: "votação", icon: "☑", label: "votação" },
  { x: 1000, w: 230, h: 470, word: "jogos", icon: "⚄", label: "jogos" },
  { x: 1280, w: 160, h: 600, word: "teorias", icon: "⚛", label: "ciência" },
  { x: 1490, w: 200, h: 400, word: "", icon: "", label: "" },
  { x: 1740, w: 170, h: 520, word: "", icon: "", label: "" },
];

export const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const L = c.sceneLength;
  const wave = c("s7_c").end - 20;
  const waveX = kf(frame, [wave, wave + 50], [-200, 2200]);
  const lights = c.word("s7_g", "investigar");
  const faint = c("s7_h").end - 4;

  const cam: [number, number, number, number][] = [
    [0, 2.4, 960, 900],
    [c("s7_a").end, 0.95, 960, 560],
    [c("s7_e").start, 0.95, 960, 560],
    [c("s7_h").start - 10, 0.95, 960, 560],
    [c("s7_h").start + 4, 1.6, 1600, 420],
  ];

  return (
    <AbsoluteFill>
      <Backdrop glyphs={false} tint="#162a63" />
      <Camera keys={cam}>
        <Stage>
          {/* estrelas */}
          {Array.from({ length: 70 }).map((_, i) => (
            <circle key={i} cx={(i * 283) % 1920} cy={(i * 131) % 420} r={1.5 + (i % 3)} fill="#fff" opacity={0.3 + 0.3 * Math.sin(frame / 10 + i)} />
          ))}
          {/* prédios */}
          {BUILDINGS.map((b, i) => {
            const top = 1000 - b.h;
            const formal = frame > wave + ((b.x + b.w / 2 + 200) / 2400) * 50;
            const at = b.word ? c.word("s7_b", b.word) : 99999;
            return (
              <g key={i}>
                <rect x={b.x} y={top} width={b.w} height={b.h} fill={formal ? "#0e2a5c" : "#1b2c55"} stroke={formal ? C.cyan : "#26386a"} strokeWidth={formal ? 4 : 2} />
                {Array.from({ length: Math.floor(b.h / 60) }).map((_, r) =>
                  Array.from({ length: Math.floor(b.w / 50) }).map((__, k) => {
                    const lit = (r * 7 + k * 3 + i) % 4 !== 0 || (frame > lights && (r + k + i) % 2 === 0);
                    return <rect key={`${r}-${k}`} x={b.x + 14 + k * 50} y={top + 20 + r * 60} width={26} height={32} rx={3} fill={lit ? (formal ? C.cyan : C.yellow) : "#0b1430"} opacity={lit ? (formal ? 0.7 : 0.85) : 1} />;
                  }),
                )}
                {/* grade de "formalização" */}
                {formal &&
                  Array.from({ length: 4 }).map((_, k) => (
                    <line key={k} x1={b.x} y1={top + (b.h * (k + 1)) / 5} x2={b.x + b.w} y2={top + (b.h * (k + 1)) / 5} stroke={C.cyan} strokeWidth={2} opacity={0.6} />
                  ))}
                {/* ícone e rede de regras */}
                {frame > at && (
                  <g transform={`translate(${b.x + b.w / 2} ${top - 90}) scale(${pop(frame, at)})`}>
                    {[-1, 0, 1].map((k) => (
                      <line key={k} x1={0} y1={0} x2={k * 70} y2={-90 - Math.abs(k) * 10} stroke={C.yellow} strokeWidth={4} opacity={0.7} />
                    ))}
                    {[-1, 0, 1].map((k) => (
                      <circle key={`n${k}`} cx={k * 70} cy={-90 - Math.abs(k) * 10} r={12} fill={C.yellow} />
                    ))}
                    <circle r={58} fill={C.panel} stroke={C.yellow} strokeWidth={6} />
                    <text y={20} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={b.icon.length > 1 ? 42 : 60} fill={C.white}>
                      {b.icon}
                    </text>
                    <text y={100} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.white} stroke={C.ink} strokeWidth={6} paintOrder="stroke">
                      {b.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {/* casa de onde saímos */}
          <g transform="translate(960 1000) scale(1.3)">
            <rect x={-90} y={-130} width={180} height={130} fill="#8a5a2b" />
            <path d="M -110 -130 L 0 -210 L 110 -130 Z" fill="#c0392b" />
            <rect x={-25} y={-70} width={50} height={70} fill="#4a2e12" />
            <rect x={40} y={-110} width={36} height={36} fill={C.yellow} />
          </g>
          {/* luzinhas: milhares de novos matemáticos */}
          {frame > lights &&
            Array.from({ length: 260 }).map((_, i) => {
              const at = lights + (i % 60);
              if (frame < at) return null;
              return <circle key={i} cx={(i * 137.5) % 1920} cy={1000 - ((i * 59) % 600)} r={4 + (i % 3)} fill={C.yellow} opacity={0.5 + 0.5 * Math.sin(frame / 5 + i)} />;
            })}
          {/* onda de formalização */}
          {frame > wave && frame < wave + 60 && (
            <g opacity={1 - ramp(frame, wave + 40, wave + 60)}>
              <rect x={waveX - 160} y={0} width={160} height={1080} fill={C.cyan} opacity={0.18} />
              <rect x={waveX - 8} y={0} width={16} height={1080} fill={C.cyan} opacity={0.8} />
              {Array.from({ length: 10 }).map((_, k) => (
                <text key={k} x={waveX - 60} y={100 + k * 100} fontFamily={display} fontWeight={800} fontSize={40} fill={C.white}>
                  {["∀", "→", "∧", "⊢", "∃"][k % 5]}
                </text>
              ))}
            </g>
          )}
          <rect x={-500} y={1000} width={3000} height={300} fill="#0b1638" />
          {/* o matemático no telhado */}
          {frame > c("s7_h").start - 20 && (
            <Actor x={1590} y={kf(frame, [faint, faint + 20], [600, 1300], undefined)} s={0.75} rot={kf(frame, [faint, faint + 20], [0, -120])}>
              <Mathematician mood={frame > faint ? "dizzy" : "shock"} armR={frame < faint ? 150 : 40} armL={frame < faint ? -150 : 10} sweat look={[0, -0.2]} />
            </Actor>
          )}
        </Stage>
        <Bubble line="s7_h" x={1530} y={310} w={460} side="right" size={34} />
      </Camera>

      {/* três perguntas formais */}
      {frame > c("s7_c").start && frame < wave + 30 && (
        <AbsoluteFill style={{ opacity: 1 - ramp(frame, wave + 10, wave + 30) }}>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {/* máquina de estados: o estado proibido nunca é alcançado */}
            <g transform={`translate(520 300) scale(${pop(frame, c("s7_c").start)})`}>
              <rect x={-380} y={-200} width={760} height={400} rx={30} fill="rgba(7,19,48,0.92)" stroke={C.cyan} strokeWidth={5} />
              {[
                [-250, 40, "início"],
                [-40, -80, "A"],
                [-40, 120, "B"],
                [190, 40, "fim"],
              ].map(([x, y, t], i) => (
                <g key={i}>
                  <circle cx={x as number} cy={y as number} r={48} fill={C.panel} stroke={C.green} strokeWidth={5} />
                  <text x={x as number} y={(y as number) + 12} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={30} fill={C.white}>
                    {t}
                  </text>
                </g>
              ))}
              <path d="M -205 20 L -85 -60 M 5 -80 L 145 20 M -205 60 L -85 110 M 5 110 L 145 60" stroke={C.green} strokeWidth={5} />
              <circle cx={290} cy={-110} r={50} fill="#3a0a14" stroke={C.red} strokeWidth={6} strokeDasharray="10 8" />
              <text x={290} y={-98} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={40} fill={C.red}>
                ✘
              </text>
              <text x={0} y={-150} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.white}>
                estado proibido: nunca alcançado
              </text>
              {/* bolinha percorrendo o caminho */}
              {(() => {
                const t = ((frame - c("s7_c").start) % 60) / 60;
                const pts = [[-250, 40], [-40, -80], [190, 40]];
                const seg = t < 0.5 ? 0 : 1;
                const u = (t - seg * 0.5) * 2;
                const x = pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * u;
                const y = pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * u;
                return <circle cx={x} cy={y} r={14} fill={C.yellow} />;
              })()}
            </g>
            {/* duas regras se contradizem? */}
            <g transform={`translate(1400 300) scale(${pop(frame, c.word("s7_c", "duas"))})`}>
              <rect x={-380} y={-200} width={760} height={400} rx={30} fill="rgba(7,19,48,0.92)" stroke={C.coral} strokeWidth={5} />
              {[
                { t: "Regra 1: entrar às 8h", x: -170 + ramp(frame, c.word("s7_c", "juntas"), c.word("s7_c", "juntas") + 15) * 60, col: "#1d6fd8" },
                { t: "Regra 2: sair às 7h", x: 170 - ramp(frame, c.word("s7_c", "juntas"), c.word("s7_c", "juntas") + 15) * 60, col: C.red },
              ].map((r, i) => (
                <g key={i} transform={`translate(${r.x} 20) rotate(${i ? 6 : -6})`}>
                  <rect x={-150} y={-60} width={300} height={120} rx={16} fill="#fff" stroke={C.ink} strokeWidth={5} />
                  <text y={10} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={28} fill={r.col}>
                    {r.t}
                  </text>
                </g>
              ))}
              <text x={0} y={-140} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.white}>
                juntas, se contradizem?
              </text>
              {frame > c.word("s7_c", "contradizem") && (
                <text x={0} y={30} textAnchor="middle" fontSize={120} fill={C.yellow} transform={`scale(${pop(frame, c.word("s7_c", "contradizem"))})`}>
                  ⚡
                </text>
              )}
            </g>
          </svg>
        </AbsoluteFill>
      )}

      {/* IA: "Ainda!" — Lean não aprova */}
      {frame > c("s7_f").start - 8 && frame < c("s7_g").start + 30 && (
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <Actor x={1700} y={kf(frame, [c("s7_f").start - 8, c("s7_f").start + 4, c("s7_g").start + 10, c("s7_g").start + 30], [1500, 1050, 1050, 1500])} s={0.9}>
            <Robot face="wink" gear={["shades", "crown", "medals", "cape"]} armR={150} />
          </Actor>
          <Actor x={220} y={kf(frame, [c("s7_f").end, c("s7_f").end + 10, c("s7_g").start + 10, c("s7_g").start + 30], [1500, 1080, 1080, 1500])} s={1.2}>
            <LeanChar mood="angry" look={[1, -0.2]} stamp={0.5} />
          </Actor>
        </svg>
      )}
      <Bubble line="s7_f" x={1660} y={560} w={300} side="right" size={60} color={C.cyanSoft} shout />

      <PopText at={c.word("s7_g", "investigar")} until={c("s7_g").end + 10} x={960} y={150} size={64} color={C.yellow}>
        perguntas que ninguém sabia formalizar
      </PopText>
      {frame > faint + 16 && frame < L && (
        <div style={{ position: "absolute", right: 90, top: 470, fontFamily: display, fontWeight: 800, fontSize: 48, color: C.coral, rotate: "-6deg" }}>
          desmaio nº 2
        </div>
      )}
      {BUILDINGS.filter((b) => b.word).map((b) => (
        <Sfx key={b.word} at={c.word("s7_b", b.word)} name="pop" volume={0.3} />
      ))}
      <Sfx at={2} name="whoosh" volume={0.4} />
      <Sfx at={wave} name="whoosh" volume={0.5} />
      <Sfx at={wave + 10} name="sparkle" volume={0.4} />
      <Sfx at={c.word("s7_c", "contradizem")} name="zap" volume={0.35} />
      <Sfx at={lights} name="sparkle" volume={0.4} />
      <Sfx at={faint} name="slide-down" volume={0.5} />
      <Sfx at={faint + 22} name="boing" volume={0.5} />
      <SceneTag scene="s7" n={7} />
      <SceneFade length={L} inF={6} outF={6} />
    </AbsoluteFill>
  );
};

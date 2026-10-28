import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Mathematician } from "../chars/Mathematician";
import { Person } from "../chars/Person";
import { Robot } from "../chars/Robot";
import { C, display } from "../lib/theme";
import { kf, pop, ramp, wobble } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import { Backdrop, Bubble, Camera, Confetti, Flash, PopText, SceneFade, SceneTag, Sfx, Stage } from "../ui/kit";
import { Bulb, Dust, Fortress, Ground, Machine, Sign } from "./props";

const c = makeCues("s1");

const SHIRTS = ["#00b894", "#e17055", "#0984e3", "#fdcb6e", "#6c5ce7", "#d63031", "#00cec9", "#e84393", "#55efc4", "#fab1a0", "#74b9ff", "#a29bfe", "#ffeaa7", "#81ecec"];
const SKINS = [C.skin1, C.skin2, C.skin3, C.skin4];
const HAIRS = ["#2d1b10", "#5a3416", "#111", "#c0392b", "#e0c068", "#7a5230"];

export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const L = c.sceneLength;
  const machineIn = c("s1_g").start - 30;
  const impact = c("s1_g").end + 46;
  const machineX = kf(frame, [machineIn, impact - 4, impact, impact + 8], [-1100, 300, 410, 380]);
  const gate = kf(frame, [impact, impact + 14], [0, 1]);
  const faintAt = c("s1_j").end - 6;
  const rumble = c("s1_f").start + 10;

  // fila de gente comum
  const queue = Array.from({ length: 6 }).map((_, i) => ({ x: 690 - i * 135, i }));
  const scared = (x: number) => frame > machineIn + 20 && frame < impact + 30 ? Math.max(0, Math.sin(Math.max(0, frame - (machineIn + 20 + x * 0.02)) / 5)) * 90 : 0;

  // invasão: multidão correndo para dentro
  const floodStart = c("s1_h").start - 10;
  const crowd = Array.from({ length: 22 }).map((_, i) => {
    const t0 = floodStart + i * 9;
    const x = -300 - (i % 5) * 120 + (frame - t0) * (9 + (i % 4));
    return { i, x, t0 };
  });

  const matMood = frame > c("s1_j").start ? "dizzy" : frame > impact ? "shock" : frame > c("s1_e").start ? "angry" : frame > rumble ? "shock" : "smug";
  const matRot = kf(frame, [faintAt, faintAt + 14], [0, -88], undefined);
  const matJump = frame > impact - 6 && frame < impact + 40 ? Math.sin(((frame - impact + 6) / 46) * Math.PI) * 220 : 0;

  const camKeys: [number, number, number, number][] = [
    [0, 1.35, 1200, 260],
    [c("s1_a").end, 0.78, 1050, 560],
    [c("s1_b").start + 20, 0.78, 1050, 560],
    [c.word("s1_b", "portaria") - 10, 1.45, 1000, 690],
    [c("s1_c").start + 30, 1.25, 900, 650],
    [c("s1_c").end, 1.0, 560, 640],
    [c("s1_d").start, 1.55, 900, 690],
    [c("s1_e").end, 1.55, 900, 690],
    [rumble + 10, 0.9, 700, 600],
    [machineIn + 30, 0.72, 400, 560],
    [impact - 10, 0.72, 760, 560],
    [impact + 40, 0.8, 1000, 560],
    [c("s1_h").end, 0.8, 1000, 560],
    [c("s1_i").start, 0.75, 1100, 560],
    [c("s1_j").start - 10, 1.5, 980, 640],
  ];

  return (
    <AbsoluteFill>
      <Backdrop />
      <Camera keys={camKeys} shakeAt={[[rumble, 70, 6], [machineIn + 20, 80, 5], [impact, 40, 26]]}>
        <Stage>
          {/* estrelas e lua */}
          <circle cx={300} cy={160} r={70} fill="#fff6c9" opacity={0.9} />
          <circle cx={330} cy={145} r={66} fill={C.navy} opacity={0.0} />
          <Ground />
          <Fortress gate={gate} />
          <Sign x={930} y={560} text={"PORTARIA"} w={200} size={32} post={false} />
          <Sign x={1460} y={720} text={"SÓ COM\nDOUTORADO"} w={230} size={32} rot={-4} post={false} />
          <Dust at={impact} x={1200} y={900} n={16} size={1.6} />
          <Dust at={machineIn + 10} x={-300} y={900} n={10} />

          {/* máquina da IA */}
          <Actor x={machineX} y={905} s={1}>
            <Machine ram={frame > impact - 4 && frame < impact + 6 ? 1 : 0}>
              <Actor x={0} y={30} s={0.62}>
                <Robot face={frame > impact ? "star" : "happy"} gear={["shades"]} armR={frame > impact ? 160 : 60} hover={false} />
              </Actor>
            </Machine>
          </Actor>

          {/* multidão invadindo */}
          {crowd.map(({ i, x, t0 }) =>
            frame >= t0 && x < 1260 ? (
              <Actor key={i} x={x} y={900 + (i % 3) * 14} s={0.62 + (i % 3) * 0.05} opacity={x > 1110 ? 1 - (x - 1110) / 150 : 1}>
                <Person
                  variant={i % 7 === 3 ? "kid" : "crowd"}
                  shirt={SHIRTS[i % SHIRTS.length]}
                  skin={SKINS[i % 4]}
                  hair={HAIRS[i % HAIRS.length]}
                  mood="happy"
                  armL={-30 + wobble(frame, 10, 40, i * 3)}
                  armR={150 + wobble(frame, 9, 20, i)}
                  jump={Math.abs(Math.sin((frame + i * 5) / 4)) * 16}
                  seed={i}
                  mouth={0}
                />
              </Actor>
            ) : null,
          )}

          {/* fila original */}
          {queue.map(({ x, i }) => {
            const isFirst = i === 0;
            const rejected = isFirst && frame > c.word("s1_e", "vinte") ? kf(frame, [c.word("s1_e", "vinte"), c.word("s1_e", "vinte") + 20], [0, 1]) : 0;
            const leaving = frame > floodStart + 10 ? (frame - floodStart - 10) * 8 : 0;
            const px = x - rejected * 140 + leaving;
            if (px > 1120) return null;
            const aging = i === 3 ? ramp(frame, c.word("s1_c", "décadas"), c.word("s1_c", "décadas") + 50) : 0;
            return (
              <Actor key={i} x={px} y={905} s={isFirst ? 0.82 : 0.72} opacity={px > 1000 ? 1 - (px - 1000) / 120 : 1}>
                <Person
                  variant={isFirst ? "pes" : "crowd"}
                  shirt={isFirst ? undefined : SHIRTS[(i * 3) % SHIRTS.length]}
                  skin={isFirst ? undefined : SKINS[i % 4]}
                  hair={aging > 0.5 ? "#e8e8ef" : isFirst ? undefined : HAIRS[i % HAIRS.length]}
                  mood={frame > c("s1_e").start && frame < floodStart ? (isFirst ? "sad" : "shock") : frame >= floodStart ? "happy" : "neutral"}
                  armR={isFirst && frame > c("s1_d").start && frame < c("s1_d").end + 10 ? 140 : 10}
                  look={frame > rumble && frame < impact ? [-1, 0] : [1, 0]}
                  jump={scared(x)}
                  seed={i}
                  mouth={isFirst ? undefined : 0}
                />
                {aging > 0 && <rect x={-30} y={-290} width={60} height={240 * aging} rx={24} fill="#e8e8ef" />}
              </Actor>
            );
          })}

          {/* o guarda */}
          <Actor x={980} y={905 - matJump} s={0.9} flip rot={matRot + (matJump > 0 ? -frame * 12 : 0)}>
            <Mathematician
              mood={matMood}
              holding={frame < impact ? "diploma" : "none"}
              armR={frame > c("s1_e").start && frame < c("s1_e").end ? 95 + wobble(frame, 8, 15) : 30}
              look={frame > rumble && frame < impact ? [1, -0.3] : [0.6, 0]}
              sweat={frame > rumble}
            />
          </Actor>

          {/* símbolos misteriosos girando em volta da fortaleza */}
          {frame > c("s1_c").start - 10 &&
            frame < c("s1_d").start + 10 &&
            ["∮", "∂²", "ℵ₀", "∇×", "Ω", "∬", "ζ(s)", "⊗"].map((g, i) => {
              const a = (frame / 40 + (i / 8) * Math.PI * 2) % (Math.PI * 2);
              const o = ramp(frame, c("s1_c").start + i * 4, c("s1_c").start + i * 4 + 15) * (1 - ramp(frame, c("s1_d").start - 10, c("s1_d").start + 10));
              return (
                <text key={g} x={1200 + Math.cos(a) * 520} y={480 + Math.sin(a) * 200} fontFamily={display} fontWeight={800} fontSize={70} fill={C.cyan} opacity={o * 0.85} textAnchor="middle">
                  {g}
                </text>
              );
            })}
          {/* páginas do calendário voando */}
          {frame > c.word("s1_c", "décadas") &&
            frame < c.word("s1_c", "décadas") + 70 &&
            Array.from({ length: 8 }).map((_, i) => {
              const t = frame - c.word("s1_c", "décadas") - i * 4;
              if (t < 0) return null;
              return (
                <g key={i} transform={`translate(${300 + t * 6 + i * 20} ${520 - t * 3 + i * 10}) rotate(${t * 9})`}>
                  <rect x={-36} y={-40} width={72} height={80} fill="#fff" stroke={C.ink} strokeWidth={3} />
                  <rect x={-36} y={-40} width={72} height={20} fill={C.red} />
                  <text y={22} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={28} fill={C.ink}>
                    {1980 + i * 5}
                  </text>
                </g>
              );
            })}
        </Stage>
        <Bubble line="s1_d" x={640} y={560} w={440} size={36} />
        <Bubble line="s1_e" x={1000} y={560} w={560} side="right" shout size={40} color="#fff3d6" />
        <Bubble line="s1_g" x={480} y={460} w={560} shout size={38} color={C.cyanSoft} />
        <Bubble line="s1_j" x={1010} y={520} w={380} side="right" size={36} />
      </Camera>

      {/* fluxo: ideia → IA → questão matemática → verificação (sincronizado com a narração) */}
      {frame > c("s1_h").start && frame < c("s1_i").start + 6 && (
        <AbsoluteFill style={{ opacity: 1 - ramp(frame, c("s1_i").start - 8, c("s1_i").start + 4) }}>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {[
              { at: c.word("s1_h", "ideia"), x: 330, label: "ideia" },
              { at: c.word("s1_h", "inteligência"), x: 750, label: "IA" },
              { at: c.word("s1_h", "questão"), x: 1170, label: "∀n, P(n)?" },
              { at: c.word("s1_h", "confira"), x: 1590, label: "conferida ✔" },
            ].map((s, i) => {
              const p = pop(frame, s.at);
              return (
                <g key={i} transform={`translate(${s.x} 210) scale(${p})`}>
                  {i > 0 && <path d="M -330 0 L -110 0" stroke={C.cyan} strokeWidth={8} strokeDasharray="18 14" strokeDashoffset={-frame * 2} />}
                  <rect x={-150} y={-90} width={300} height={180} rx={34} fill={C.panel} stroke={i === 3 ? C.green : C.cyan} strokeWidth={6} />
                  {i === 0 && <Bulb x={0} y={-16} s={1.1} />}
                  {i === 1 && (
                    <Actor x={0} y={60} s={0.3}>
                      <Robot face="happy" mouth={0} hover={false} />
                    </Actor>
                  )}
                  {i === 2 && (
                    <text y={0} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={50} fill={C.yellow}>
                      ∀n, P(n)?
                    </text>
                  )}
                  {i === 3 && (
                    <g>
                      <rect x={-70} y={-62} width={140} height={90} rx={10} fill="#081026" stroke={C.green} strokeWidth={5} />
                      <path d="M -30 -18 L -8 4 L 34 -40" stroke={C.green} strokeWidth={12} fill="none" strokeLinecap="round" />
                    </g>
                  )}
                  <text y={72} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={32} fill={C.white}>
                    {i === 2 ? "questão" : s.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </AbsoluteFill>
      )}

      <PopText at={c.word("s1_i", "todo")} until={L - 20} x={960} y={250} size={120} color={C.yellow} rot={-3} width={1500} plate>
        TODO MUNDO É MATEMÁTICO AGORA!
      </PopText>
      <Confetti at={c.word("s1_i", "todo")} x={960} y={300} n={140} />
      <Confetti at={impact + 2} x={700} y={420} n={90} sfx={false} />
      <Flash at={impact} />
      <Flash at={c.word("s1_i", "todo")} dur={6} color={C.yellow} />

      <Sfx at={rumble} name="thud" volume={0.6} />
      <Sfx at={machineIn} name="siren" volume={0.35} />
      <Sfx at={machineIn + 75} name="siren" volume={0.3} />
      <Sfx at={impact - 2} name="crash" volume={0.75} />
      <Sfx at={c.word("s1_e", "vinte") + 2} name="whoosh" volume={0.5} />
      <Sfx at={c.word("s1_c", "décadas")} name="page-turn" volume={0.4} />
      <Sfx at={faintAt} name="slide-down" volume={0.5} />
      <Sfx at={faintAt + 14} name="thud" volume={0.5} />
      {[c.word("s1_h", "ideia"), c.word("s1_h", "inteligência"), c.word("s1_h", "questão")].map((f, i) => (
        <Sfx key={i} at={f} name="pop" volume={0.35} />
      ))}
      <Sfx at={c.word("s1_h", "confira")} name="ding" volume={0.35} />

      {frame < 140 && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: kf(frame, [0, 6, 100, 135], [0, 1, 1, 0]) }}>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 40, color: C.cyanSoft, letterSpacing: 6, marginTop: -520, textTransform: "uppercase" }}>
            Clube dos Silveira Baldo apresenta
          </div>
        </AbsoluteFill>
      )}
      <SceneTag scene="s1" n={1} />
      <SceneFade length={L} inF={10} outF={6} />
    </AbsoluteFill>
  );
};

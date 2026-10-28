import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Person } from "../chars/Person";
import { Robot } from "../chars/Robot";
import { LeanChar } from "../chars/Lean";
import { C, display } from "../lib/theme";
import { kf, pop, ramp, wobble } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import { Backdrop, Bubble, Camera, Confetti, Flash, PopText, SceneFade, SceneTag, Sfx, Stage } from "../ui/kit";
import { Bulb, Ground } from "./props";

const c = makeCues("s3");

const STEPS = [
  { w: "ideia", label: "IDEIA", col: C.yellow },
  { w: "definições", label: "DEFINIÇÕES", col: C.cyan },
  { w: "hipóteses", label: "HIPÓTESES", col: C.green },
  { w: "conjectura", label: "CONJECTURA", col: C.purple },
  { w: "prova", label: "PROVA", col: C.coral },
];

export const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const L = c.sceneLength;
  const robotIn = c("s3_d").start - 18;
  const scratch = c("s3_g").start - 4;
  const errar = c.word("s3_h", "errar");
  const conf = c.word("s3_h", "confiança");
  const silenceA = c("s3_i").end + 4;
  const leanWalk = silenceA + 20;
  const stepAt = STEPS.map((s) => c.word("s3_e", s.w));

  const gear: ("shades" | "cape" | "crown" | "megaphone")[] = [];
  if (frame > conf) gear.push("shades");
  if (frame > conf + 12) gear.push("cape");
  if (frame > conf + 24) gear.push("crown");
  if (frame > c("s3_i").start && frame < silenceA + 40) gear.push("megaphone");

  // robô voa para perto do bloco que está construindo
  const building = stepAt.filter((f) => frame > f - 8).length - 1;
  const rX = frame < robotIn ? 2300 : kf(frame, [robotIn, robotIn + 20], [2300, 1400]);
  const rbX = building >= 0 && frame < c("s3_f").start ? 640 + building * 230 + 340 : frame >= c("s3_f").start ? 1360 : rX;
  const rbY = building >= 0 && frame < c("s3_f").start ? 740 - building * 90 : 790;
  const robotX = frame < stepAt[0] - 8 ? rX : rbX;
  const robotY = frame < stepAt[0] - 8 ? 790 : rbY;

  const robotFace =
    frame > c("s3_j").start - 10 ? "sad" : frame > silenceA + 30 ? "shock" : frame > c("s3_i").start ? "star" : frame > conf ? "wink" : frame > errar ? "think" : frame > c("s3_f").start ? "love" : frame > robotIn ? "happy" : "normal";

  const freeze = frame > scratch && frame < scratch + 30;
  const crack = frame > errar ? ramp(frame, errar, errar + 20) : 0;

  const cam: [number, number, number, number][] = [
    [0, 1.2, 560, 560],
    [c("s3_b").end, 1.2, 560, 560],
    [c("s3_d").start, 0.95, 960, 560],
    [stepAt[0], 0.9, 1000, 520],
    [c("s3_f").end, 0.9, 1000, 520],
    [scratch, 0.9, 1000, 520],
    [scratch + 4, 1.6, 1360, 520],
    [c("s3_h").start + 10, 1.6, 1360, 520],
    [errar + 10, 1.1, 1500, 380],
    [conf, 1.3, 1360, 520],
    [c("s3_i").start, 0.95, 1100, 520],
    [silenceA + 10, 0.95, 1100, 520],
    [c("s3_j").start - 6, 1.45, 1520, 640],
  ];

  return (
    <AbsoluteFill style={{ filter: freeze ? "grayscale(0.85) contrast(1.1)" : undefined }}>
      <Backdrop />
      <Camera keys={cam} shakeAt={[[scratch, 12, 8]]}>
        <Stage>
          <Ground />
          {/* escada de blocos */}
          {STEPS.map((st, i) => {
            const at = stepAt[i];
            const p = pop(frame, at, 30, 12);
            if (frame < at) return null;
            const x = 640 + i * 230;
            const y = 900 - (i + 1) * 90;
            const isProof = i === 4;
            const wob = isProof && crack > 0 ? wobble(frame, 10, 6 * crack) : 0;
            return (
              <g key={st.label} transform={`translate(${x + 110} ${y + 45 - (1 - p) * 200}) rotate(${wob})`}>
                <rect x={-110} y={-45} width={220} height={90 * (i + 1)} rx={10} fill={st.col} opacity={0.2} />
                <rect x={-110} y={-45} width={220} height={90} rx={14} fill={st.col} stroke={C.ink} strokeWidth={6} />
                <text y={14} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={st.label.length > 8 ? 30 : 38} fill={C.ink}>
                  {st.label}
                </text>
                {isProof && crack > 0 && <path d={`M -40 -45 L -20 -10 L -36 10 L -10 45`} stroke={C.ink} strokeWidth={5} fill="none" strokeDasharray={200} strokeDashoffset={200 * (1 - crack)} />}
              </g>
            );
          })}

          {/* a pessoa */}
          <Actor x={460} y={900} s={1}>
            <Person
              variant="pes"
              mood={frame > c("s3_f").start ? "happy" : frame > c("s3_b").start && frame < c("s3_d").start ? "sad" : frame > c("s3_d").start ? "happy" : "neutral"}
              armR={frame > c("s3_b").start && frame < c("s3_c").end ? 170 : frame > c("s3_f").start && frame < c("s3_f").end ? 150 : 10}
              look={frame > robotIn ? [1, -0.3] : [0.2, -1]}
            />
          </Actor>
          {/* nuvem de pensamento */}
          {frame < c("s3_d").start + 20 && (
            <g transform={`translate(560 300) scale(${pop(frame, 10) * (1 - ramp(frame, c("s3_d").start, c("s3_d").start + 20))})`}>
              <circle cx={-90} cy={190} r={14} fill="#fff" />
              <circle cx={-60} cy={150} r={22} fill="#fff" />
              <ellipse cx={0} cy={0} rx={260} ry={130} fill="#fff" stroke={C.ink} strokeWidth={5} />
              {frame < c("s3_b").start ? (
                <g>
                  {[
                    { at: c.word("s3_a", "números"), x: -150, t: "1 2 3" },
                    { at: c.word("s3_a", "jogo"), x: 0, t: "⚄" },
                    { at: c.word("s3_a", "regras"), x: 150, t: "§" },
                  ].map((ic, i) =>
                    frame > ic.at ? (
                      <text key={i} x={ic.x} y={26} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={i === 0 ? 56 : 90} fill={[C.coral, C.purple, "#1d6fd8"][i]} transform={`translate(${ic.x} 0) scale(${pop(frame, ic.at)}) translate(${-ic.x} 0)`}>
                        {ic.t}
                      </text>
                    ) : null,
                  )}
                  <Bulb x={0} y={-150} s={0.9 * pop(frame, 14)} />
                </g>
              ) : (
                <g>
                  <path
                    d={Array.from({ length: 30 })
                      .map((_, i) => `${i ? "L" : "M"} ${-180 + ((i * 97) % 360)} ${-70 + ((i * 53) % 140)}`)
                      .join(" ")}
                    stroke={C.ink}
                    strokeWidth={5}
                    fill="none"
                    opacity={0.7}
                  />
                  <text y={30} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={100} fill={C.red}>
                    ???
                  </text>
                </g>
              )}
            </g>
          )}

          {/* coração do parceiro */}
          {frame > c("s3_f").start && frame < c("s3_g").start && (
            <path transform={`translate(900 360) scale(${3 * pop(frame, c("s3_f").start)})`} d="M0,14 C-26,-4 -14,-26 0,-12 C14,-26 26,-4 0,14 Z" fill={C.coral} />
          )}

          {/* o robô */}
          <Actor x={robotX} y={robotY} s={0.95}>
            <Robot face={robotFace} gear={gear} armR={frame > c("s3_i").start && frame < silenceA + 40 ? 150 : frame > c("s3_f").start && frame < c("s3_f").end ? 150 : building >= 0 && frame < c("s3_f").start ? 100 + wobble(frame, 8, 30) : 30} armL={frame > c("s3_i").start && frame < silenceA ? 160 : 20} />
          </Actor>

          {/* fotógrafos da imprensa */}
          {frame > c.word("s3_i", "imprensa") - 8 &&
            frame < silenceA + 6 &&
            [200, 380, 1820].map((x, i) => (
              <g key={i} transform={`translate(${x} 860)`}>
                <rect x={-50} y={-60} width={100} height={70} rx={10} fill="#222" />
                <circle cx={0} cy={-25} r={22} fill="#555" stroke="#999" strokeWidth={4} />
                <rect x={20} y={-80} width={30} height={20} fill="#ddd" />
                {(frame + i * 5) % 14 < 3 && <circle cx={35} cy={-70} r={80} fill="#fff" opacity={0.8} />}
              </g>
            ))}

          {/* Lean entra no silêncio */}
          {frame > leanWalk && (
            <Actor x={kf(frame, [leanWalk, leanWalk + 45], [2150, 1720])} y={900 - Math.abs(Math.sin((frame - leanWalk) / 3)) * (frame < leanWalk + 45 ? 10 : 0)} s={1.05} flip>
              <LeanChar stamp={frame > c("s3_j").start ? 0.6 : 0.2} look={[1, -0.2]} />
            </Actor>
          )}
        </Stage>
        <Bubble line="s3_c" x={520} y={480} w={520} size={36} />
        <Bubble line="s3_d" x={1460} y={420} w={480} side="right" size={38} color={C.cyanSoft} />
        <Bubble line="s3_j" x={1660} y={560} w={360} side="left" size={50} color={C.yellow} />
      </Camera>

      <PopText at={c.word("s3_h", "espetacular") - 4} until={c("s3_h").end + 6} x={960} y={160} size={70} color={C.yellow} rot={-4}>
        CONFIANÇA: 1000%
      </PopText>
      <PopText at={c("s3_i").start + 2} until={silenceA} x={960} y={170} size={78} color={C.white} rot={2} plate width={1400}>
        RESOLVI TODA A MATEMÁTICA!!!
      </PopText>
      <Confetti at={c("s3_i").start + 4} x={1100} y={300} n={120} />
      <Flash at={c.word("s3_i", "imprensa")} dur={5} />
      {frame > silenceA + 10 && frame < c("s3_j").start && (
        <div style={{ position: "absolute", right: 80, top: 80, fontFamily: display, fontWeight: 800, fontSize: 40, color: C.cyanSoft, opacity: 0.8 }}>
          *cri cri*
        </div>
      )}

      {stepAt.map((f, i) => (
        <Sfx key={i} at={f} name="pop" volume={0.35} />
      ))}
      <Sfx at={robotIn} name="whoosh" volume={0.45} />
      <Sfx at={scratch} name="record-scratch" volume={0.55} />
      <Sfx at={errar} name="collapse" volume={0.15} />
      <Sfx at={conf} name="sparkle" volume={0.4} />
      <Sfx at={silenceA + 8} name="crickets" volume={0.45} />
      {Array.from({ length: 5 }).map((_, i) => (
        <Sfx key={`st${i}`} at={leanWalk + i * 9} name="click" volume={0.3} />
      ))}
      <SceneTag scene="s3" n={3} />
      <SceneFade length={L} inF={6} outF={6} />
    </AbsoluteFill>
  );
};

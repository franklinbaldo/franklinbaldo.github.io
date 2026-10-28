import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Person } from "../chars/Person";
import { LeanChar } from "../chars/Lean";
import { C, body, display } from "../lib/theme";
import { kf, pop } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import lean from "../generated/lean.json";
import { Backdrop, Bubble, Camera, Sfx, Stage } from "../ui/kit";
import { Cake, Ground } from "./props";

const c = makeCues("post");

/** Cena pós-créditos: o teorema da vovó. */
export const Post: React.FC = () => {
  const frame = useCurrentFrame();
  const L = c.sceneLength;
  const shove = c("p_e").start;
  return (
    <AbsoluteFill>
      <Backdrop tint="#3a2a4f" glyphs={false} />
      <Camera keys={[[0, 1.15, 960, 600], [c("p_d").start, 1.15, 960, 600], [shove + 2, 1.5, 1060, 560]]} shakeAt={[[shove, 14, 14]]}>
        <Stage>
          <Ground y={940} color="#4a3560" />
          <rect x={0} y={0} width={1920} height={940} fill="#2a2148" opacity={0.5} />
          <Actor x={720} y={940} s={1.2}>
            <Person variant="avo" mood={frame > shove ? "angry" : frame > c("p_c").start ? "smug" : "happy"} armR={frame > shove ? 120 : 70} />
          </Actor>
          {/* folha com o teorema */}
          <g transform={`translate(900 460) rotate(-4) scale(${pop(frame, 10)})`}>
            <rect x={-80} y={-150} width={420} height={260} rx={10} fill="#fffaf0" stroke="#c9a96b" strokeWidth={6} />
            <text x={130} y={-100} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.red}>
              TEOREMA
            </text>
            {["Ninguém sai da", "minha casa", "com fome. ∎"].map((t, i) => (
              <text key={t} x={130} y={-40 + i * 46} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={38} fill={C.ink}>
                {t}
              </text>
            ))}
          </g>
          <Actor x={1360} y={940} s={1.1} flip>
            <LeanChar tool="none" mood={frame > shove + 6 ? "shock" : "serious"} look={[1, -0.3]} />
          </Actor>
          {/* o bolo voando direto na cara do fiscal */}
          {frame > shove && <Cake x={kf(frame, [shove, shove + 8], [900, 1360])} y={kf(frame, [shove, shove + 8], [700, 700])} s={0.8} />}
        </Stage>
        <Bubble line="p_b" x={1380} y={560} w={440} side="right" size={38} color={C.yellow} />
        <Bubble line="p_c" x={760} y={420} w={420} size={40} />
        <Bubble line="p_d" x={1380} y={560} w={240} side="right" size={44} color={C.yellow} hold={0} />
        <Bubble line="p_e" x={760} y={420} w={520} size={44} shout />
      </Camera>
      <Sfx at={shove + 6} name="pop" volume={0.6} />
      <Sfx at={shove + 6} name="thud" volume={0.4} />
      {/* corte seco */}
      {frame > L - 10 && <AbsoluteFill style={{ background: "#000" }} />}
    </AbsoluteFill>
  );
};

const CREDITS: [string, string][] = [
  ["", "TODO MUNDO É MATEMÁTICO AGORA!"],
  ["para", "Clube dos Silveira Baldo"],
  ["ideia e direção", "Franklin Baldo"],
  ["animação, roteiro final e código", "Claude Code + Remotion (React/TypeScript)"],
  ["vozes", "vozes neurais em português (Microsoft Edge TTS)"],
  ["trilha e efeitos sonoros", "sintetizados do zero para este vídeo"],
  ["fiscal oficial", `${lean.version.split(",")[0].replace("(version ", "").replace(")", "")} · provas reais, sem sorry, sem axiomas`],
  ["", "Nenhum matemático foi ferido. Dois desmaiaram."],
];

export const Credits: React.FC = () => {
  const frame = useCurrentFrame();
  const L = makeCues("credits").sceneLength;
  const y = kf(frame, [0, L], [1100, -560], (t) => t);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
        {CREDITS.map(([k, v], i) => (
          <div key={i} style={{ textAlign: "center" }}>
            {k && <div style={{ fontFamily: body, fontWeight: 700, fontSize: 32, color: C.cyanSoft, textTransform: "uppercase", letterSpacing: 4 }}>{k}</div>}
            <div style={{ fontFamily: display, fontWeight: 800, fontSize: i === 0 ? 76 : 50, color: i === 0 ? C.yellow : C.white }}>{v}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Actor } from "../chars/parts";
import { Person, Variant } from "../chars/Person";
import { Robot } from "../chars/Robot";
import { LeanChar } from "../chars/Lean";
import { Mathematician } from "../chars/Mathematician";
import { C, display } from "../lib/theme";
import { kf, pop, ramp, wobble } from "../lib/anim";
import { makeCues } from "../lib/timeline";
import { Backdrop, Bubble, Camera, Confetti, Flash, PopText, SceneTag, Sfx, Stage } from "../ui/kit";
import { Fortress, Ground } from "./props";

const c = makeCues("s9");

const WORKERS: { v: Variant; x: number; q: string }[] = [
  { v: "kid", x: 180, q: "jogo novo" },
  { v: "avo", x: 520, q: "receita" },
  { v: "dev", x: 860, q: "algoritmo" },
  { v: "pes", x: 1540, q: "números" },
  { v: "adv", x: 1880, q: "regras" },
  { v: "tio", x: 2220, q: "churrasco" },
];

export const S9: React.FC = () => {
  const frame = useCurrentFrame();
  const globe = c("s9_h").start - 6;
  const pause = c("s9_i").start;
  const you = c("s9_j").start;
  const errX = c.word("s9_e", "errar");
  const badQ = c.word("s9_e", "formulada");
  const found = c.word("s9_e", "encontrar");
  const matIn = c("s9_g").start - 20;

  const cam: [number, number, number, number][] = [
    [0, 0.62, 1200, 520],
    [c("s9_b").end, 0.62, 1200, 520],
    [c("s9_c").start + 20, 0.85, 1000, 640],
    [c("s9_e").start, 0.85, 1400, 640],
    [c("s9_f").start, 0.7, 1200, 560],
    [matIn, 0.85, 1200, 640],
  ];

  return (
    <AbsoluteFill>
      <Backdrop />
      {frame < globe && (
        <Camera keys={cam}>
          <Stage x={-400} w={3000}>
            <Ground />
            <Fortress gate={1.2} workshop={1} />
            {/* trabalhadores e suas mesas */}
            {WORKERS.map((w, i) => {
              const qAt = c("s9_c").start + 10 + i * 22;
              const checkAt = c("s9_d").start + 20 + i * 24;
              const isErr = i === 1 && frame > errX;
              const isBad = i === 4 && frame > badQ;
              const isStar = i === 3 && frame > found;
              return (
                <g key={i}>
                  <Actor x={w.x} y={900} s={0.8}>
                    <Person variant={w.v} mood={isErr || isBad ? "sad" : isStar ? "shock" : "happy"} armR={70 + wobble(frame, 14, 15, i * 5)} armL={20} mouth={0} seed={i} look={[0.5, -0.4]} />
                  </Actor>
                  <rect x={w.x + 30} y={780} width={180} height={18} rx={6} fill="#8a5a2b" />
                  <rect x={w.x + 50} y={798} width={12} height={102} fill="#6b4520" />
                  <rect x={w.x + 178} y={798} width={12} height={102} fill="#6b4520" />
                  {frame > qAt && (
                    <g transform={`translate(${w.x + 60} ${560}) scale(${pop(frame, qAt) * (isStar ? 1.3 + 0.08 * Math.sin(frame / 4) : 1)}) rotate(${isBad ? wobble(frame, 6, 12) : 0})`}>
                      {isStar && <circle r={150} fill={C.yellow} opacity={0.25} />}
                      <rect x={-120} y={-60} width={240} height={110} rx={20} fill={isStar ? C.yellow : C.panel} stroke={isErr ? C.red : frame > checkAt ? C.green : C.cyan} strokeWidth={6} />
                      <text y={8} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={isStar ? C.ink : C.white}>
                        {isBad ? "???" : w.q}
                      </text>
                      {frame > checkAt && !isErr && !isBad && (
                        <text x={100} y={-56} fontSize={60} fill={C.green} fontWeight={900}>
                          ✔
                        </text>
                      )}
                      {isErr && (
                        <text x={100} y={-56} fontSize={60} fill={C.red} fontWeight={900}>
                          ✘
                        </text>
                      )}
                      {isStar && (
                        <text y={-80} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={40} fill={C.yellow}>
                          novidade!
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
            {/* IA ajudando, Lean conferindo */}
            <Actor x={kf(frame, [0, 200, 400, 600, 800, 1000, 1200], [300, 700, 1100, 1500, 1900, 1300, 700])} y={480 + wobble(frame, 50, 30)} s={0.6}>
              <Robot face={frame % 120 < 60 ? "happy" : "star"} gear={["shades", "crown", "medals", "cape", "party"]} armR={110} />
            </Actor>
            <Actor x={kf(frame, [c("s9_d").start, c("s9_d").start + 150], [100, 2050])} y={900} s={0.7}>
              <LeanChar stamp={Math.abs(Math.sin(frame / 8)) * 0.6} stampInk={C.green} mood="happy" look={[1, -0.3]} />
            </Actor>
            {/* o matemático aceita */}
            {frame > matIn && (
              <Actor x={kf(frame, [matIn, matIn + 30], [2700, 1200])} y={900} s={0.9} flip>
                <Mathematician mood={frame > c("s9_g").start ? "happy" : "sad"} holding="chalk" armR={frame > c.word("s9_g", "giz") ? 110 : 40} />
              </Actor>
            )}
            {frame > c.word("s9_g", "cadeira") && (
              <g transform={`translate(1000 900) scale(${pop(frame, c.word("s9_g", "cadeira"))})`}>
                <rect x={-50} y={-200} width={20} height={200} fill="#8a5a2b" />
                <rect x={-50} y={-100} width={100} height={18} fill="#8a5a2b" />
                <rect x={30} y={-100} width={20} height={100} fill="#8a5a2b" />
              </g>
            )}
            {frame > c.word("s9_g", "giz") &&
              Array.from({ length: 8 }).map((_, i) => {
                const t = frame - c.word("s9_g", "giz") - i * 3;
                if (t < 0) return null;
                return <rect key={i} x={1150 - t * (6 + i)} y={620 - t * 8 + 0.4 * t * t} width={10} height={36} rx={4} fill="#fff" transform={`rotate(${t * 15} ${1150 - t * (6 + i)} ${620 - t * 8 + 0.4 * t * t})`} />;
              })}
          </Stage>
          <Bubble line="s9_g" x={1180} y={420} w={600} side="right" size={36} />
        </Camera>
      )}

      {/* o planeta das perguntas */}
      {frame >= globe && frame < you && (
        <AbsoluteFill>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <defs>
              <radialGradient id="g9" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#2a5bd7" />
                <stop offset="100%" stopColor="#0a1f55" />
              </radialGradient>
            </defs>
            <g transform={`translate(960 ${kf(frame, [globe, globe + 40], [1400, 640])}) scale(${frame > pause ? 1 + ramp(frame, pause, you) * 0.15 : 1})`}>
              <circle r={420} fill="url(#g9)" stroke={C.cyan} strokeWidth={4} />
              {[-60, -30, 0, 30, 60].map((lat) => (
                <ellipse key={lat} cx={0} cy={(lat / 90) * 420} rx={420 * Math.cos((lat * Math.PI) / 180)} ry={30 * Math.cos((lat * Math.PI) / 180)} fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.4} />
              ))}
              {Array.from({ length: 6 }).map((_, k) => {
                const ph = ((frame / 3 + k * 30) % 180) - 90;
                return <ellipse key={k} cx={0} cy={0} rx={Math.abs(420 * Math.sin((ph * Math.PI) / 180))} ry={420} fill="none" stroke={C.cyan} strokeWidth={2} opacity={0.35} />;
              })}
              {Array.from({ length: 160 }).map((_, i) => {
                const a = i * 2.39996;
                const r = 400 * Math.sqrt((i + 0.5) / 160);
                const at = globe + 20 + i * 0.8;
                if (frame < at) return null;
                const x = Math.cos(a + frame / 200) * r;
                const y = Math.sin(a) * r * 0.95;
                return (
                  <g key={i} transform={`translate(${x} ${y})`}>
                    <circle r={10 + 4 * Math.sin(frame / 6 + i)} fill={C.yellow} opacity={0.25} />
                    <circle r={4} fill={C.yellow} />
                  </g>
                );
              })}
            </g>
          </svg>
          {frame < pause && (
            <PopText at={c.word("s9_h", "pergunte")} until={pause - 4} x={960} y={130} size={72} color={C.white} plate>
              será que dá para formalizar isso?
            </PopText>
          )}
          {/* holofote varrendo na pausa dramática */}
          {frame > pause && (
            <AbsoluteFill style={{ background: `radial-gradient(circle at ${960 + Math.sin((frame - pause) / 8) * 500}px 600px, rgba(255,250,220,0.0) 0px, rgba(255,250,220,0.0) 160px, rgba(3,8,22,0.86) 200px)` }} />
          )}
        </AbsoluteFill>
      )}

      {/* PODE SER VOCÊ! */}
      {frame >= you && (
        <AbsoluteFill>
          <Backdrop tint="#1b3c8f" />
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {Array.from({ length: 24 }).map((_, i) => (
              <path key={i} d={`M 960 560 L ${960 + Math.cos((i / 24) * Math.PI * 2 + frame / 60) * 1600} ${560 + Math.sin((i / 24) * Math.PI * 2 + frame / 60) * 1600} L ${960 + Math.cos(((i + 0.5) / 24) * Math.PI * 2 + frame / 60) * 1600} ${560 + Math.sin(((i + 0.5) / 24) * Math.PI * 2 + frame / 60) * 1600} Z`} fill={i % 2 ? C.cyan : C.yellow} opacity={0.08} />
            ))}
            {[
              { el: <Person variant="avo" mood="happy" armR={95} mouth={0} />, x: 220, s: 0.9 },
              { el: <Person variant="kid" mood="happy" armR={95} mouth={0} />, x: 450, s: 1 },
              { el: <Mathematician mood="happy" armR={95} holding="chalk" mouth={0} />, x: 700, s: 0.8 },
              { el: <Robot face="star" gear={["shades", "crown", "cape", "medals", "party"]} armR={95} mouth={0} />, x: 1220, s: 0.8 },
              { el: <LeanChar mood="happy" stamp={0.3} stampInk={C.green} mouth={0} />, x: 1460, s: 1 },
              { el: <Person variant="tio" mood="happy" armR={95} mouth={0} />, x: 1700, s: 0.9 },
            ].map((p, i) => (
              <Actor key={i} x={p.x} y={1080 - (1 - pop(frame, you + i * 3)) * -400} s={p.s} flip={p.x > 960 && i !== 5}>
                {p.el}
              </Actor>
            ))}
          </svg>
          <PopText at={you} x={960} y={250} size={150} color={C.yellow} rot={-4}>
            PODE SER VOCÊ!
          </PopText>
          <PopText at={you + 45} x={960} y={430} size={64} color={C.white} plate>
            TODO MUNDO É MATEMÁTICO AGORA!
          </PopText>
          <Confetti at={you} x={960} y={250} n={160} />
          <Confetti at={you + 30} x={400} y={300} n={80} sfx={false} />
          <Confetti at={you + 50} x={1500} y={300} n={80} sfx={false} />
        </AbsoluteFill>
      )}
      <Flash at={you} dur={8} color={C.yellow} />

      <Sfx at={c("s9_c").start + 10} name="pop" volume={0.3} />
      <Sfx at={errX} name="buzzer" volume={0.25} />
      <Sfx at={badQ} name="boing" volume={0.3} />
      <Sfx at={found} name="sparkle" volume={0.5} />
      <Sfx at={c.word("s9_g", "giz")} name="pop" volume={0.3} />
      <Sfx at={globe} name="whoosh" volume={0.45} />
      <Sfx at={you} name="success" volume={0.5} />
      <SceneTag scene="s9" n={9} />
    </AbsoluteFill>
  );
};

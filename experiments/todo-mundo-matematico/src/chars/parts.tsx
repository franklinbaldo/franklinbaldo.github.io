import React from "react";
import { useCurrentFrame } from "remotion";
import { blink } from "../lib/anim";
import { mouthAmp, Who } from "../lib/timeline";
import { useSceneStart } from "../lib/scene";

export type Mood = "neutral" | "happy" | "angry" | "shock" | "smug" | "sad" | "serious" | "dizzy" | "love";

/** Posiciona um personagem: (x, y) = ponto entre os pés, em coordenadas 1920×1080. */
export const Actor: React.FC<{
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  rot?: number;
  opacity?: number;
  children: React.ReactNode;
}> = ({ x, y, s = 1, flip, rot = 0, opacity = 1, children }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`} opacity={opacity}>
    {children}
  </g>
);

/** Amplitude da boca do personagem `who` no frame atual (0 se não está falando). */
export const useMouth = (who: Who | undefined, override?: number) => {
  const frame = useCurrentFrame();
  const start = useSceneStart();
  if (override !== undefined) return override;
  if (!who) return 0;
  return mouthAmp(who, frame + start);
};

export const Eye: React.FC<{
  x: number;
  y: number;
  r?: number;
  mood?: Mood;
  look?: [number, number];
  seed?: number;
  white?: string;
  pupil?: string;
}> = ({ x, y, r = 11, mood = "neutral", look = [0, 0], seed = 0, white = "#fff", pupil = "#1a1a2e" }) => {
  const frame = useCurrentFrame();
  const open = mood === "shock" ? 1.25 : blink(frame, seed);
  if (mood === "dizzy") {
    return (
      <g stroke={pupil} strokeWidth={4} strokeLinecap="round">
        <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
        <line x1={x - r} y1={y + r} x2={x + r} y2={y - r} />
      </g>
    );
  }
  if (mood === "happy" || mood === "love") {
    return (
      <path
        d={`M ${x - r} ${y + 2} Q ${x} ${y - r * 1.3} ${x + r} ${y + 2}`}
        stroke={pupil}
        strokeWidth={4.5}
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  const ry = r * open;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r} ry={ry} fill={white} stroke={pupil} strokeWidth={2} />
      {open > 0.3 && <circle cx={x + look[0] * r * 0.4} cy={y + look[1] * r * 0.4} r={r * (mood === "shock" ? 0.35 : 0.5)} fill={pupil} />}
      {open > 0.3 && <circle cx={x + look[0] * r * 0.4 - r * 0.15} cy={y + look[1] * r * 0.4 - r * 0.2} r={r * 0.15} fill="#fff" />}
    </g>
  );
};

export const Brow: React.FC<{ x: number; y: number; w?: number; mood?: Mood; side: 1 | -1; color?: string; thick?: number }> = ({
  x,
  y,
  w = 22,
  mood = "neutral",
  side,
  color = "#3a2a1a",
  thick = 5,
}) => {
  const tilt = { angry: 18, serious: 10, shock: -14, sad: -16, smug: 6, neutral: 0, happy: -6, dizzy: 0, love: -8 }[mood];
  const lift = mood === "shock" ? -8 : mood === "angry" ? 4 : 0;
  return (
    <line
      x1={x - w / 2}
      y1={y + lift - (side * tilt) / 3}
      x2={x + w / 2}
      y2={y + lift + (side * tilt) / 3}
      stroke={color}
      strokeWidth={thick}
      strokeLinecap="round"
    />
  );
};

export const Mouth: React.FC<{ x: number; y: number; w?: number; amp: number; mood?: Mood; color?: string }> = ({
  x,
  y,
  w = 30,
  amp,
  mood = "neutral",
  color = "#5a1a1a",
}) => {
  const open = Math.min(1, amp) * 22;
  if (open < 1.5) {
    if (mood === "happy" || mood === "smug" || mood === "love") {
      return <path d={`M ${x - w / 2} ${y} Q ${x} ${y + (mood === "smug" ? 7 : 14)} ${x + w / 2} ${y - (mood === "smug" ? 4 : 0)}`} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />;
    }
    if (mood === "sad" || mood === "angry") {
      return <path d={`M ${x - w / 2} ${y + 6} Q ${x} ${y - 6} ${x + w / 2} ${y + 6}`} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />;
    }
    if (mood === "shock") {
      return <ellipse cx={x} cy={y + 4} rx={w * 0.28} ry={w * 0.38} fill={color} />;
    }
    if (mood === "dizzy") {
      return <path d={`M ${x - w / 2} ${y} q ${w / 6} -6 ${w / 3} 0 t ${w / 3} 0 t ${w / 3} 0`} stroke={color} strokeWidth={3.5} fill="none" />;
    }
    return <line x1={x - w / 2.5} y1={y} x2={x + w / 2.5} y2={y} stroke={color} strokeWidth={4} strokeLinecap="round" />;
  }
  return (
    <g>
      <ellipse cx={x} cy={y + open / 3} rx={w / 2} ry={open / 1.6 + 2} fill={color} />
      <ellipse cx={x} cy={y + open / 3 + open / 3} rx={w / 3.5} ry={open / 4} fill="#ff7a8a" />
    </g>
  );
};

/** Braço simples: ombro em (x,y), ângulo em graus (0 = para baixo, positivo = para frente). */
export const Arm: React.FC<{
  x: number;
  y: number;
  angle: number;
  len?: number;
  w?: number;
  color: string;
  hand: string;
  children?: React.ReactNode;
}> = ({ x, y, angle, len = 110, w = 26, color, hand, children }) => (
  <g transform={`translate(${x} ${y}) rotate(${-angle})`}>
    <rect x={-w / 2} y={0} width={w} height={len} rx={w / 2} fill={color} />
    <circle cx={0} cy={len} r={w * 0.62} fill={hand} />
    <g transform={`translate(0 ${len})`}>{children}</g>
  </g>
);

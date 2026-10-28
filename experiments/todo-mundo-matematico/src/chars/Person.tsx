import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../lib/theme";
import { wobble } from "../lib/anim";
import { Who } from "../lib/timeline";
import { Arm, Brow, Eye, Mood, Mouth, useMouth } from "./parts";

export type Variant = "pes" | "avo" | "tio" | "kid" | "adv" | "dev" | "crowd";

type Look = { skin: string; shirt: string; pants: string; hair: string; who?: Who; kid?: boolean };

const LOOKS: Record<Variant, Look> = {
  pes: { skin: C.skin2, shirt: "#ff9f43", pants: "#2d3a66", hair: "#3a2416", who: "PES" },
  avo: { skin: C.skin1, shirt: "#b76ad6", pants: "#5b3b78", hair: "#e8e8ef", who: "AVO" },
  tio: { skin: C.skin3, shirt: "#e74c3c", pants: "#34495e", hair: "#1e1410", who: "TIO" },
  kid: { skin: C.skin2, shirt: "#2ecc71", pants: "#2a5bd7", hair: "#5a3416", who: "KID", kid: true },
  adv: { skin: C.skin1, shirt: "#2c3e50", pants: "#2c3e50", hair: "#7a5230", who: "ADV" },
  dev: { skin: C.skin4, shirt: "#6c5ce7", pants: "#1e272e", hair: "#120c08" },
  crowd: { skin: C.skin2, shirt: "#00b894", pants: "#2d3436", hair: "#2d1b10" },
};

/** Pessoa comum (e suas variantes de família). Pés em (0,0). */
export const Person: React.FC<{
  variant?: Variant;
  mood?: Mood;
  armL?: number;
  armR?: number;
  look?: [number, number];
  mouth?: number;
  holdR?: React.ReactNode;
  holdL?: React.ReactNode;
  shirt?: string;
  skin?: string;
  hair?: string;
  seed?: number;
  jump?: number;
}> = ({ variant = "pes", mood = "neutral", armL = 10, armR = 10, look = [0.3, 0], mouth, holdR, holdL, shirt, skin, hair, seed = 0, jump = 0 }) => {
  const frame = useCurrentFrame();
  const L = LOOKS[variant];
  const amp = useMouth(L.who, mouth);
  const sk = skin ?? L.skin;
  const sh = shirt ?? L.shirt;
  const hr = hair ?? L.hair;
  const k = L.kid ? 0.72 : 1;
  const breathe = wobble(frame, 64, 1.8, seed * 11);
  return (
    <g transform={`translate(0 ${-jump}) scale(${k})`}>
      <rect x={-36} y={-120} width={30} height={116} rx={10} fill={L.pants} />
      <rect x={6} y={-120} width={30} height={116} rx={10} fill={L.pants} />
      <ellipse cx={-24} cy={-4} rx={26} ry={11} fill="#222" />
      <ellipse cx={24} cy={-4} rx={26} ry={11} fill="#222" />
      <g transform={`translate(0 ${breathe})`}>
        <Arm x={-50} y={-250} angle={-armL} color={sh} hand={sk} len={105} w={24}>
          {holdL}
        </Arm>
        {/* tronco */}
        <path d="M -56 -262 Q -64 -170 -50 -112 L 50 -112 Q 64 -170 56 -262 Q 0 -282 -56 -262 Z" fill={sh} />
        {variant === "avo" && (
          <g>
            <path d="M -40 -230 L 40 -230 L 46 -116 L -46 -116 Z" fill="#fff" />
            <path d="M -40 -230 Q 0 -250 40 -230" stroke="#fff" strokeWidth={6} fill="none" />
            <circle cx={-14} cy={-170} r={7} fill="#ff8fab" />
            <circle cx={14} cy={-150} r={7} fill="#ff8fab" />
            <circle cx={0} cy={-190} r={7} fill="#ff8fab" />
          </g>
        )}
        {variant === "tio" && (
          <g>
            <path d="M -40 -236 L 40 -236 L 48 -114 L -48 -114 Z" fill="#f5f5f5" />
            <text x={0} y={-160} fontSize={26} fontWeight={900} textAnchor="middle" fill="#c0392b" fontFamily="sans-serif">
              CHEF
            </text>
          </g>
        )}
        {variant === "adv" && (
          <g>
            <path d="M -20 -262 L 0 -200 L 20 -262 Z" fill="#fff" />
            <path d="M -7 -256 L 7 -256 L 10 -200 L 0 -186 L -10 -200 Z" fill="#c0392b" />
          </g>
        )}
        {variant === "dev" && <path d="M -30 -262 Q 0 -230 30 -262" stroke="#4834d4" strokeWidth={10} fill="none" />}
        {/* cabeça */}
        <g transform="translate(0 -318)">
          {variant === "avo" && <circle cx={0} cy={-66} r={26} fill={hr} />}
          <ellipse cx={0} cy={0} rx={54} ry={58} fill={sk} />
          {/* cabelo */}
          {variant === "avo" ? (
            <path d="M -56 -6 Q -60 -60 0 -62 Q 60 -60 56 -6 Q 40 -40 0 -40 Q -40 -40 -56 -6 Z" fill={hr} />
          ) : variant === "tio" ? (
            <path d="M -50 -24 Q -40 -62 0 -60 Q 40 -62 50 -24 Q 20 -44 -50 -24 Z" fill={hr} />
          ) : variant === "kid" ? (
            <g>
              <path d="M -54 -10 Q -56 -64 0 -64 Q 56 -64 54 -10 Q 30 -36 -54 -10 Z" fill={hr} />
              <path d="M -50 -34 Q 0 -80 50 -34 L 60 -20 Q 0 -50 -50 -26 Z" fill="#e74c3c" />
              <rect x={20} y={-38} width={56} height={14} rx={7} fill="#c0392b" transform="rotate(-8)" />
            </g>
          ) : (
            <path d="M -56 -2 Q -62 -66 0 -64 Q 62 -66 56 -2 Q 46 -30 10 -38 Q -30 -30 -56 -2 Z" fill={hr} />
          )}
          <Eye x={-20} y={-2} r={10} mood={mood} look={look} seed={seed + 1} />
          <Eye x={20} y={-2} r={10} mood={mood} look={look} seed={seed + 1} />
          <Brow x={-20} y={-22} w={22} mood={mood} side={1} color={variant === "avo" ? "#bbb" : "#2a1a10"} />
          <Brow x={20} y={-22} w={22} mood={mood} side={-1} color={variant === "avo" ? "#bbb" : "#2a1a10"} />
          {variant === "avo" && (
            <g fill="none" stroke="#7a4fa0" strokeWidth={3}>
              <circle cx={-20} cy={-2} r={16} />
              <circle cx={20} cy={-2} r={16} />
              <line x1={-4} y1={-3} x2={4} y2={-3} />
            </g>
          )}
          <ellipse cx={-34} cy={18} rx={9} ry={6} fill="#ff8f8f" opacity={0.45} />
          <ellipse cx={34} cy={18} rx={9} ry={6} fill="#ff8f8f" opacity={0.45} />
          <Mouth x={0} y={30} w={26} amp={amp} mood={mood} />
          {variant === "tio" && <path d="M -30 22 Q -16 8 0 18 Q 16 8 30 22 Q 14 30 0 24 Q -14 30 -30 22 Z" fill="#1e1410" />}
          {variant === "kid" && [-30, -24, 26, 32].map((fx, i) => <circle key={i} cx={fx} cy={10 + (i % 2) * 6} r={2.4} fill="#b5651d" />)}
        </g>
        <Arm x={50} y={-250} angle={armR} color={sh} hand={sk} len={105} w={24}>
          {holdR}
        </Arm>
      </g>
    </g>
  );
};

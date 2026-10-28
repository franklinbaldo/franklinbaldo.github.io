import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../lib/theme";
import { wobble } from "../lib/anim";
import { Arm, Brow, Eye, Mood, Mouth, useMouth } from "./parts";

/**
 * Lean, o Fiscal: baixinho, quadrado, de quepe e prancheta, com um carimbo enorme.
 * `stamp` 0..1: 0 = carimbo baixo, 1 = erguido no alto, pronto para descer.
 */
export const LeanChar: React.FC<{
  mood?: Mood;
  stamp?: number;
  tool?: "stamp" | "magnifier" | "none";
  clipboard?: boolean;
  look?: [number, number];
  mouth?: number;
  armL?: number;
  stampInk?: string;
}> = ({ mood = "serious", stamp = 0, tool = "stamp", clipboard = true, look = [0.4, 0], mouth, armL = -25, stampInk = C.red }) => {
  const frame = useCurrentFrame();
  const amp = useMouth("LEAN", mouth);
  const breathe = wobble(frame, 70, 1.5);
  const body = "#e9dcc4";
  const uniform = "#1d3d7a";
  const armAngle = tool === "stamp" ? 20 + stamp * 140 : tool === "magnifier" ? 95 : 15;
  return (
    <g>
      {/* pernas */}
      <rect x={-34} y={-70} width={26} height={66} rx={8} fill="#132a55" />
      <rect x={8} y={-70} width={26} height={66} rx={8} fill="#132a55" />
      <ellipse cx={-22} cy={-4} rx={24} ry={10} fill="#0b0f1d" />
      <ellipse cx={22} cy={-4} rx={24} ry={10} fill="#0b0f1d" />
      <g transform={`translate(0 ${breathe})`}>
        {/* braço de trás com prancheta */}
        <Arm x={-62} y={-170} angle={armL} color={uniform} hand={body} len={78} w={22}>
          {clipboard && (
            <g transform="rotate(-30) translate(-10 -20)">
              <rect x={-34} y={-46} width={68} height={92} rx={6} fill="#a87b4f" />
              <rect x={-28} y={-38} width={56} height={78} fill="#fff" />
              <rect x={-12} y={-52} width={24} height={12} rx={3} fill="#888" />
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <rect x={-22} y={-28 + i * 14} width={8} height={8} fill="none" stroke="#2a6fdb" strokeWidth={2} />
                  <line x1={-10} y1={-24 + i * 14} x2={22} y2={-24 + i * 14} stroke="#bbb" strokeWidth={3} />
                </g>
              ))}
            </g>
          )}
        </Arm>
        {/* corpo/uniforme */}
        <rect x={-66} y={-190} width={132} height={128} rx={26} fill={uniform} />
        <rect x={-66} y={-100} width={132} height={14} fill="#0f2650" />
        <rect x={-12} y={-102} width={24} height={18} rx={3} fill={C.yellow} />
        {/* distintivo */}
        <g transform="translate(-34 -150)">
          <path d="M 0 -16 L 14 -8 L 14 8 L 0 16 L -14 8 L -14 -8 Z" fill={C.yellow} stroke="#c99a00" strokeWidth={2} />
          <text x={0} y={7} fontSize={18} fontWeight={900} textAnchor="middle" fill={C.ink}>
            ⊢
          </text>
        </g>
        <rect x={20} y={-172} width={30} height={6} rx={3} fill="#9ab3e6" />
        {/* cabeça quadrada */}
        <g transform="translate(0 -262)">
          <rect x={-70} y={-66} width={140} height={132} rx={40} fill={body} stroke="#cdbb9b" strokeWidth={3} />
          <Eye x={-26} y={-6} r={12} mood={mood} look={look} seed={7} />
          <Eye x={26} y={-6} r={12} mood={mood} look={look} seed={7} />
          {/* monobrow severa */}
          <Brow x={-26} y={-30} w={34} mood={mood} side={1} color="#2b2118" thick={10} />
          <Brow x={26} y={-30} w={34} mood={mood} side={-1} color="#2b2118" thick={10} />
          {/* bigodinho de fiscal */}
          <path d="M -26 28 Q -12 16 0 24 Q 12 16 26 28 Q 12 34 0 30 Q -12 34 -26 28 Z" fill="#3a2a1e" />
          <Mouth x={0} y={42} w={24} amp={amp} mood={mood === "happy" ? "happy" : "neutral"} />
          {/* quepe */}
          <path d="M -76 -52 Q -70 -112 0 -116 Q 70 -112 76 -52 Z" fill={uniform} />
          <rect x={-80} y={-60} width={160} height={16} rx={6} fill="#0f2650" />
          <path d="M -70 -46 Q 0 -30 70 -46 L 86 -36 Q 0 -14 -86 -36 Z" fill="#0b1a38" />
          <g transform="translate(0 -84)">
            <circle r={17} fill={C.yellow} stroke="#c99a00" strokeWidth={2} />
            <text y={8} fontSize={24} fontWeight={900} textAnchor="middle" fill={C.ink}>
              ∀
            </text>
          </g>
        </g>
        {/* braço da frente com a ferramenta */}
        <Arm x={62} y={-170} angle={armAngle} color={uniform} hand={body} len={78} w={22}>
          {tool === "stamp" && (
            <g transform={`rotate(${armAngle}) translate(0 70)`}>
              <rect x={-12} y={-70} width={24} height={50} rx={10} fill="#8a4b2a" />
              <circle cx={0} cy={-76} r={16} fill="#a35a33" />
              <rect x={-44} y={-24} width={88} height={22} rx={4} fill="#5a3a22" />
              <rect x={-48} y={-4} width={96} height={14} rx={3} fill={stampInk} />
            </g>
          )}
          {tool === "magnifier" && (
            <g transform={`rotate(${armAngle - 30})`}>
              <rect x={-6} y={-46} width={12} height={50} rx={5} fill="#5a3a22" />
              <circle cx={0} cy={-80} r={34} fill="rgba(160,230,255,0.25)" stroke="#bfa36a" strokeWidth={8} />
              <path d="M -14 -96 Q -4 -104 8 -100" stroke="#fff" strokeWidth={4} fill="none" opacity={0.8} />
            </g>
          )}
        </Arm>
      </g>
    </g>
  );
};

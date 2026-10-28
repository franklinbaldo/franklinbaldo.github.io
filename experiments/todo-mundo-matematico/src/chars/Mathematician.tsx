import React from "react";
import { useCurrentFrame } from "remotion";
import { wobble } from "../lib/anim";
import { Arm, Brow, Eye, Mood, Mouth, useMouth } from "./parts";

/** O Matemático Tradicional: cabelo desgrenhado, barba, óculos, paletó de tweed. Pés em (0,0). */
export const Mathematician: React.FC<{
  mood?: Mood;
  armL?: number;
  armR?: number;
  holding?: "chalk" | "diploma" | "book" | "none";
  look?: [number, number];
  mouth?: number;
  sweat?: boolean;
}> = ({ mood = "smug", armL = 8, armR = 8, holding = "none", look = [0.3, 0], mouth, sweat }) => {
  const frame = useCurrentFrame();
  const amp = useMouth("MAT", mouth);
  const breathe = wobble(frame, 80, 2);
  const skin = "#f0c9a8";
  const jacket = "#7b5a3c";
  return (
    <g>
      {/* pernas */}
      <rect x={-46} y={-140} width={38} height={135} rx={10} fill="#3b3f52" />
      <rect x={8} y={-140} width={38} height={135} rx={10} fill="#3b3f52" />
      <ellipse cx={-30} cy={-4} rx={34} ry={13} fill="#1f1a17" />
      <ellipse cx={30} cy={-4} rx={34} ry={13} fill="#1f1a17" />
      <g transform={`translate(0 ${breathe})`}>
        {/* braço de trás */}
        <Arm x={-62} y={-300} angle={-armL} color={jacket} hand={skin} len={125} w={30} />
        {/* paletó */}
        <path d="M -78 -310 Q -92 -200 -70 -130 L 70 -130 Q 92 -200 78 -310 Q 0 -340 -78 -310 Z" fill={jacket} />
        <path d="M -30 -318 L 0 -230 L 30 -318 Z" fill="#f4f1ea" />
        <path d="M -14 -306 L 0 -296 L 14 -306 L 14 -286 L 0 -296 L -14 -286 Z" fill="#c0392b" />
        <ellipse cx={-70} cy={-210} rx={10} ry={20} fill="#5e4430" />
        <circle cx={0} cy={-205} r={5} fill="#3a2a1a" />
        <circle cx={0} cy={-170} r={5} fill="#3a2a1a" />
        {/* bolso com canetas */}
        <rect x={34} y={-270} width={30} height={26} rx={4} fill="#6a4c33" />
        <rect x={40} y={-286} width={5} height={22} fill="#2a6fdb" />
        <rect x={50} y={-290} width={5} height={26} fill="#d33" />
        {/* cabeça */}
        <g transform="translate(0 -378)">
          {/* cabelo desgrenhado */}
          {[-70, -52, -30, -6, 20, 44, 64].map((hx, i) => (
            <circle key={i} cx={hx} cy={-40 - Math.abs(Math.sin(i * 1.7)) * 26 + wobble(frame + i * 9, 50, 2)} r={26 + (i % 3) * 5} fill="#d9d9e3" />
          ))}
          <circle cx={-74} cy={-6} r={24} fill="#d9d9e3" />
          <circle cx={74} cy={-6} r={24} fill="#d9d9e3" />
          <ellipse cx={0} cy={0} rx={60} ry={68} fill={skin} />
          <ellipse cx={-62} cy={6} rx={10} ry={16} fill="#e3b493" />
          <ellipse cx={62} cy={6} rx={10} ry={16} fill="#e3b493" />
          {/* barba */}
          <path d="M -58 10 Q -64 96 0 118 Q 64 96 58 10 Q 40 40 0 44 Q -40 40 -58 10 Z" fill="#ececf3" />
          <Mouth x={0} y={48} w={30} amp={amp} mood={mood} color="#5a2a2a" />
          {/* bigode */}
          <path d="M -34 36 Q -16 22 0 32 Q 16 22 34 36 Q 18 44 0 38 Q -18 44 -34 36 Z" fill="#dcdce6" />
          <ellipse cx={0} cy={18} rx={10} ry={13} fill="#e8b08c" />
          <Eye x={-24} y={-8} r={10} mood={mood} look={look} seed={3} />
          <Eye x={24} y={-8} r={10} mood={mood} look={look} seed={3} />
          {/* óculos */}
          <g fill="none" stroke="#22222e" strokeWidth={4}>
            <circle cx={-24} cy={-8} r={20} />
            <circle cx={24} cy={-8} r={20} />
            <path d="M -4 -10 Q 0 -14 4 -10" />
            <line x1={-44} y1={-12} x2={-58} y2={-16} />
            <line x1={44} y1={-12} x2={58} y2={-16} />
          </g>
          <path d="M -36 -18 L -28 -24" stroke="#fff" strokeWidth={3} opacity={0.7} />
          <path d="M 12 -18 L 20 -24" stroke="#fff" strokeWidth={3} opacity={0.7} />
          <Brow x={-24} y={-36} w={30} mood={mood} side={1} color="#c8c8d4" thick={9} />
          <Brow x={24} y={-36} w={30} mood={mood} side={-1} color="#c8c8d4" thick={9} />
          {sweat && <path d="M 56 -34 q 8 14 0 20 q -8 -6 0 -20 Z" fill="#7fd3ff" transform={`translate(0 ${(frame % 30) * 0.8})`} />}
        </g>
        {/* braço da frente */}
        <Arm x={62} y={-300} angle={armR} color={jacket} hand={skin} len={125} w={30}>
          {holding === "chalk" && <rect x={-4} y={4} width={8} height={30} rx={3} fill="#fff" />}
          {holding === "diploma" && (
            <g transform="rotate(-80)">
              <rect x={-12} y={-60} width={24} height={120} rx={10} fill="#fff6dc" stroke="#c9a96b" strokeWidth={3} />
              <rect x={-14} y={-6} width={28} height={12} fill="#c0392b" />
            </g>
          )}
          {holding === "book" && (
            <g transform="rotate(10)">
              <rect x={-40} y={-10} width={80} height={100} rx={6} fill="#2c3e8c" />
              <rect x={-34} y={-4} width={68} height={88} fill="#3b55c4" />
              <text x={0} y={46} textAnchor="middle" fill="#ffd23f" fontSize={20} fontWeight={800}>
                ∑∫∂
              </text>
            </g>
          )}
        </Arm>
      </g>
    </g>
  );
};

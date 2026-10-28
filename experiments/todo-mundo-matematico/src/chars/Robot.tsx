import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../lib/theme";
import { wobble } from "../lib/anim";
import { Arm, useMouth } from "./parts";

export type RobotFace = "normal" | "happy" | "star" | "shock" | "sad" | "wink" | "love" | "dollar" | "think";
export type RobotGear = "party" | "shades" | "crown" | "cape" | "medals" | "trophy" | "megaphone";

const FaceEye: React.FC<{ x: number; face: RobotFace; frame: number }> = ({ x, face, frame }) => {
  const y = -10;
  const glow = { filter: "drop-shadow(0 0 8px #3de0ff)" };
  const blinkClosed = face === "normal" && frame % 110 < 3;
  switch (face) {
    case "happy":
      return <path d={`M ${x - 18} ${y + 6} Q ${x} ${y - 20} ${x + 18} ${y + 6}`} stroke={C.cyan} strokeWidth={8} fill="none" strokeLinecap="round" style={glow} />;
    case "star":
      return (
        <path
          transform={`translate(${x} ${y}) rotate(${frame * 4}) scale(${1 + 0.15 * Math.sin(frame / 4)})`}
          d="M0,-22 L6,-7 L22,-7 L9,3 L14,19 L0,9 L-14,19 L-9,3 L-22,-7 L-6,-7 Z"
          fill={C.yellow}
          style={{ filter: "drop-shadow(0 0 10px #ffd23f)" }}
        />
      );
    case "love":
      return <path transform={`translate(${x} ${y}) scale(${1 + 0.1 * Math.sin(frame / 3)})`} d="M0,14 C-26,-4 -14,-26 0,-12 C14,-26 26,-4 0,14 Z" fill={C.coral} style={{ filter: "drop-shadow(0 0 8px #ff6b6b)" }} />;
    case "dollar":
      return (
        <text x={x} y={y + 14} textAnchor="middle" fontSize={40} fontWeight={900} fill={C.yellow} style={{ filter: "drop-shadow(0 0 8px #ffd23f)" }}>
          !
        </text>
      );
    case "shock":
      return <circle cx={x} cy={y} r={16} fill="none" stroke={C.cyan} strokeWidth={7} style={glow} />;
    case "sad":
      return <path d={`M ${x - 16} ${y - 6} Q ${x} ${y + 10} ${x + 16} ${y - 6}`} stroke={C.cyan} strokeWidth={7} fill="none" strokeLinecap="round" style={glow} />;
    case "wink":
      return x < 0 ? (
        <line x1={x - 16} y1={y} x2={x + 16} y2={y} stroke={C.cyan} strokeWidth={8} strokeLinecap="round" style={glow} />
      ) : (
        <ellipse cx={x} cy={y} rx={13} ry={18} fill={C.cyan} style={glow} />
      );
    case "think":
      return <ellipse cx={x} cy={y - 6} rx={11} ry={9} fill={C.cyan} style={glow} />;
    default:
      return <ellipse cx={x} cy={y} rx={13} ry={blinkClosed ? 2 : 18} fill={C.cyan} style={glow} />;
  }
};

/** A IA: robozinho flutuante com tela-rosto. (0,0) = ponto abaixo do jato. */
export const Robot: React.FC<{
  face?: RobotFace;
  armL?: number;
  armR?: number;
  gear?: RobotGear[];
  mouth?: number;
  hover?: boolean;
  holdR?: React.ReactNode;
  holdL?: React.ReactNode;
}> = ({ face = "normal", armL = 20, armR = 20, gear = [], mouth, hover = true, holdR, holdL }) => {
  const frame = useCurrentFrame();
  const amp = useMouth("IA", mouth);
  const bob = hover ? wobble(frame, 46, 8) : 0;
  const has = (g: RobotGear) => gear.includes(g);
  const flame = 0.8 + 0.25 * Math.sin(frame * 1.3) + 0.1 * Math.sin(frame * 3.7);
  return (
    <g transform={`translate(0 ${bob})`}>
      {/* jato */}
      <path d={`M -22 -70 Q 0 ${-70 + 80 * flame} 22 -70 Z`} fill={C.yellow} opacity={0.9} />
      <path d={`M -12 -70 Q 0 ${-70 + 50 * flame} 12 -70 Z`} fill="#fff" opacity={0.9} />
      {has("cape") && <path d={`M -60 -230 Q ${-120 + wobble(frame, 30, 10)} -120 -90 -60 L 90 -60 Q ${120 + wobble(frame, 34, 10)} -120 60 -230 Z`} fill="#d62246" />}
      <Arm x={-66} y={-200} angle={-armL} color="#c9d6ea" hand="#e8f1ff" len={90} w={20}>
        {holdL}
      </Arm>
      {/* corpo */}
      <path d="M -70 -230 Q -80 -120 -40 -78 L 40 -78 Q 80 -120 70 -230 Q 0 -250 -70 -230 Z" fill="#e8f1ff" stroke="#9fb3d1" strokeWidth={4} />
      <circle cx={0} cy={-160} r={26} fill={C.navy} stroke={C.cyan} strokeWidth={5} />
      <circle cx={0} cy={-160} r={12 + 4 * Math.sin(frame / 6)} fill={C.cyan} opacity={0.85} />
      {has("medals") &&
        [-44, -22, 22, 44].map((mx, i) => (
          <g key={i} transform={`translate(${mx} ${-205 + (i % 2) * 8}) rotate(${wobble(frame + i * 7, 20, 8)})`}>
            <path d="M -6 -16 L 0 0 L 6 -16 Z" fill={["#d33", "#2a6fdb", "#2a9d4a", "#8e44ad"][i]} />
            <circle cx={0} cy={6} r={9} fill={C.yellow} stroke="#c99a00" strokeWidth={2} />
          </g>
        ))}
      {/* pescoço */}
      <rect x={-18} y={-262} width={36} height={22} rx={6} fill="#9fb3d1" />
      {/* cabeça/tela */}
      <g transform="translate(0 -330)">
        <line x1={0} y1={-70} x2={0} y2={-104} stroke="#9fb3d1" strokeWidth={6} />
        <circle cx={0} cy={-110} r={12} fill={frame % 20 < 10 ? C.yellow : "#ffef9e"} style={{ filter: "drop-shadow(0 0 10px #ffd23f)" }} />
        <rect x={-96} y={-72} width={192} height={144} rx={44} fill="#e8f1ff" stroke="#9fb3d1" strokeWidth={5} />
        <rect x={-78} y={-56} width={156} height={112} rx={32} fill="#071330" />
        <FaceEye x={-36} face={face} frame={frame} />
        <FaceEye x={36} face={face} frame={frame} />
        {/* boca em onda: reage ao áudio */}
        <path
          d={(() => {
            const w = 60;
            const pts: string[] = [];
            for (let i = 0; i <= 20; i++) {
              const px = -w / 2 + (w * i) / 20;
              const py = 30 + Math.sin(i * 0.9 + frame * 0.9) * amp * 12 * Math.sin((Math.PI * i) / 20);
              pts.push(`${i === 0 ? "M" : "L"} ${px} ${py + (face === "happy" || face === "star" ? -Math.sin((Math.PI * i) / 20) * -6 : 0)}`);
            }
            return pts.join(" ");
          })()}
          stroke={C.cyan}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px #3de0ff)" }}
        />
        <circle cx={-110} cy={0} r={14} fill="#c9d6ea" />
        <circle cx={110} cy={0} r={14} fill="#c9d6ea" />
        {has("shades") && (
          <g>
            <rect x={-82} y={-34} width={68} height={38} rx={12} fill="#111" />
            <rect x={14} y={-34} width={68} height={38} rx={12} fill="#111" />
            <rect x={-14} y={-24} width={28} height={8} fill="#111" />
            <line x1={-70} y1={-26} x2={-50} y2={-26} stroke="#fff" strokeWidth={4} opacity={0.6} />
          </g>
        )}
        {has("party") && (
          <g transform="translate(40 -66) rotate(18)">
            <path d="M -30 0 L 0 -90 L 30 0 Z" fill={C.coral} />
            <path d="M -20 -30 L 20 -30 M -12 -60 L 12 -60" stroke={C.yellow} strokeWidth={6} />
            <circle cx={0} cy={-92} r={10} fill={C.yellow} />
          </g>
        )}
        {has("crown") && (
          <g transform="translate(0 -72)">
            <path d="M -60 0 L -60 -50 L -30 -22 L 0 -60 L 30 -22 L 60 -50 L 60 0 Z" fill={C.yellow} stroke="#c99a00" strokeWidth={4} />
            <circle cx={0} cy={-26} r={8} fill={C.coral} />
          </g>
        )}
      </g>
      <Arm x={66} y={-200} angle={armR} color="#c9d6ea" hand="#e8f1ff" len={90} w={20}>
        {holdR}
        {has("trophy") && (
          <g transform="translate(0 -20)">
            <path d="M -26 -60 L 26 -60 Q 26 -20 0 -14 Q -26 -20 -26 -60 Z" fill={C.yellow} stroke="#c99a00" strokeWidth={3} />
            <rect x={-6} y={-14} width={12} height={16} fill="#c99a00" />
            <rect x={-18} y={0} width={36} height={8} rx={2} fill="#8a6a00" />
          </g>
        )}
        {has("megaphone") && (
          <g transform="rotate(-100) translate(0 -10)">
            <path d="M 0 -12 L 70 -40 L 70 40 L 0 12 Z" fill={C.coral} stroke="#a33" strokeWidth={3} />
            <rect x={-20} y={-12} width={22} height={24} rx={4} fill="#333" />
          </g>
        )}
      </Arm>
    </g>
  );
};

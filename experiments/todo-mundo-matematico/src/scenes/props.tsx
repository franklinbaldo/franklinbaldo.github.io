import React from "react";
import { useCurrentFrame } from "remotion";
import { C, display } from "../lib/theme";
import { wobble } from "../lib/anim";

/** A fortaleza MATEMÁTICA. `gate` 0 = portão fechado em pé, 1 = derrubado. `open` troca por oficina. */
export const Fortress: React.FC<{ gate?: number; workshop?: number }> = ({ gate = 0, workshop = 0 }) => {
  const frame = useCurrentFrame();
  const stone = "#3c4f86";
  const stoneDark = "#2c3b69";
  const flag = (x: number, y: number, c: string) => (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-3} y={-90} width={6} height={90} fill="#ddd" />
      <path d={`M 3 -90 Q 40 ${-84 + wobble(frame, 20, 6)} 70 -76 Q 40 ${-66 + wobble(frame, 24, 6)} 3 -60 Z`} fill={c} />
    </g>
  );
  return (
    <g>
      {/* torres */}
      {[760, 1640].map((tx, i) => (
        <g key={i}>
          <rect x={tx - 90} y={240} width={180} height={660} fill={stoneDark} />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={tx - 90 + k * 50} y={200} width={36} height={44} fill={stoneDark} />
          ))}
          <path d={`M ${tx - 110} 200 L ${tx} 60 L ${tx + 110} 200 Z`} fill="#c0392b" />
          {flag(tx, 64, i ? C.cyan : C.yellow)}
          <rect x={tx - 20} y={360} width={40} height={70} rx={20} fill={workshop > 0.5 ? C.yellow : "#0b1430"} />
        </g>
      ))}
      {/* muralha */}
      <rect x={850} y={330} width={700} height={570} fill={stone} />
      {Array.from({ length: 14 }).map((_, k) => (
        <rect key={k} x={850 + k * 50} y={296} width={34} height={40} fill={stone} />
      ))}
      {/* tijolos */}
      {Array.from({ length: 10 }).map((_, r) =>
        Array.from({ length: 7 }).map((__, k) => (
          <rect key={`${r}-${k}`} x={862 + k * 100 + (r % 2) * 50} y={350 + r * 52} width={84} height={40} rx={4} fill={stoneDark} opacity={0.35} />
        )),
      )}
      {/* faixa MATEMÁTICA */}
      <g transform={`translate(1200 ${400 + wobble(frame, 90, 3)})`}>
        <path d="M -330 -50 L 330 -50 L 300 0 L 330 50 L -330 50 L -300 0 Z" fill={workshop > 0.5 ? C.cyan : C.yellow} stroke={C.ink} strokeWidth={6} />
        <text x={0} y={22} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={66} fill={C.ink}>
          {workshop > 0.5 ? "OFICINA ABERTA" : "MATEMÁTICA"}
        </text>
      </g>
      {/* arco do portão */}
      <path d="M 1060 900 L 1060 640 Q 1200 520 1340 640 L 1340 900 Z" fill="#0a1128" />
      {workshop > 0.5 && <path d="M 1060 900 L 1060 640 Q 1200 520 1340 640 L 1340 900 Z" fill="#ffd23f" opacity={0.35} />}
      {/* portão de madeira: cai para trás quando gate → 1 */}
      {gate < 1.05 && (
        <g transform={`translate(1330 900) rotate(${gate * 90}) translate(-1330 -900)`} opacity={workshop > 0.5 ? 0 : 1}>
          <path d="M 1070 900 L 1070 646 Q 1200 536 1330 646 L 1330 900 Z" fill="#8a5a2b" stroke="#4a2e12" strokeWidth={8} />
          {[1110, 1160, 1210, 1260, 1300].map((gx) => (
            <line key={gx} x1={gx} y1={600} x2={gx} y2={900} stroke="#5d3a17" strokeWidth={6} />
          ))}
          <rect x={1070} y={700} width={260} height={18} fill="#3a3a44" />
          <rect x={1070} y={820} width={260} height={18} fill="#3a3a44" />
          <circle cx={1290} cy={770} r={12} fill={C.yellow} />
          <text x={1200} y={790} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={30} fill="#f3e2c0">
            PROIBIDA
          </text>
          <text x={1200} y={815} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={22} fill="#f3e2c0">
            A ENTRADA
          </text>
        </g>
      )}
    </g>
  );
};

/** Chão com grama estilizada. */
export const Ground: React.FC<{ y?: number; x0?: number; x1?: number; color?: string }> = ({ y = 900, x0 = -2000, x1 = 4000, color = "#14306b" }) => (
  <g>
    <rect x={x0} y={y} width={x1 - x0} height={800} fill={color} />
    <rect x={x0} y={y} width={x1 - x0} height={10} fill={C.cyan} opacity={0.35} />
  </g>
);

/** Placa de madeira com texto. */
export const Sign: React.FC<{ x: number; y: number; text: string; w?: number; rot?: number; size?: number; color?: string; textColor?: string; post?: boolean }> = ({
  x,
  y,
  text,
  w = 300,
  rot = 0,
  size = 34,
  color = "#f3e2c0",
  textColor = C.ink,
  post = true,
}) => {
  const lines = text.split("\n");
  const h = lines.length * size * 1.15 + 30;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {post && <rect x={-8} y={0} width={16} height={130} fill="#6b4520" />}
      <rect x={-w / 2} y={-h} width={w} height={h} rx={10} fill={color} stroke="#6b4520" strokeWidth={6} />
      {lines.map((ln, i) => (
        <text key={i} x={0} y={-h + 18 + size * 0.9 + i * size * 1.15} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={size} fill={textColor}>
          {ln}
        </text>
      ))}
    </g>
  );
};

/** A máquina da IA: trator com aríete em forma de lápis gigante. (0,0) = centro da base. */
export const Machine: React.FC<{ children?: React.ReactNode; ram?: number }> = ({ children, ram = 0 }) => {
  const frame = useCurrentFrame();
  const spin = (frame * 12) % 360;
  return (
    <g>
      {/* esteiras */}
      <rect x={-300} y={-110} width={600} height={110} rx={55} fill="#2b2b36" />
      {[-240, -120, 0, 120, 240].map((wx) => (
        <g key={wx} transform={`translate(${wx} -55) rotate(${spin})`}>
          <circle r={42} fill="#555" stroke="#888" strokeWidth={6} />
          <rect x={-6} y={-40} width={12} height={80} fill="#777" />
        </g>
      ))}
      {/* corpo */}
      <path d="M -280 -110 L -260 -300 L 160 -300 L 260 -200 L 280 -110 Z" fill={C.yellow} stroke="#9c7a00" strokeWidth={8} />
      <rect x={-220} y={-260} width={150} height={80} rx={12} fill="#0b1430" />
      <text x={40} y={-170} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={58} fill={C.ink}>
        IA 3000
      </text>
      {/* sirenes */}
      {[-180, 60].map((sx, i) => (
        <g key={sx}>
          <rect x={sx - 22} y={-334} width={44} height={36} rx={10} fill={(Math.floor(frame / 5) + i) % 2 ? C.red : "#ff9aa5"} />
          <circle cx={sx} cy={-318} r={60} fill={(Math.floor(frame / 5) + i) % 2 ? C.red : C.cyan} opacity={0.18} />
        </g>
      ))}
      {/* cabine (o robô vai aqui) */}
      <g transform="translate(-60 -300)">{children}</g>
      {/* aríete: lápis gigante */}
      <g transform={`translate(${250 + ram * 60} -200)`}>
        <rect x={0} y={-36} width={300} height={72} fill={C.orange} stroke="#9a5a10" strokeWidth={6} />
        <rect x={0} y={-36} width={40} height={72} fill="#f48fb1" stroke="#9a5a10" strokeWidth={6} />
        <rect x={40} y={-36} width={26} height={72} fill="#bbb" />
        <path d="M 300 -36 L 400 0 L 300 36 Z" fill="#f3d9a4" stroke="#9a5a10" strokeWidth={6} />
        <path d="M 366 -12 L 400 0 L 366 12 Z" fill="#333" />
        <text x={180} y={14} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={34} fill={C.ink}>
          ∀x ∃y
        </text>
      </g>
    </g>
  );
};

/** Nuvem de poeira. */
export const Dust: React.FC<{ at: number; x: number; y: number; n?: number; size?: number }> = ({ at, x, y, n = 14, size = 1 }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 70) return null;
  return (
    <g opacity={1 - t / 70}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI;
        const r = (30 + t * 4) * size;
        return <circle key={i} cx={x + Math.cos(a) * r * 1.6 * (i % 2 ? 1 : -1)} cy={y - Math.sin(a) * r * 0.6} r={(30 + t * 1.2) * size} fill="#b9c3dd" opacity={0.5} />;
      })}
    </g>
  );
};

/** Lâmpada de ideia. */
export const Bulb: React.FC<{ x: number; y: number; s?: number; on?: boolean }> = ({ x, y, s = 1, on = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {on && <circle r={46} fill={C.yellow} opacity={0.25} />}
    <circle r={28} fill={on ? C.yellow : "#ccc"} stroke={C.ink} strokeWidth={4} />
    <rect x={-12} y={24} width={24} height={18} rx={4} fill="#9aa" stroke={C.ink} strokeWidth={3} />
    {on && <path d="M -8 4 L 0 -8 L 8 4" stroke="#b48a00" strokeWidth={3} fill="none" />}
  </g>
);

/** Bolinha (cena 5). */
export const Ball: React.FC<{ x: number; y: number; r?: number; color?: string; face?: "happy" | "sad" | "none" }> = ({ x, y, r = 26, color = C.cyan, face = "none" }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={color} stroke={C.ink} strokeWidth={r / 7} />
    <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.22} fill="#fff" opacity={0.6} />
    {face !== "none" && (
      <g>
        <circle cx={-r * 0.3} cy={-r * 0.05} r={r * 0.09} fill={C.ink} />
        <circle cx={r * 0.3} cy={-r * 0.05} r={r * 0.09} fill={C.ink} />
        <path
          d={face === "happy" ? `M ${-r * 0.3} ${r * 0.25} Q 0 ${r * 0.5} ${r * 0.3} ${r * 0.25}` : `M ${-r * 0.3} ${r * 0.45} Q 0 ${r * 0.2} ${r * 0.3} ${r * 0.45}`}
          stroke={C.ink}
          strokeWidth={r / 9}
          fill="none"
        />
      </g>
    )}
  </g>
);

/** Coxinha estilizada. */
export const Coxinha: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0 -34 Q 26 -6 24 14 Q 20 30 0 30 Q -20 30 -24 14 Q -26 -6 0 -34 Z" fill="#e8a33d" stroke="#8a5a10" strokeWidth={3} />
    <circle cx={-6} cy={6} r={3} fill="#b77a1f" />
    <circle cx={8} cy={-4} r={3} fill="#b77a1f" />
    <circle cx={2} cy={16} r={3} fill="#b77a1f" />
  </g>
);

/** Bolo de festa. */
export const Cake: React.FC<{ x: number; y: number; s?: number; slices?: number }> = ({ x, y, s = 1, slices = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={130} ry={26} fill="#ddd" />
    <rect x={-110} y={-110} width={220} height={110} fill="#f7c6d9" />
    <ellipse cx={0} cy={0} rx={110} ry={20} fill="#e9a6c1" />
    <rect x={-110} y={-70} width={220} height={18} fill="#8b4a2b" />
    <ellipse cx={0} cy={-110} rx={110} ry={22} fill="#fff1f6" />
    {[-70, -35, 0, 35, 70].map((cx, i) => (
      <g key={i}>
        <rect x={cx - 5} y={-150} width={10} height={36} fill={[C.cyan, C.yellow, C.coral, C.green, C.purple][i]} />
        <path d={`M ${cx} -166 q 8 8 0 14 q -8 -6 0 -14 Z`} fill={C.orange} />
      </g>
    ))}
    {Array.from({ length: slices }).map((_, i) => (
      <line key={i} x1={0} y1={-110} x2={Math.cos((i / slices) * Math.PI * 2) * 110} y2={-110 + Math.sin((i / slices) * Math.PI * 2) * 22} stroke="#c06" strokeWidth={2} />
    ))}
  </g>
);

/** Churrasqueira. */
export const Grill: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${-60 + i * 50} -150 q ${wobble(frame, 20, 14, i * 9)} -40 0 -80 q ${-wobble(frame, 24, 12, i * 5)} -30 0 -60`}
          stroke="#cfd6e6"
          strokeWidth={10}
          fill="none"
          opacity={0.35}
          strokeLinecap="round"
        />
      ))}
      <rect x={-120} y={-150} width={240} height={70} rx={10} fill="#333" />
      {[-80, -20, 40].map((mx, i) => (
        <rect key={i} x={mx} y={-168} width={50} height={22} rx={10} fill={["#8e3b1f", "#a0482a", "#7a2f17"][i]} />
      ))}
      <rect x={-130} y={-156} width={260} height={8} fill="#888" />
      <rect x={-100} y={-80} width={14} height={80} fill="#444" />
      <rect x={86} y={-80} width={14} height={80} fill="#444" />
      <path d="M -110 -86 L 110 -86" stroke="#ff6b35" strokeWidth={6} opacity={0.6 + 0.3 * Math.sin(frame / 3)} />
    </g>
  );
};

/** Troféu. */
export const Trophy: React.FC<{ x: number; y: number; s?: number; label?: string }> = ({ x, y, s = 1, label }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -60 -170 L 60 -170 Q 60 -80 0 -66 Q -60 -80 -60 -170 Z" fill={C.yellow} stroke="#c99a00" strokeWidth={6} />
    <path d="M -60 -150 Q -100 -140 -60 -100" stroke="#c99a00" strokeWidth={10} fill="none" />
    <path d="M 60 -150 Q 100 -140 60 -100" stroke="#c99a00" strokeWidth={10} fill="none" />
    <rect x={-12} y={-68} width={24} height={34} fill="#c99a00" />
    <rect x={-50} y={-36} width={100} height={36} rx={6} fill="#6b4a00" />
    <text x={0} y={-112} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={44} fill="#8a6500">
      1º
    </text>
    {label && (
      <text x={0} y={-10} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={13} fill={C.yellow}>
        {label}
      </text>
    )}
  </g>
);

/** Pilha de papéis (processo). */
export const PaperStack: React.FC<{ x: number; y: number; h: number; label?: string }> = ({ x, y, h, label }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: Math.max(1, Math.floor(h / 14)) }).map((_, i) => (
      <rect key={i} x={-150 + ((i * 7) % 11) - 5} y={-14 * (i + 1)} width={300} height={14} fill={i % 2 ? "#f4f4f8" : "#e3e6ef"} stroke="#9aa3ba" strokeWidth={1.5} />
    ))}
    {label && (
      <g transform={`translate(0 ${-h / 2})`}>
        <rect x={-130} y={-34} width={260} height={68} fill={C.white} stroke={C.ink} strokeWidth={4} />
        <text x={0} y={-4} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={24} fill={C.ink}>
          {label.split("\n")[0]}
        </text>
        <text x={0} y={24} textAnchor="middle" fontFamily={display} fontWeight={800} fontSize={20} fill={C.red}>
          {label.split("\n")[1]}
        </text>
      </g>
    )}
  </g>
);

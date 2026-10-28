import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { C, body, display, mono } from "../lib/theme";
import { kf, pop, ramp, shake, wobble } from "../lib/anim";
import { getLine, getScene } from "../lib/timeline";
import { useSceneStart } from "../lib/scene";

export type SfxName =
  | "boing" | "buzzer" | "click" | "collapse" | "confetti" | "crash" | "crickets" | "ding" | "drumroll"
  | "page-turn" | "pop" | "record-scratch" | "siren" | "slide-down" | "slide-up" | "sparkle" | "stamp"
  | "success" | "thud" | "typing" | "whoosh" | "zap";

/** Efeito sonoro disparado no frame `at` (relativo à cena). */
export const Sfx: React.FC<{ at: number; name: SfxName; volume?: number }> = ({ at, name, volume = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={150} name={`sfx:${name}`} layout="none">
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

/** Câmera: keyframes [frame, zoom, cx, cy]; o ponto (cx, cy) fica no centro da tela. */
export const Camera: React.FC<{ keys: [number, number, number, number][]; children: React.ReactNode; shakeAt?: [number, number, number][] }> = ({
  keys,
  children,
  shakeAt = [],
}) => {
  const frame = useCurrentFrame();
  const fs = keys.map((k) => k[0]);
  const ease = Easing.inOut(Easing.cubic);
  const z = keys.length > 1 ? interpolate(frame, fs, keys.map((k) => k[1]), { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) : keys[0][1];
  const cx = keys.length > 1 ? interpolate(frame, fs, keys.map((k) => k[2]), { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) : keys[0][2];
  const cy = keys.length > 1 ? interpolate(frame, fs, keys.map((k) => k[3]), { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }) : keys[0][3];
  let sx = 0;
  let sy = 0;
  for (const [at, dur, power] of shakeAt) {
    if (frame >= at && frame < at + dur) {
      const k = 1 - (frame - at) / dur;
      const [a, b] = shake(frame, power * k, at);
      sx += a;
      sy += b;
    }
  }
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: `translate(${960 + sx}px, ${540 + sy}px) scale(${z}) translate(${-cx}px, ${-cy}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Um <svg> do tamanho do quadro, para desenhar dentro da câmera. */
export const Stage: React.FC<{ children: React.ReactNode; w?: number; h?: number; x?: number; y?: number }> = ({ children, w = 1920, h = 1080, x = 0, y = 0 }) => (
  <svg viewBox={`${x} ${y} ${w} ${h}`} width={w} height={h} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
    {children}
  </svg>
);

const GLYPHS = ["∀", "∃", "π", "∑", "∫", "≤", "√", "∞", "⊢", "λ", "≠", "∈", "Δ", "φ", "ℕ", "→", "∧", "∨"];

/** Fundo azul-noite com símbolos matemáticos flutuando. */
export const Backdrop: React.FC<{ glyphs?: boolean; tint?: string; density?: number }> = ({ glyphs = true, tint = C.navy, density = 28 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 35%, ${tint} 0%, ${C.night} 75%)` }}>
      {glyphs &&
        Array.from({ length: density }).map((_, i) => {
          const x = (i * 739) % 1920;
          const speed = 0.15 + ((i * 7) % 10) / 30;
          const y = (((i * 389) % 1300) - frame * speed + 1300 * 10) % 1300 - 110;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x + wobble(frame, 200, 20, i * 31),
                top: y,
                fontFamily: display,
                fontSize: 30 + ((i * 13) % 50),
                color: i % 4 === 0 ? C.cyan : C.white,
                opacity: 0.06 + ((i * 3) % 5) / 60,
                rotate: `${wobble(frame, 300, 15, i * 17)}deg`,
              }}
            >
              {GLYPHS[i % GLYPHS.length]}
            </div>
          );
        })}
    </AbsoluteFill>
  );
};

/** Balão de fala ligado a uma fala do roteiro: aparece no início e some no fim. */
export const Bubble: React.FC<{
  line: string;
  x: number;
  y: number;
  w?: number;
  side?: "left" | "right";
  color?: string;
  textColor?: string;
  size?: number;
  shout?: boolean;
  text?: string;
  hold?: number;
}> = ({ line, x, y, w = 560, side = "left", color = C.white, textColor = C.ink, size = 40, shout, text, hold = 12 }) => {
  const frame = useCurrentFrame();
  const sceneStart = useSceneStart();
  const l = getLine(line);
  const a = l.start - sceneStart;
  const b = l.end - sceneStart + hold;
  if (frame < a - 2 || frame > b + 8) return null;
  const sIn = pop(frame, a - 2, 30, 10, 0.5);
  const sOut = 1 - ramp(frame, b, b + 8);
  const s = sIn * sOut;
  const [jx, jy] = shout ? shake(frame, 3) : [0, 0];
  const tail = side === "left" ? { left: 40 } : { right: 40 };
  return (
    <div
      style={{
        position: "absolute",
        left: side === "left" ? x - 60 : x - w + 60,
        top: y,
        width: w,
        transform: `translate(${jx}px, ${jy - 100}%) scale(${s})`,
        transformOrigin: side === "left" ? "60px 100%" : `${w - 60}px 100%`,
      }}
    >
      <div
        style={{
          background: color,
          color: textColor,
          borderRadius: 34,
          padding: "22px 30px",
          fontFamily: body,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.15,
          boxShadow: "0 10px 0 rgba(0,0,0,0.25)",
          border: `5px solid ${C.ink}`,
          textAlign: "center",
          textTransform: shout ? "uppercase" : undefined,
          marginBottom: 34,
        }}
      >
        {text ?? l.text}
      </div>
      <svg width={60} height={44} style={{ position: "absolute", bottom: 0, ...tail }} viewBox="0 0 60 44">
        <path d={side === "left" ? "M 4 0 L 20 44 L 44 0 Z" : "M 16 0 L 40 44 L 56 0 Z"} fill={color} stroke={C.ink} strokeWidth={5} />
        <rect x={0} y={0} width={60} height={6} fill={color} />
      </svg>
    </div>
  );
};

/** Carimbo gigante que despenca no frame `at`. */
export const StampMark: React.FC<{
  at: number;
  text: string;
  x?: number;
  y?: number;
  color?: string;
  rot?: number;
  size?: number;
  until?: number;
  sfx?: boolean;
}> = ({ at, text, x = 960, y = 540, color = C.red, rot = -12, size = 110, until = 99999, sfx = true }) => {
  const frame = useCurrentFrame();
  if (frame < at - 6 || frame > until) return sfx ? <Sfx at={at} name="stamp" volume={0.8} /> : null;
  const p = interpolate(frame, [at - 6, at], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const scale = interpolate(p, [0, 1], [3.2, 1]);
  const opacity = interpolate(p, [0, 0.6, 1], [0, 0.5, 1]);
  const fade = frame > until - 6 ? 1 - (frame - (until - 6)) / 6 : 1;
  return (
    <>
      {sfx && <Sfx at={at} name="stamp" volume={0.8} />}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
          opacity: opacity * fade,
          border: `${size / 10}px solid ${color}`,
          borderRadius: size / 5,
          padding: `${size / 8}px ${size / 3}px`,
          color,
          fontFamily: display,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: 2,
          whiteSpace: "nowrap",
          textTransform: "uppercase",
          filter: "url(#stampInk)",
          mixBlendMode: "normal",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        {text}
      </div>
    </>
  );
};

/** Filtro SVG de "tinta de carimbo" (precisa existir uma vez no documento). */
export const InkFilter: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id="stampInk">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" result="mask" />
      <feComposite in="SourceGraphic" in2="mask" operator="in" />
    </filter>
  </svg>
);

/** Explosão de confete a partir do frame `at`. */
export const Confetti: React.FC<{ at: number; x?: number; y?: number; n?: number; spread?: number; dur?: number; sfx?: boolean }> = ({
  at,
  x = 960,
  y = 400,
  n = 90,
  spread = 1,
  dur = 110,
  sfx = true,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  const colors = [C.yellow, C.cyan, C.coral, C.green, C.purple, C.white, C.orange];
  return (
    <>
      {sfx && <Sfx at={at} name="confetti" volume={0.45} />}
      {t >= 0 && t <= dur && (
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          {Array.from({ length: n }).map((_, i) => {
            const ang = (i * 137.5 * Math.PI) / 180;
            const v = (9 + ((i * 53) % 13)) * spread;
            const px = x + Math.cos(ang) * v * t * 1.1;
            const py = y + Math.sin(ang) * v * t * 0.8 - 18 * t + 0.55 * t * t;
            const r = (t * (10 + (i % 7) * 3)) % 360;
            const o = 1 - Math.max(0, (t - dur * 0.7) / (dur * 0.3));
            return <rect key={i} x={px} y={py} width={14} height={8} fill={colors[i % colors.length]} transform={`rotate(${r} ${px} ${py})`} opacity={o} />;
          })}
        </svg>
      )}
    </>
  );
};

/** Texto grande que entra com mola. */
export const PopText: React.FC<{
  at: number;
  until?: number;
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  rot?: number;
  font?: string;
  stroke?: boolean;
  width?: number;
  plate?: boolean;
}> = ({ at, until = 99999, x, y, children, size = 84, color = C.white, rot = 0, font = display, stroke = true, width, plate }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > until + 8) return null;
  const s = pop(frame, at) * (1 - ramp(frame, until, until + 8));
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: font,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.05,
        color,
        textAlign: "center",
        whiteSpace: width ? "normal" : "nowrap",
        WebkitTextStroke: stroke ? `${Math.max(2, size / 22)}px ${C.ink}` : undefined,
        paintOrder: "stroke fill",
        textShadow: stroke ? `0 ${size / 14}px 0 ${C.ink}` : undefined,
        ...(plate ? { background: "rgba(7, 19, 48, 0.88)", border: `6px solid ${C.cyan}`, borderRadius: 40, padding: "18px 40px 26px", boxShadow: `0 0 60px ${C.cyan}66` } : {}),
      }}
    >
      {children}
    </div>
  );
};

/** Legendas da narração (falas de personagens já aparecem em balões). */
export const Captions: React.FC<{ chunks: { text: string; startMs: number; endMs: number; who: string }[] }> = ({ chunks }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const cur = chunks.find((c) => c.who === "N" && ms >= c.startMs && ms < c.endMs + 150);
  if (!cur) return null;
  const inF = ((ms - cur.startMs) / 1000) * fps;
  const o = Math.min(1, inF / 3);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 46, display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          background: "rgba(5, 12, 32, 0.78)",
          color: C.white,
          fontFamily: body,
          fontWeight: 800,
          fontSize: 46,
          padding: "10px 30px 14px",
          borderRadius: 18,
          maxWidth: 1500,
          textAlign: "center",
          lineHeight: 1.2,
          border: `2px solid rgba(61, 224, 255, 0.35)`,
        }}
      >
        {cur.text}
      </div>
    </div>
  );
};

/** Cartão de abertura de cada cena (número + título), discreto, no canto. */
export const SceneTag: React.FC<{ scene: string; n: number }> = ({ scene, n }) => {
  const frame = useCurrentFrame();
  const title = getScene(scene).title;
  const o = kf(frame, [0, 12, 100, 120], [0, 1, 1, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 56,
        opacity: o,
        translate: `${(1 - ramp(frame, 0, 18)) * -40}px 0`,
        fontFamily: display,
        color: C.white,
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div style={{ background: C.yellow, color: C.ink, fontWeight: 800, fontSize: 34, borderRadius: 14, padding: "0 16px" }}>{n}</div>
      <div style={{ fontWeight: 800, fontSize: 38, textShadow: `0 3px 0 ${C.ink}` }}>{title}</div>
    </div>
  );
};

/** Bloco de código com destaque de linhas. */
export const CodePanel: React.FC<{
  code: string;
  x: number;
  y: number;
  w: number;
  size?: number;
  title?: string;
  highlight?: number[];
  reveal?: number;
  border?: string;
}> = ({ code, x, y, w, size = 30, title, highlight = [], reveal = 1, border = C.cyan }) => {
  const lines = code.replace(/\n+$/, "").split("\n");
  const shown = Math.ceil(lines.length * reveal);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        background: "#081026",
        border: `4px solid ${border}`,
        borderRadius: 22,
        boxShadow: `0 0 40px ${border}55, 0 18px 0 rgba(0,0,0,0.35)`,
        overflow: "hidden",
      }}
    >
      {title && (
        <div style={{ background: "#0f1d44", padding: "10px 22px", fontFamily: body, fontWeight: 800, fontSize: size * 0.8, color: C.cyanSoft, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ color: C.coral }}>●</span>
          <span style={{ color: C.yellow }}>●</span>
          <span style={{ color: C.green }}>●</span>
          <span style={{ marginLeft: 12 }}>{title}</span>
        </div>
      )}
      <div style={{ padding: "16px 22px", fontFamily: mono, fontSize: size, lineHeight: 1.45, whiteSpace: "pre", color: C.white }}>
        {lines.slice(0, shown).map((ln, i) => (
          <div key={i} style={{ background: highlight.includes(i) ? "rgba(255, 210, 63, 0.18)" : "transparent", borderRadius: 6, boxShadow: highlight.includes(i) ? `inset 6px 0 0 ${C.yellow}` : undefined, paddingLeft: 8 }}>
            {colorize(ln)}
          </div>
        ))}
      </div>
    </div>
  );
};

const KEYWORDS = /\b(theorem|def|example|by|exact|refine|obtain|rw|decide|rfl|Prop|Nat|fun|let|have|show)\b/g;

const colorize = (ln: string): React.ReactNode => {
  const ci = ln.indexOf("--");
  const code = ci >= 0 ? ln.slice(0, ci) : ln;
  const comment = ci >= 0 ? ln.slice(ci) : "";
  if (/^\s*(\/-|-\/)/.test(ln) || /^\s{2,}"/.test(ln)) return <span style={{ color: "#7f8fb8" }}>{ln}</span>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  code.replace(KEYWORDS, (m, _g, off: number) => {
    parts.push(code.slice(last, off));
    parts.push(
      <span key={off} style={{ color: ["Prop", "Nat"].includes(m) ? C.green : C.coral, fontWeight: 700 }}>
        {m}
      </span>,
    );
    last = off + m.length;
    return m;
  });
  parts.push(code.slice(last));
  return (
    <>
      {parts}
      {comment && <span style={{ color: "#7f8fb8" }}>{comment}</span>}
    </>
  );
};

/** Terminal que digita um comando e depois mostra a saída real. */
export const Terminal: React.FC<{
  x: number;
  y: number;
  w: number;
  cmd: string;
  output: string;
  typeAt: number;
  outAt: number;
  size?: number;
  ok?: boolean;
}> = ({ x, y, w, cmd, output, typeAt, outAt, size = 30, ok = true }) => {
  const frame = useCurrentFrame();
  const typed = Math.max(0, Math.min(cmd.length, Math.floor((frame - typeAt) * 1.2)));
  const showOut = frame >= outAt;
  const cursor = Math.floor(frame / 15) % 2 === 0 ? "▌" : " ";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        background: "#040915",
        border: `4px solid ${showOut ? (ok ? C.green : C.red) : "#3a4a78"}`,
        borderRadius: 18,
        padding: "18px 24px",
        fontFamily: mono,
        fontSize: size,
        color: "#d6e2ff",
        lineHeight: 1.45,
        whiteSpace: "pre-wrap",
        boxShadow: showOut ? `0 0 50px ${ok ? C.green : C.red}66` : "none",
      }}
    >
      <span style={{ color: C.green }}>$ </span>
      {cmd.slice(0, typed)}
      {!showOut && cursor}
      {showOut && <div style={{ color: ok ? "#c9ffd9" : "#ffc9cf", marginTop: 8 }}>{output}</div>}
    </div>
  );
};

/** Faixa/flash branco curto para cortes de impacto. */
export const Flash: React.FC<{ at: number; dur?: number; color?: string }> = ({ at, dur = 8, color = "#fff" }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + dur) return null;
  return <AbsoluteFill style={{ background: color, opacity: 1 - (frame - at) / dur }} />;
};

/** Escurece/clareia nas bordas da cena. */
export const SceneFade: React.FC<{ length: number; inF?: number; outF?: number }> = ({ length, inF = 8, outF = 8 }) => {
  const frame = useCurrentFrame();
  const o = Math.max(inF ? 1 - frame / inF : 0, outF ? (frame - (length - outF)) / outF : 0);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: C.night, opacity: Math.min(1, o) }} />;
};

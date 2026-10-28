import timelineJson from "../generated/timeline.json";

export type Who = "N" | "MAT" | "PES" | "IA" | "LEAN" | "AVO" | "KID" | "TIO" | "ADV";

type Word = { text: string; startMs: number; endMs: number };
export type Line = {
  id: string;
  who: Who;
  scene: string;
  text: string;
  start: number;
  end: number;
  words: Word[];
  amp: number[];
};
export type CaptionChunk = { text: string; startMs: number; endMs: number; who: Who };
type Scene = { id: string; title: string; start: number; end: number };

export const timeline = timelineJson as unknown as {
  fps: number;
  durationInFrames: number;
  scenes: Scene[];
  lines: Line[];
  captions: CaptionChunk[];
};

export const FPS = timeline.fps;

const lineById = new Map(timeline.lines.map((l) => [l.id, l]));
const sceneById = new Map(timeline.scenes.map((s) => [s.id, s]));

export const getScene = (id: string): Scene => {
  const s = sceneById.get(id);
  if (!s) throw new Error(`cena desconhecida: ${id}`);
  return s;
};

export const getLine = (id: string): Line => {
  const l = lineById.get(id);
  if (!l) throw new Error(`fala desconhecida: ${id}`);
  return l;
};

const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9-]/g, "");

/** Cues relativos ao início da cena: c("s1_a").start, c("s1_a").end, c.word("s1_a", "notícia"). */
export const makeCues = (sceneId: string) => {
  const s0 = getScene(sceneId).start;
  const fn = (lineId: string) => {
    const l = getLine(lineId);
    return { start: l.start - s0, end: l.end - s0, dur: l.end - l.start };
  };
  /** Frame (relativo à cena) em que a palavra começa a ser falada. */
  fn.word = (lineId: string, needle: string, nth = 0) => {
    const l = getLine(lineId);
    const target = norm(needle);
    const hits = l.words.filter((w) => norm(w.text).startsWith(target));
    const w = hits[nth] ?? hits[hits.length - 1];
    if (!w) throw new Error(`palavra "${needle}" não encontrada em ${lineId}`);
    return Math.round((w.startMs / 1000) * timeline.fps) - s0;
  };
  fn.sceneLength = getScene(sceneId).end - s0;
  return fn;
};

/** Amplitude da voz de `who` no frame absoluto `abs` (0..1), para mexer a boca. */
export const mouthAmp = (who: Who, abs: number): number => {
  for (const l of timeline.lines) {
    if (l.who !== who) continue;
    if (abs >= l.start && abs < l.start + l.amp.length) {
      return l.amp[abs - l.start] ?? 0;
    }
  }
  return 0;
};

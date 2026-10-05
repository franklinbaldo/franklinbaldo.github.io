// Loads /fly-shader/'s own sim.js and the MaleCNS artifacts it reads in the
// browser, for the headless assays. Hashes go into every results file so a
// number can be traced back to the exact connectome and eye table behind it.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const PUBLIC = new URL("../public/", import.meta.url);
export const RESULTS = new URL("fly-shader-results/", import.meta.url);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function loadSim() {
  return import(new URL("fly-shader/sim.js", PUBLIC).href);
}

export async function loadWorld() {
  return import(new URL("fly-shader/world.js", PUBLIC).href);
}

// Same FlatBuffer layout app.js reads in the browser.
export function loadConnectome() {
  const raw = readFileSync(new URL("flydoom/malecns_l3_compact.mcns", PUBLIC));
  const buffer = raw.buffer.slice(
    raw.byteOffset,
    raw.byteOffset + raw.byteLength
  );
  const view = new DataView(buffer);
  const root = view.getUint32(0, true);
  const vtable = root - view.getInt32(root, true);
  const vtableLen = view.getUint16(vtable, true);
  const getVector = (fieldIndex, ArrayType) => {
    const offset = 4 + fieldIndex * 2;
    if (offset >= vtableLen) throw new Error(`missing field ${fieldIndex}`);
    const position = root + view.getUint16(vtable + offset, true);
    const start = position + view.getUint32(position, true);
    return new ArrayType(buffer, start + 4, view.getUint32(start, true));
  };
  return {
    sha256: sha256(raw),
    connectome: {
      offsets: getVector(5, Uint32Array),
      scales: getVector(6, Float32Array),
      deltas: getVector(7, Uint16Array),
      weights: getVector(8, Uint8Array),
      lut: getVector(9, Float32Array),
    },
  };
}

export function readJson(relative) {
  const raw = readFileSync(new URL(relative, PUBLIC));
  return { data: JSON.parse(raw.toString("utf8")), sha256: sha256(raw) };
}

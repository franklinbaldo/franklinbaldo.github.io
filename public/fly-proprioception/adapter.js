// Only explicit FeCO synonyms are eligible. Type-name substring matches are unsafe.
export function validateAudit(audit, neuronCount) {
  if (
    audit.traced_count !== neuronCount ||
    !/^[a-f0-9]{64}$/.test(audit.artifact_sha256) ||
    !/^[a-f0-9]{64}$/.test(audit.annotations_sha256)
  )
    throw new Error("invalid provenance");
  if (
    !["dn_all", "dnl", "visual_projection"].every(
      (key) => audit.alignment[key] === true
    )
  )
    throw new Error("unaligned identities");
  const seen = new Set();
  for (const cell of audit.feco_candidates) {
    if (
      !Number.isInteger(cell.index) ||
      cell.index < 0 ||
      cell.index >= neuronCount ||
      seen.has(cell.index) ||
      !Number.isSafeInteger(cell.bodyId) ||
      cell.class !== "mechanosensory_proprioceptive" ||
      cell.subclass !== "chordotonal organ" ||
      cell.entryNerve !== "MetaLN" ||
      cell.rootSide !== "R" ||
      !["FeCO claw", "FeCO hook", "FeCO club"].includes(cell.synonyms)
    )
      throw new Error("invalid afferent identity");
    seen.add(cell.index);
  }
  if (seen.size !== 33) throw new Error("unexpected audited population");
  for (const [subtype, count] of [
    ["FeCO claw", 13],
    ["FeCO club", 15],
    ["FeCO hook", 5],
  ]) {
    if (
      audit.feco_candidates.filter((cell) => cell.synonyms === subtype)
        .length !== count
    )
      throw new Error("unexpected subtype count");
  }
  for (const key of ["vnc_intrinsic", "ascending_neuron"]) {
    const group = audit.readout_indices[key];
    if (
      !Array.isArray(group) ||
      !group.length ||
      new Set(group).size !== group.length ||
      group.some(
        (index) =>
          !Number.isInteger(index) ||
          index < 0 ||
          index >= neuronCount ||
          seen.has(index)
      )
    )
      throw new Error("invalid downstream population");
  }
}
// Deliberately artificial, uniform subtype drive. No inferred single-cell tuning.
export function modelledDrive(audit, signals) {
  return audit.feco_candidates.map((cell) => [
    cell.index,
    cell.synonyms === "FeCO claw"
      ? signals.clawExtension
      : cell.synonyms === "FeCO hook"
        ? signals.clubMovement
        : 0,
  ]);
}
export function summarizeActivity(state, groups) {
  return Object.fromEntries(
    Object.entries(groups).map(([name, indices]) => [
      name,
      indices.reduce((sum, index) => sum + Math.abs(state[index]), 0) /
        indices.length,
    ])
  );
}
export function decodeConnectome(buffer) {
  const view = new DataView(buffer),
    root = view.getUint32(0, true),
    vtable = root - view.getInt32(root, true),
    vtableLen = view.getUint16(vtable, true);
  const vector = (field, Type) => {
    if (4 + field * 2 >= vtableLen) throw new Error("missing vector");
    const fieldOffset = view.getUint16(vtable + 4 + field * 2, true);
    if (!fieldOffset) throw new Error("empty vector field");
    const position = root + fieldOffset,
      start = position + view.getUint32(position, true);
    return new Type(buffer, start + 4, view.getUint32(start, true));
  };
  return {
    offsets: vector(5, Uint32Array),
    scales: vector(6, Float32Array),
    deltas: vector(7, Uint16Array),
    weights: vector(8, Uint8Array),
    lut: vector(9, Float32Array),
  };
}

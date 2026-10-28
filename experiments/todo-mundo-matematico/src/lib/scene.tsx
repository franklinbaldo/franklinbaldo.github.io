import React, { createContext, useContext } from "react";

const SceneStartCtx = createContext(0);

/** Informa aos personagens em que frame absoluto a cena começa (para sincronizar a boca). */
export const SceneStart: React.FC<{ start: number; children: React.ReactNode }> = ({ start, children }) => (
  <SceneStartCtx.Provider value={start}>{children}</SceneStartCtx.Provider>
);

export const useSceneStart = () => useContext(SceneStartCtx);

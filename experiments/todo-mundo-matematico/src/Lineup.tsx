import React from "react";
import { AbsoluteFill } from "remotion";
import { Actor } from "./chars/parts";
import { Mathematician } from "./chars/Mathematician";
import { Robot } from "./chars/Robot";
import { LeanChar } from "./chars/Lean";
import { Person } from "./chars/Person";
import { C } from "./lib/theme";

export const Lineup: React.FC = () => (
  <AbsoluteFill style={{ background: C.navy }}>
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <Actor x={200} y={1000}><Mathematician mood="angry" holding="diploma" armR={70} mouth={0.6} /></Actor>
      <Actor x={460} y={1000}><Person variant="pes" mood="happy" armR={120} /></Actor>
      <Actor x={680} y={1000}><Person variant="avo" mood="smug" /></Actor>
      <Actor x={880} y={1000}><Person variant="tio" mood="happy" mouth={0.8} /></Actor>
      <Actor x={1060} y={1000}><Person variant="kid" mood="shock" /></Actor>
      <Actor x={1240} y={1000}><Person variant="adv" mood="serious" /></Actor>
      <Actor x={1480} y={900}><Robot face="star" gear={["party", "medals"]} armR={150} mouth={0.7} /></Actor>
      <Actor x={1760} y={1000}><LeanChar stamp={0.8} /></Actor>
    </svg>
  </AbsoluteFill>
);

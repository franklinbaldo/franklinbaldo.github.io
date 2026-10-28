import React from "react";
import { Composition, Folder } from "remotion";
import { ScenePreview, Video } from "./Video";
import { getScene, timeline } from "./lib/timeline";
import { SCENES } from "./scenes";
import { Lineup } from "./Lineup";

const len = (id: string) => getScene(id).end - getScene(id).start;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TodoMundoMatematico"
      component={Video}
      durationInFrames={timeline.durationInFrames}
      fps={timeline.fps}
      width={1920}
      height={1080}
      defaultProps={{ showCaptions: true, musicVolume: 0.55 }}
    />
    {/* Cenas isoladas: geradas a partir da linha do tempo, para prévia e inspeção. */}
    <Folder name="Cenas">
      {Object.keys(SCENES).map((id) => (
        <Composition key={id} id={`Cena-${id}`} component={ScenePreview} durationInFrames={len(id)} fps={timeline.fps} width={1920} height={1080} defaultProps={{ scene: id, showCaptions: true }} />
      ))}
    </Folder>
    <Composition id="Elenco" component={Lineup} durationInFrames={60} fps={30} width={1920} height={1080} />
  </>
);

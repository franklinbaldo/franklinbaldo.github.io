import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { C } from "./lib/theme";
import { SceneStart } from "./lib/scene";
import { getScene, timeline } from "./lib/timeline";
import { Captions, InkFilter } from "./ui/kit";
import { SCENES } from "./scenes";

export type VideoProps = { showCaptions: boolean; musicVolume: number };

/** O filme inteiro: cenas em sequência, voz, trilha e legendas. */
export const Video: React.FC<VideoProps> = ({ showCaptions, musicVolume }) => (
  <AbsoluteFill style={{ background: C.night }}>
    <InkFilter />
    {timeline.scenes.map((sc) => {
      const Comp = SCENES[sc.id];
      return (
        <Sequence key={sc.id} from={sc.start} durationInFrames={sc.end - sc.start} name={sc.title}>
          <SceneStart start={sc.start}>
            <Comp />
          </SceneStart>
        </Sequence>
      );
    })}
    <Audio src={staticFile("audio/voice.wav")} />
    <Audio src={staticFile("audio/music.wav")} volume={musicVolume} />
    {showCaptions && <Captions chunks={timeline.captions} />}
  </AbsoluteFill>
);

/** Uma cena isolada (para prévia no Studio e stills de inspeção). */
export const ScenePreview: React.FC<{ scene: string; showCaptions: boolean }> = ({ scene, showCaptions }) => {
  const sc = getScene(scene);
  const Comp = SCENES[scene];
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <InkFilter />
      <SceneStart start={sc.start}>
        <Comp />
      </SceneStart>
      <Audio src={staticFile("audio/voice.wav")} trimBefore={sc.start} />
      <Audio src={staticFile("audio/music.wav")} trimBefore={sc.start} volume={0.8} />
      {showCaptions && (
        <Sequence from={-sc.start} layout="none">
          <Captions chunks={timeline.captions} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, Audio, Composition, Series, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { C, FPS, HEIGHT, WIDTH } from './theme';
import { Background } from './components/ui';
import { Intro, Problem, Solution } from './scenes/Opening';
import { Architecture } from './scenes/Architecture';
import { Calls, Dashboard, Failure, Search, SignIn, Transcript } from './scenes/AppScenes';
import { Business, Outro, Production } from './scenes/Closing';

const SCENES: [React.FC<{ dur: number }>, number][] = [
  [Intro, 210],
  [Problem, 420],
  [Solution, 240],
  [Architecture, 690],
  [SignIn, 230],
  [Dashboard, 330],
  [Calls, 300],
  [Transcript, 720],
  [Search, 270],
  [Failure, 300],
  [Production, 390],
  [Business, 390],
  [Outro, 270],
];

export const TOTAL = SCENES.reduce((n, [, d]) => n + d, 0);

export const schema = z.object({
  music: z.boolean(),
});

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        bottom: 0,
        height: 4,
        width: `${(f / TOTAL) * 100}%`,
        background: `linear-gradient(90deg, ${C.green}, ${C.blue})`,
        opacity: 0.8,
      }}
    />
  );
};

export const MeetingProDemo: React.FC<z.infer<typeof schema>> = ({ music }) => {
  const f = useCurrentFrame();
  const volume = interpolate(f, [0, 45, TOTAL - 90, TOTAL], [0, 0.55, 0.55, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill>
      <Background />
      <Series>
        {SCENES.map(([Comp, dur], i) => (
          <Series.Sequence key={i} durationInFrames={dur}>
            <Comp dur={dur} />
          </Series.Sequence>
        ))}
      </Series>
      <Progress />
      {music ? <Audio src={staticFile('music.wav')} volume={volume} /> : null}
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <Composition
    id="MeetingProDemo"
    component={MeetingProDemo}
    durationInFrames={TOTAL}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    schema={schema}
    defaultProps={{ music: true }}
  />
);

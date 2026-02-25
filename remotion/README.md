# Cinelasta: Remotion Video Project

This project generates programmatic videos for the Franklin Baldo blog.

## Installation

```bash
npm install
```

## Rendering

To render the full video for "Pattern Over Stuff":

```bash
npx remotion render src/index.ts PatternOverStuff out.mp4
```

To render a preview or shorter version:

```bash
npx remotion render src/index.ts PatternOverStuff out.mp4 --end-frame=300
```

## Components

- `src/Composition.tsx`: Main composition logic.
- `src/Waveform.tsx`: Audio visualization using `@remotion/media-utils`.
- `src/Lyrics.tsx`: Lyrics display synchronized (roughly) with audio duration.
- `src/Cover.tsx`: Cover art display.

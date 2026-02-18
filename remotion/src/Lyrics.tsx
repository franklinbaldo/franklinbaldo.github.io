import { lyrics } from './lyrics';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';

export const Lyrics: React.FC = () => {
	const frame = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();

	// Use all lines including empty ones for spacing/pauses
	const totalLines = lyrics.length;
	// Calculate time per line
	const timePerLine = durationInFrames / totalLines;

	const currentLineIndex = Math.floor(frame / timePerLine);
	const currentLine = lyrics[currentLineIndex] || "";

	// Calculate opacity for fade in/out effect
	const timeInSlot = frame % timePerLine;
	// Smooth sine wave fade: 0 -> 1 -> 0 over the duration of the line
	const opacity = Math.sin((timeInSlot / timePerLine) * Math.PI);

	return (
		<AbsoluteFill style={{
			justifyContent: 'center',
			alignItems: 'center',
			fontSize: 48,
			fontFamily: '"JetBrains Mono", monospace',
			textAlign: 'center',
			color: 'white',
            textShadow: '0 0 10px rgba(255,255,255,0.5)',
            zIndex: 10
		}}>
			<div style={{ opacity }}>
				{currentLine}
			</div>
		</AbsoluteFill>
	);
};

import { useAudioData, visualizeAudio } from '@remotion/media-utils';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';

export const Waveform: React.FC<{ audio: string }> = ({ audio }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const audioData = useAudioData(audio);

	if (!audioData) {
		return null;
	}

	const visualization = visualizeAudio({
		fps,
		frame,
		audioData,
		numberOfSamples: 256,
	});

	// Draw a mirrored waveform
    // We'll create a path
    const points = visualization.map((v, i) => {
        return v;
    });

    const width = 1000;
    const height = 300;

    // Create path d attribute
    // Start from middle left
    let path = `M 0 ${height / 2}`;

    // Top half
    for (let i = 0; i < points.length; i++) {
        const x = (i / (points.length - 1)) * width;
        const y = (height / 2) - (points[i] * (height / 2));
        path += ` L ${x} ${y}`;
    }

    // Bottom half (mirrored)
    for (let i = points.length - 1; i >= 0; i--) {
        const x = (i / (points.length - 1)) * width;
        const y = (height / 2) + (points[i] * (height / 2));
        path += ` L ${x} ${y}`;
    }

    path += " Z";

	return (
		<div style={{
            width: width,
            height: height,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white'
        }}>
            <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
                <path d={path} fill="rgba(255, 255, 255, 0.8)" />
            </svg>
		</div>
	);
};

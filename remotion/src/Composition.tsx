import { AbsoluteFill, Audio, staticFile } from 'remotion';
import React from 'react';
import { Waveform } from './Waveform';
import { Lyrics } from './Lyrics';
import { Cover } from './Cover';

export const PatternOverStuffComposition: React.FC = () => {
	return (
		<AbsoluteFill style={{ backgroundColor: '#111', color: 'white' }}>
			{/* Background Cover */}
			<Cover />

			{/* Audio */}
			<Audio src={staticFile('pattern-over-stuff.mp3')} />

			{/* Waveform Visualization */}
			<div style={{
				position: 'absolute',
				bottom: 0,
				width: '100%',
				height: 300,
				zIndex: 5,
				justifyContent: 'center',
				display: 'flex',
                alignItems: 'flex-end',
                marginBottom: 50
			}}>
				<Waveform audio={staticFile('pattern-over-stuff.mp3')} />
			</div>

			{/* Lyrics Display */}
			<div style={{
				position: 'absolute',
				top: 0,
				width: '100%',
				height: '100%',
				zIndex: 10,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}>
				<Lyrics />
			</div>
		</AbsoluteFill>
	);
};

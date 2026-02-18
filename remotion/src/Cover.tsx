import { Img, staticFile } from 'remotion';
import React from 'react';

export const Cover: React.FC = () => {
	return (
		<div style={{
			position: 'absolute',
			width: '100%',
			height: '100%',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
            opacity: 0.3, // Dim the cover for background
            zIndex: 0
		}}>
			<Img src={staticFile('cover.png')} style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(10px) grayscale(50%)' // Gwern/Minimalist style
            }} />
		</div>
	);
};

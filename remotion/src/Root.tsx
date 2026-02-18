import { Composition } from 'remotion';
import { PatternOverStuffComposition } from './Composition';
import './style.css';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="PatternOverStuff"
				component={PatternOverStuffComposition}
				durationInFrames={7200}
				fps={30}
				width={1920}
				height={1080}
			/>
		</>
	);
};

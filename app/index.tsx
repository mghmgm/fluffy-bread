import { Canvas, Image, useImage } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';

export default function Index() {
  const { width, height } = useWindowDimensions();
  const bg = useImage(require('../assets/sprites/background-day.png'));
  const r = width * 0.33;
  return (
    <Canvas style={{ width, height }}>
      <Image image={bg} width={width} height={height} fit={'cover'} />
    </Canvas>
  );
}

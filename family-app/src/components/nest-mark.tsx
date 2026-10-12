import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';
/** The NestWork mark: a woven nest with a light inside an unbroken ring. Same drawing as brand/mark-on-*.svg and brand/lst/ (100 × 100).
 * fg draws the nest, light the ring and light (defaults to fg; gold in the LST colors), bg is what it sits on. */
export function NestMark({ size = 96, fg, bg, light }: { size?: number; fg: string; bg: string; light?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bands: [number, number, number][] = [[57, 67.5, 1], [67.5, 78, -1], [78, 97, 1]];
  const xs = Array.from({ length: 11 }, (_, i) => -12 + i * 12), rimXs = Array.from({ length: 9 }, (_, i) => 2 + i * 11);
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="NestWork">
    <Defs>
      <ClipPath id={id + 'b'}><Path d="M15 57 H85 A35 31 0 0 1 15 57 Z" /></ClipPath>
      <ClipPath id={id + 'r'}><Rect x={9} y={47} width={82} height={11} rx={5.5} /></ClipPath>
    </Defs>
    <Circle cx={50} cy={40} r={19} fill="none" stroke={light ?? fg} strokeWidth={2.6} />
    <Circle cx={50} cy={40} r={13} fill={light ?? fg} />
    <G clipPath={`url(#${id}b)`}>
      <Rect x={0} y={57} width={100} height={40} fill={fg} />
      {bands.map(([y0, y1, dr]) => xs.map(x => <Line key={y0 + ':' + x} x1={x} y1={y1} x2={x + dr * 6} y2={y0} stroke={bg} strokeWidth={2.6} />))}
      {[67.5, 78].map(y => <Rect key={y} x={0} y={y - 1.3} width={100} height={2.6} fill={bg} />)}
    </G>
    <Rect x={7.5} y={45.5} width={85} height={14} rx={7} fill={bg} />
    <G clipPath={`url(#${id}r)`}>
      <Rect x={9} y={47} width={82} height={11} fill={fg} />
      {rimXs.map(x => <Line key={x} x1={x} y1={58} x2={x + 5} y2={47} stroke={bg} strokeWidth={2} />)}
    </G>
  </Svg>;
}

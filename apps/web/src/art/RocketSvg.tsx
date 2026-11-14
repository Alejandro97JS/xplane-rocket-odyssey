import type { RocketId } from '@rocket-odyssey/game-core';
import { getRocketArt, type Shape } from './rocketArt.ts';

interface RocketSvgProps {
  rocketId: RocketId;
  className?: string;
}

const round = (n: number) => Math.round(n * 100) / 100;

function renderShape(shape: Shape, key: string, height: number) {
  // The drawing has y pointing up; SVG has y pointing down.
  if (shape.kind === 'ellipse') {
    return (
      <ellipse
        key={key}
        cx={round(shape.cx)}
        cy={round(height - shape.cy)}
        rx={shape.rx}
        ry={shape.ry}
        fill={shape.fill}
        opacity={shape.opacity}
      />
    );
  }
  const points: string[] = [];
  for (let i = 0; i < shape.pts.length; i += 2) {
    points.push(`${round(shape.pts[i]!)},${round(height - shape.pts[i + 1]!)}`);
  }
  return <polygon key={key} points={points.join(' ')} fill={shape.fill} opacity={shape.opacity} />;
}

/**
 * A launcher on the pad, drawn from the same geometry the launch animation
 * uses. Decorative: the card that shows it names the rocket in text.
 */
export function RocketSvg({ rocketId, className }: RocketSvgProps) {
  const art = getRocketArt(rocketId);
  const margin = art.height * 0.03;
  const width = art.halfWidth * 2 + margin * 2;
  const layers: [string, Shape[]][] = [
    ['upper-back', art.upperBack],
    ['lower', art.lower],
    ['upper-front', art.upperFront],
    ['fairing-left', art.fairing?.left ?? []],
    ['fairing-right', art.fairing?.right ?? []],
  ];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox={`${round(-width / 2)} ${round(-margin)} ${round(width)} ${round(art.height + margin * 2)}`}
      preserveAspectRatio="xMidYMax meet"
    >
      {layers.map(([name, shapes]) => (
        <g key={name}>{shapes.map((shape, i) => renderShape(shape, `${name}-${i}`, art.height))}</g>
      ))}
    </svg>
  );
}

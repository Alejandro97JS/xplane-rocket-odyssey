import { useMemo } from 'react';
import { createRandom } from '../lib/random.ts';

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkle: boolean;
  delay: number;
}

function createStars(count: number): Star[] {
  const random = createRandom(20261114);
  return Array.from({ length: count }, () => {
    const size = random();
    return {
      x: random() * 100,
      y: random() * 100,
      r: size > 0.94 ? 0.16 : size > 0.7 ? 0.1 : 0.06,
      opacity: 0.35 + random() * 0.6,
      twinkle: random() > 0.82,
      delay: random() * 4.5,
    };
  });
}

/** Deep space, a field of stars and the rim of the Earth, behind every screen. */
export function Backdrop() {
  const stars = useMemo(() => createStars(170), []);
  return (
    <div aria-hidden="true" className="backdrop">
      <svg
        className="backdrop__stars"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {stars.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#dcecff"
            opacity={star.opacity}
            className={star.twinkle ? 'backdrop__star--twinkle' : undefined}
            style={
              star.twinkle
                ? ({ '--o': star.opacity, animationDelay: `${star.delay}s` } as React.CSSProperties)
                : undefined
            }
          />
        ))}
      </svg>
      <div className="backdrop__earth" />
      <div className="backdrop__shade" />
    </div>
  );
}

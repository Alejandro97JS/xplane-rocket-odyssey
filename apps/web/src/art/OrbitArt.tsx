import type { OrbitId } from '@rocket-odyssey/game-core';
import { EarthSphere } from './EarthSphere.tsx';

/**
 * Schematic drawings of the orbits, in a 200 x 120 box. They are not to
 * scale: a low orbit drawn to scale would be a hairline above the surface.
 * Decorative: the screens that show them give the same facts in text.
 */

interface OrbitGeometry {
  /** The part of the 200 x 120 box that holds the drawing: x, y, width, height. */
  view: [number, number, number, number];
  earth: { cx: number; cy: number; r: number };
  /** The orbit as a tilted ellipse. Its lower half is the side nearest the viewer. */
  ellipse: { cx: number; cy: number; rx: number; ry: number; rotate: number };
  /** Position of the satellite on the ellipse, in degrees from its right end, clockwise. */
  satellite: number;
  /** Earth radii of the two radiation belts, or null when the orbit stays below them. */
  belts: { inner: number; outer: number; rotate: number } | null;
}

const GEOMETRY: Record<OrbitId, OrbitGeometry> = {
  leo: {
    view: [46, 12, 108, 100],
    earth: { cx: 100, cy: 62, r: 33 },
    ellipse: { cx: 100, cy: 62, rx: 46, ry: 13, rotate: -16 },
    satellite: 62,
    belts: null,
  },
  sso: {
    view: [46, 6, 108, 108],
    earth: { cx: 100, cy: 60, r: 31 },
    ellipse: { cx: 100, cy: 60, rx: 49, ry: 14, rotate: -80 },
    satellite: 118,
    belts: null,
  },
  meo: {
    view: [18, 18, 164, 84],
    earth: { cx: 100, cy: 60, r: 17 },
    ellipse: { cx: 100, cy: 60, rx: 76, ry: 25, rotate: -18 },
    satellite: 55,
    belts: { inner: 1.9, outer: 3.4, rotate: -18 },
  },
  geo: {
    view: [4, 20, 192, 76],
    earth: { cx: 100, cy: 58, r: 12 },
    ellipse: { cx: 100, cy: 58, rx: 90, ry: 27, rotate: 0 },
    satellite: 90,
    belts: { inner: 2.2, outer: 4.6, rotate: 0 },
  },
  heo: {
    view: [30, 8, 150, 96],
    earth: { cx: 55.6, cy: 77.3, r: 9 },
    ellipse: { cx: 108, cy: 54, rx: 70, ry: 40, rotate: -24 },
    satellite: 318,
    belts: { inner: 2, outer: 4, rotate: -24 },
  },
};

function pointOnEllipse(g: OrbitGeometry['ellipse'], degrees: number) {
  const a = (degrees * Math.PI) / 180;
  const tilt = (g.rotate * Math.PI) / 180;
  const x = g.rx * Math.cos(a);
  const y = g.ry * Math.sin(a);
  return {
    x: g.cx + x * Math.cos(tilt) - y * Math.sin(tilt),
    y: g.cy + x * Math.sin(tilt) + y * Math.cos(tilt),
  };
}

interface OrbitArtProps {
  orbitId: OrbitId;
  /** Adds the radiation belts and a wider line, for the large preview. */
  detailed?: boolean;
  className?: string;
}

export function OrbitArt({ orbitId, detailed = false, className }: OrbitArtProps) {
  const g = GEOMETRY[orbitId];
  const e = g.ellipse;
  const sat = pointOnEllipse(e, g.satellite);
  const lineWidth = detailed ? 1.6 : 2;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={g.view.join(' ')}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {g.belts && (
        <g
          transform={`rotate(${g.belts.rotate} ${g.earth.cx} ${g.earth.cy})`}
          fill="none"
          stroke="#c084fc"
        >
          <ellipse
            cx={g.earth.cx}
            cy={g.earth.cy}
            rx={g.earth.r * g.belts.inner}
            ry={g.earth.r * g.belts.inner * 0.36}
            strokeWidth={g.earth.r * 0.7}
            opacity="0.22"
          />
          <ellipse
            cx={g.earth.cx}
            cy={g.earth.cy}
            rx={g.earth.r * g.belts.outer}
            ry={g.earth.r * g.belts.outer * 0.36}
            strokeWidth={g.earth.r * 1.1}
            opacity="0.14"
          />
        </g>
      )}

      {/* Far half of the orbit, behind the Earth */}
      <ellipse
        cx={e.cx}
        cy={e.cy}
        rx={e.rx}
        ry={e.ry}
        transform={`rotate(${e.rotate} ${e.cx} ${e.cy})`}
        fill="none"
        stroke="#ffc533"
        strokeWidth={lineWidth}
        strokeDasharray="1 4"
        strokeLinecap="round"
        opacity="0.7"
      />

      <EarthSphere cx={g.earth.cx} cy={g.earth.cy} r={g.earth.r} />

      {/* Near half of the orbit, in front of the Earth */}
      <path
        d={`M ${-e.rx} 0 A ${e.rx} ${e.ry} 0 0 0 ${e.rx} 0`}
        transform={`translate(${e.cx} ${e.cy}) rotate(${e.rotate})`}
        fill="none"
        stroke="#ffdc6b"
        strokeWidth={lineWidth}
        strokeLinecap="round"
      />

      {orbitId === 'geo' && (
        <polygon
          points={`${sat.x},${sat.y} ${g.earth.cx - g.earth.r * 0.8},${g.earth.cy + 3} ${g.earth.cx + g.earth.r * 0.8},${g.earth.cy + 3}`}
          fill="#38bdf8"
          opacity="0.28"
        />
      )}

      {/* Satellite */}
      <g transform={`translate(${sat.x} ${sat.y})`}>
        <circle r="7" fill="#ffdc6b" opacity="0.22" />
        <rect x="-8.500" y="-1.600" width="6" height="3.200" fill="#6fb1ff" />
        <rect x="2.500" y="-1.600" width="6" height="3.200" fill="#6fb1ff" />
        <rect x="-2.600" y="-2.600" width="5.200" height="5.200" rx="1" fill="#ffffff" />
      </g>
    </svg>
  );
}

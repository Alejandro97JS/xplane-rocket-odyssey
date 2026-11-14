import { useId } from 'react';

interface EarthSphereProps {
  cx: number;
  cy: number;
  r: number;
  /** Rotates the continents so two Earths on one screen do not look identical. */
  spin?: number;
}

/** A stylised Earth for use inside an `<svg>`: ocean, land, clouds, night side and air glow. */
export function EarthSphere({ cx, cy, r, spin = 0 }: EarthSphereProps) {
  const id = useId();
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-ocean`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#4aa3f5" />
          <stop offset="45%" stopColor="#1c63c4" />
          <stop offset="100%" stopColor="#0a2a6e" />
        </radialGradient>
        <radialGradient id={`${id}-night`} cx="30%" cy="26%" r="85%">
          <stop offset="55%" stopColor="#020611" stopOpacity="0" />
          <stop offset="100%" stopColor="#020611" stopOpacity="0.78" />
        </radialGradient>
        <radialGradient id={`${id}-air`} cx="50%" cy="50%" r="50%">
          <stop offset="84%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="93%" stopColor="#7dd3fc" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={r * 1.16} fill={`url(#${id}-air)`} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-ocean)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {/* Continents are drawn in a 200 x 200 box and scaled to the sphere. */}
        <g
          transform={`translate(${cx - r} ${cy - r}) scale(${r / 100}) rotate(${spin} 100 100)`}
          fill="#3aa876"
        >
          <path d="M70 30C85 22 105 30 100 48C96 62 108 70 112 84C116 100 104 122 96 138C90 150 84 140 84 126C84 112 74 104 68 92C60 78 50 60 58 44C61 37 64 33 70 30Z" />
          <path d="M150 60C165 55 180 70 184 88C188 106 176 124 164 130C152 134 146 118 148 104C150 90 138 78 150 60Z" />
          <path d="M110 12C124 8 140 14 146 24C138 30 122 28 112 22Z" />
          <path d="M30 120C40 114 52 122 50 136C46 148 34 146 28 136Z" />
          <path d="M120 158C134 152 150 158 152 170C146 180 128 180 120 172Z" fill="#e8f4ff" />
          <g fill="none" stroke="#ffffff" strokeLinecap="round" opacity="0.55">
            <path d="M24 70C46 60 62 66 82 60" strokeWidth="5" />
            <path d="M96 104C118 96 140 104 168 96" strokeWidth="6" />
            <path d="M52 156C74 150 92 156 110 150" strokeWidth="4" />
            <path d="M118 44C134 40 150 46 166 42" strokeWidth="4" />
          </g>
        </g>
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-night)`} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#9be5ff" strokeWidth={Math.max(0.6, r * 0.02)} opacity="0.7" />
    </g>
  );
}

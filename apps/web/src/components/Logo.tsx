import { useId } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * The emblem of the game: a rocket crossing an orbit. It is an original
 * design; the agency logo of the mockups is a registered mark and is not used.
 * Decorative: the name of the game is always written next to it.
 */
export function Logo({ size = 64, className }: LogoProps) {
  const id = useId();
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <radialGradient id={`${id}-disc`} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#1d5fc4" />
          <stop offset="55%" stopColor="#0b2f78" />
          <stop offset="100%" stopColor="#051a45" />
        </radialGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="100%" stopColor="#ff9d1f" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="60" cy="60" r="52" />
        </clipPath>
      </defs>

      <circle cx="60" cy="60" r="56" fill="#030817" />
      <circle cx="60" cy="60" r="52" fill={`url(#${id}-disc)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {/* Stars */}
        <g fill="#eaf6ff">
          <circle cx="28" cy="38" r="1.6" />
          <circle cx="92" cy="30" r="1.3" />
          <circle cx="86" cy="82" r="1.5" />
          <circle cx="34" cy="88" r="1.1" />
          <circle cx="44" cy="22" r="1" />
          <circle cx="98" cy="58" r="1" />
        </g>
        {/* Far side of the orbit, behind the rocket */}
        <path
          d="M12 74 C 34 34, 86 26, 108 46"
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>

      {/* Rocket, tilted towards the upper right */}
      <g transform="rotate(32 60 60)">
        <path d="M54 88 L60 104 L66 88 Z" fill={`url(#${id}-flame)`} />
        <path d="M49 70 L39 86 L50 82 Z" fill="#ffc533" />
        <path d="M71 70 L81 86 L70 82 Z" fill="#ffc533" />
        <path d="M60 20 C 70 32, 72 48, 72 62 L72 84 L48 84 L48 62 C 48 48, 50 32, 60 20 Z" fill="#f1f7ff" />
        <path d="M60 20 C 66 27, 69 36, 70.6 45 L49.4 45 C 51 36, 54 27, 60 20 Z" fill="#ff7c89" />
        <circle cx="60" cy="58" r="6.5" fill="#0b2f78" stroke="#38bdf8" strokeWidth="2.5" />
        <rect x="48" y="78" width="24" height="6" fill="#9fb4d4" />
      </g>

      {/* Near side of the orbit, in front of the rocket */}
      <path
        d="M108 46 C 122 62, 88 96, 46 100 C 24 102, 8 90, 12 74"
        fill="none"
        stroke="#9be5ff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="46" cy="100" r="4.5" fill="#ffdc6b" />

      <circle cx="60" cy="60" r="54" fill="none" stroke="#38bdf8" strokeWidth="3" />
    </svg>
  );
}

import type { LevelId } from '@rocket-odyssey/game-core';
import { useId, type ReactNode } from 'react';
import { EarthSphere } from './EarthSphere.tsx';
import { PayloadGlyph } from './PayloadArt.tsx';

/**
 * A small scene for each mission, and one for free exploration, in a 320 x 160
 * box. Decorative: the card that shows it gives the title and the goal in text.
 */

const STARS: [number, number, number][] = [
  [18, 20, 1.1],
  [44, 62, 0.7],
  [70, 14, 0.9],
  [96, 44, 0.6],
  [128, 10, 1],
  [150, 70, 0.6],
  [182, 26, 0.8],
  [214, 12, 1.1],
  [240, 58, 0.7],
  [268, 22, 0.9],
  [296, 46, 1],
  [306, 12, 0.6],
  [30, 96, 0.6],
  [286, 86, 0.7],
  [112, 86, 0.5],
  [200, 92, 0.6],
];

function Sky({ id, tint }: { id: string; tint: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#020611" />
          <stop offset="100%" stopColor={tint} />
        </linearGradient>
      </defs>
      <rect width="320" height="160" fill={`url(#${id}-sky)`} />
      <g fill="#dcecff">
        {STARS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} opacity={0.5 + (i % 3) * 0.2} />
        ))}
      </g>
    </>
  );
}

function FirstSpaceData({ id }: { id: string }) {
  return (
    <>
      <Sky id={id} tint="#0a2a5c" />
      {/* Aurora along the rim of the Earth */}
      <defs>
        <linearGradient id={`${id}-aurora`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <path d="M0 150Q160 96 320 150V124Q160 62 0 124Z" fill={`url(#${id}-aurora)`} />
      <EarthSphere cx={160} cy={452} r={330} spin={20} />
      <g transform="translate(96 4) scale(0.82)">
        <PayloadGlyph payloadId="cubesat" />
      </g>
    </>
  );
}

function EnvironmentalSurveillance({ id }: { id: string }) {
  return (
    <>
      <Sky id={id} tint="#0b2f5e" />
      <EarthSphere cx={170} cy={352} r={250} spin={-30} />
      {/* Glacier and wildfire on the surface */}
      <path d="M40 128q26-14 54-8q-10 14-34 16z" fill="#f1f7ff" opacity="0.9" />
      <g>
        <circle cx="232" cy="122" r="13" fill="#ff7c1f" opacity="0.35" />
        <circle cx="232" cy="122" r="6" fill="#ffb347" />
        <circle cx="252" cy="130" r="9" fill="#ff7c1f" opacity="0.35" />
        <circle cx="252" cy="130" r="4" fill="#ffb347" />
        <path
          d="M228 114q-10-16 4-30"
          stroke="#a7b3c8"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      </g>
      {/* Scan swath from the camera to the ground */}
      <polygon points="138,74 176,132 268,120" fill="#38bdf8" opacity="0.2" />
      <path d="M138 74L176 132M138 74L268 120" stroke="#9be5ff" strokeWidth="1" opacity="0.7" />
      <g transform="translate(84 6) scale(0.68)">
        <PayloadGlyph payloadId="earth_observation" />
      </g>
    </>
  );
}

function ConnectingTheContinent({ id }: { id: string }) {
  return (
    <>
      <Sky id={id} tint="#102a66" />
      {/* Signal beams */}
      <g fill="#38bdf8">
        <polygon points="214,62 58,96 104,132" opacity="0.2" />
        <polygon points="214,62 36,118 76,142" opacity="0.14" />
      </g>
      <EarthSphere cx={70} cy={124} r={68} spin={10} />
      <ellipse
        cx="82"
        cy="112"
        rx="34"
        ry="20"
        fill="none"
        stroke="#9be5ff"
        strokeWidth="1.400"
        strokeDasharray="4 3"
        transform="rotate(-18 82 112)"
      />
      <g fill="#ffdc6b">
        <circle cx="66" cy="104" r="2.200" />
        <circle cx="88" cy="118" r="2.200" />
        <circle cx="98" cy="102" r="2.200" />
        <circle cx="74" cy="124" r="2.200" />
      </g>
      <g transform="translate(152 4) scale(0.92)">
        <PayloadGlyph payloadId="telecom" />
      </g>
    </>
  );
}

function HumanHorizon({ id }: { id: string }) {
  return (
    <>
      <Sky id={id} tint="#122c63" />
      <defs>
        <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="18%" stopColor="#fff3b0" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffc533" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="252" cy="126" r="70" fill={`url(#${id}-sun)`} />
      <EarthSphere cx={150} cy={440} r={316} spin={50} />
      <path
        d="M130 124Q252 100 320 132"
        stroke="#fff3b0"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      <g transform="translate(40 2) rotate(-10 80 55) scale(1.02)">
        <PayloadGlyph payloadId="capsule_classic" />
      </g>
    </>
  );
}

function OrbitalOutpost({ id }: { id: string }) {
  return (
    <>
      <Sky id={id} tint="#0c2d66" />
      <EarthSphere cx={160} cy={470} r={340} spin={-10} />
      {/* A small station: laboratory, core with solar arrays, habitat */}
      <g transform="translate(6 30) scale(0.6)">
        <PayloadGlyph payloadId="station_lab" />
      </g>
      <g transform="translate(206 30) scale(0.6)">
        <PayloadGlyph payloadId="station_habitat" />
      </g>
      <g transform="translate(72 8) scale(1.1)">
        <PayloadGlyph payloadId="station_core" />
      </g>
    </>
  );
}

/** Free exploration: every orbit open, and payloads of every kind on them. */
function FreeExploration({ id }: { id: string }) {
  return (
    <>
      <Sky id={id} tint="#251b63" />
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="236" cy="56" rx="120" ry="64" fill={`url(#${id}-glow)`} />
      {/* A low, a high and an elliptical orbit, all centred on the Earth */}
      <g fill="none" strokeWidth="1.400" strokeDasharray="4 3">
        <ellipse cx="60" cy="200" rx="150" ry="110" stroke="#9be5ff" opacity="0.8" />
        <ellipse cx="60" cy="200" rx="240" ry="165" stroke="#9be5ff" opacity="0.55" />
        <ellipse cx="60" cy="200" rx="300" ry="200" stroke="#ffdc6b" opacity="0.7" />
      </g>
      <EarthSphere cx={60} cy={200} r={96} spin={70} />
      <g transform="translate(109 87) scale(0.32)">
        <PayloadGlyph payloadId="cubesat" />
      </g>
      <g transform="translate(107 24) scale(0.34)">
        <PayloadGlyph payloadId="capsule_modern" />
      </g>
      <g transform="translate(196 60) scale(0.42)">
        <PayloadGlyph payloadId="telecom" />
      </g>
      <g transform="translate(176 4) scale(0.42)">
        <PayloadGlyph payloadId="observatory" />
      </g>
    </>
  );
}

/** What a scene can show: a contract, or free exploration. */
export type MissionScene = LevelId | 'free_exploration';

const SCENES: Record<MissionScene, (props: { id: string }) => ReactNode> = {
  first_space_data: FirstSpaceData,
  environmental_surveillance: EnvironmentalSurveillance,
  connecting_the_continent: ConnectingTheContinent,
  human_horizon: HumanHorizon,
  orbital_outpost: OrbitalOutpost,
  free_exploration: FreeExploration,
};

interface MissionArtProps {
  scene: MissionScene;
  className?: string;
}

export function MissionArt({ scene, className }: MissionArtProps) {
  const id = useId();
  const Scene = SCENES[scene];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 160"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <Scene id={id} />
    </svg>
  );
}

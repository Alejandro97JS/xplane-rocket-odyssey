import type { PayloadId } from '@rocket-odyssey/game-core';
import type { ReactNode } from 'react';

/**
 * Illustrations of the payloads. Each one is drawn in a 160 x 110 box.
 * They are decorative: the card that shows one names the payload in text.
 */

const HULL = '#e3e9f3';
const HULL_SHADE = '#a7b3c8';
const HULL_DARK = '#6f7d96';
const FOIL = '#e0aa3e';
const FOIL_LIGHT = '#f4d37c';
const FOIL_SHADE = '#a8741c';
const CELL = '#1e4fa8';
const CELL_LINE = '#6fb1ff';
const DARK = '#1b2540';
const GLASS = '#0b2f78';
const CYAN = '#38bdf8';
const RED = '#ff7c89';

interface PanelProps {
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows?: number;
  transform?: string;
}

/** A solar panel: blue cells with a light grid. */
function Panel({ x, y, w, h, cols, rows = 2, transform }: PanelProps) {
  const lines: ReactNode[] = [];
  for (let c = 1; c < cols; c++) {
    const lx = x + (w * c) / cols;
    lines.push(<line key={`c${c}`} x1={lx} y1={y} x2={lx} y2={y + h} />);
  }
  for (let r = 1; r < rows; r++) {
    const ly = y + (h * r) / rows;
    lines.push(<line key={`r${r}`} x1={x} y1={ly} x2={x + w} y2={ly} />);
  }
  return (
    <g transform={transform}>
      <rect x={x} y={y} width={w} height={h} fill={CELL} stroke={HULL_SHADE} strokeWidth="1.2" />
      <g stroke={CELL_LINE} strokeWidth="0.7" opacity="0.8">
        {lines}
      </g>
    </g>
  );
}

function CubeSat() {
  return (
    <g>
      <g stroke={HULL} strokeWidth="2" strokeLinecap="round">
        <line x1="58" y1="42" x2="32" y2="18" />
        <line x1="112" y1="30" x2="138" y2="10" />
        <line x1="58" y1="82" x2="34" y2="100" />
        <line x1="98" y1="82" x2="122" y2="102" />
      </g>
      <g fill={CYAN}>
        <circle cx="32" cy="18" r="2.4" />
        <circle cx="138" cy="10" r="2.4" />
        <circle cx="34" cy="100" r="2.4" />
        <circle cx="122" cy="102" r="2.4" />
      </g>
      <polygon points="58,42 72,30 112,30 98,42" fill="#ffffff" />
      <polygon points="98,42 112,30 112,70 98,82" fill={HULL_SHADE} />
      <rect x="58" y="42" width="40" height="40" fill={HULL} />
      <g fill={CELL} stroke={CELL_LINE} strokeWidth="0.8">
        <rect x="62" y="46" width="15" height="15" />
        <rect x="79" y="46" width="15" height="15" />
        <rect x="62" y="63" width="15" height="15" />
        <rect x="79" y="63" width="15" height="15" />
        <polygon points="101,44 109,37 109,53 101,60" />
        <polygon points="101,63 109,56 109,69 101,77" />
      </g>
      <ellipse cx="85" cy="36" rx="8" ry="3.4" fill={DARK} />
      <ellipse cx="85" cy="36" rx="4" ry="1.7" fill={CYAN} />
      <g fill="none" stroke={CYAN} strokeWidth="1.6" strokeLinecap="round" opacity="0.8">
        <path d="M128 40a14 14 0 0 1 0 20" />
        <path d="M135 34a24 24 0 0 1 0 32" />
      </g>
    </g>
  );
}

function EarthObservation() {
  return (
    <g>
      <rect x="50" y="50" width="12" height="4" fill={HULL_DARK} />
      <rect x="98" y="50" width="12" height="4" fill={HULL_DARK} />
      <Panel x={6} y={38} w={46} h={28} cols={4} />
      <Panel x={108} y={38} w={46} h={28} cols={4} />
      <polygon points="66,72 94,72 100,98 60,98" fill={HULL} />
      <polygon points="84,72 94,72 100,98 86,98" fill={HULL_SHADE} />
      <ellipse cx="80" cy="98" rx="20" ry="6" fill={DARK} />
      <ellipse cx="80" cy="98" rx="13" ry="3.8" fill={GLASS} />
      <ellipse cx="75" cy="97" rx="4" ry="1.4" fill={CYAN} />
      <rect x="60" y="28" width="40" height="46" fill={FOIL} />
      <rect x="60" y="28" width="12" height="46" fill={FOIL_LIGHT} opacity="0.8" />
      <rect x="88" y="28" width="12" height="46" fill={FOIL_SHADE} opacity="0.85" />
      <rect x="60" y="28" width="40" height="5" fill={HULL_DARK} />
      <path
        d="M72 28V18M72 18l-7-6M72 18l7-6"
        stroke={HULL}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="84" y="20" width="10" height="8" fill={HULL} />
    </g>
  );
}

function SarRadar() {
  return (
    <g>
      <Panel x={48} y={6} w={64} h={13} cols={6} rows={1} />
      <rect x="77" y="19" width="6" height="6" fill={HULL_DARK} />
      <rect x="62" y="25" width="36" height="30" fill={FOIL} />
      <rect x="62" y="25" width="10" height="30" fill={FOIL_LIGHT} opacity="0.8" />
      <rect x="88" y="25" width="10" height="30" fill={FOIL_SHADE} opacity="0.85" />
      <polygon points="72,55 88,55 92,64 68,64" fill={HULL_DARK} />
      {/* The long flat radar antenna */}
      <polygon points="12,66 148,58 148,74 12,82" fill={HULL} />
      <polygon points="12,82 148,74 148,78 12,86" fill={HULL_DARK} />
      <g stroke={HULL_SHADE} strokeWidth="1.2">
        <line x1="39" y1="64.400" x2="39" y2="80.400" />
        <line x1="66" y1="62.800" x2="66" y2="78.800" />
        <line x1="94" y1="61.200" x2="94" y2="77.200" />
        <line x1="121" y1="59.600" x2="121" y2="75.600" />
      </g>
      <g fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round">
        <path d="M58 92q22 8 44-2" opacity="0.9" />
        <path d="M48 98q32 12 64-3" opacity="0.6" />
        <path d="M38 104q42 14 84-4" opacity="0.35" />
      </g>
    </g>
  );
}

function Telecom() {
  return (
    <g>
      <rect x="50" y="53" width="12" height="4" fill={HULL_DARK} />
      <rect x="98" y="53" width="12" height="4" fill={HULL_DARK} />
      <Panel x={2} y={44} w={50} h={22} cols={5} />
      <Panel x={108} y={44} w={50} h={22} cols={5} />
      <rect x="60" y="32" width="40" height="46" fill={FOIL} />
      <rect x="60" y="32" width="12" height="46" fill={FOIL_LIGHT} opacity="0.8" />
      <rect x="88" y="32" width="12" height="46" fill={FOIL_SHADE} opacity="0.85" />
      {/* Upper dish with its feed */}
      <path d="M80 32V24" stroke={HULL_DARK} strokeWidth="3" />
      <ellipse cx="80" cy="20" rx="24" ry="8" fill={HULL} />
      <ellipse cx="80" cy="19" rx="17" ry="5" fill={HULL_SHADE} />
      <path d="M80 19V7" stroke={HULL} strokeWidth="1.8" />
      <circle cx="80" cy="6" r="2.6" fill={CYAN} />
      {/* Lower dishes pointing at the Earth */}
      <g>
        <path d="M66 78l-6 12" stroke={HULL_DARK} strokeWidth="3" />
        <ellipse cx="57" cy="94" rx="15" ry="6" fill={HULL} transform="rotate(-18 57 94)" />
        <ellipse cx="57" cy="94" rx="10" ry="3.6" fill={HULL_SHADE} transform="rotate(-18 57 94)" />
        <path d="M94 78l6 12" stroke={HULL_DARK} strokeWidth="3" />
        <ellipse cx="103" cy="94" rx="15" ry="6" fill={HULL} transform="rotate(18 103 94)" />
        <ellipse
          cx="103"
          cy="94"
          rx="10"
          ry="3.6"
          fill={HULL_SHADE}
          transform="rotate(18 103 94)"
        />
      </g>
    </g>
  );
}

function Observatory() {
  return (
    <g>
      <rect x="77" y="28" width="5" height="12" fill={HULL_DARK} />
      <rect x="77" y="70" width="5" height="12" fill={HULL_DARK} />
      <Panel x={52} y={6} w={56} h={22} cols={5} />
      <Panel x={52} y={82} w={56} h={22} cols={5} />
      {/* Aperture door */}
      <polygon points="126,40 146,26 149,31 129,45" fill={HULL_SHADE} />
      {/* Tube */}
      <rect x="44" y="40" width="82" height="30" fill={HULL} />
      <rect x="44" y="40" width="82" height="7" fill="#ffffff" opacity="0.85" />
      <rect x="44" y="60" width="82" height="10" fill={HULL_SHADE} />
      <rect x="72" y="40" width="9" height="30" fill={FOIL} />
      <rect x="100" y="40" width="3" height="30" fill={HULL_DARK} />
      {/* Aft shroud */}
      <rect x="22" y="35" width="26" height="40" fill={HULL_SHADE} />
      <rect x="22" y="35" width="26" height="8" fill={HULL} />
      <rect x="22" y="64" width="26" height="11" fill={HULL_DARK} />
      {/* Opening with the mirror inside */}
      <ellipse cx="126" cy="55" rx="7" ry="15" fill={DARK} />
      <ellipse cx="126" cy="55" rx="4" ry="9.500" fill={FOIL} />
      <ellipse cx="125" cy="52" rx="1.600" ry="3.600" fill={FOIL_LIGHT} />
    </g>
  );
}

function CapsuleSuborbital() {
  return (
    <g>
      <rect x="71" y="90" width="18" height="7" fill={HULL_DARK} />
      <ellipse cx="80" cy="85" rx="34" ry="8" fill={DARK} />
      <polygon points="48,83 112,83 93,40 67,40" fill={HULL} />
      <polygon points="48,83 62,83 72,40 67,40" fill="#ffffff" opacity="0.85" />
      <polygon points="92,83 112,83 93,40 86,40" fill={HULL_SHADE} />
      <g stroke={HULL_DARK} strokeWidth="0.9" opacity="0.6">
        <line x1="60" y1="69" x2="100" y2="69" />
        <line x1="64" y1="55" x2="96" y2="55" />
      </g>
      <rect
        x="73"
        y="56"
        width="14"
        height="11"
        rx="3"
        fill={GLASS}
        stroke={HULL_DARK}
        strokeWidth="1.5"
      />
      <rect x="75" y="58" width="4" height="3" rx="1" fill={CYAN} />
      <rect x="69" y="26" width="22" height="14" fill={HULL_SHADE} />
      <rect x="69" y="26" width="7" height="14" fill={HULL} />
      <polygon points="71,26 89,26 85,16 75,16" fill={RED} />
    </g>
  );
}

function CapsuleClassic() {
  return (
    <g>
      <Panel x={6} y={70} w={50} h={15} cols={5} rows={1} />
      <Panel x={104} y={70} w={50} h={15} cols={5} rows={1} />
      {/* Docking probe and orbital module */}
      <rect x="77" y="3" width="6" height="8" fill={HULL_DARK} />
      <circle cx="80" cy="25" r="16" fill={HULL} />
      <path d="M80 9a16 16 0 0 1 0 32a22 16 0 0 0 0-32z" fill={HULL_SHADE} />
      <circle cx="73" cy="22" r="3.400" fill={GLASS} />
      {/* Descent module */}
      <polygon points="67,40 93,40 103,66 57,66" fill="#c9d3e2" />
      <polygon points="67,40 73,40 66,66 57,66" fill="#ffffff" opacity="0.85" />
      <polygon points="86,40 93,40 103,66 90,66" fill={HULL_DARK} opacity="0.75" />
      <circle cx="80" cy="54" r="4.200" fill={GLASS} stroke={HULL_DARK} strokeWidth="1.400" />
      {/* Service module */}
      <rect x="58" y="66" width="44" height="26" fill={HULL} />
      <rect x="58" y="66" width="12" height="26" fill="#ffffff" opacity="0.85" />
      <rect x="90" y="66" width="12" height="26" fill={HULL_SHADE} />
      <rect x="58" y="66" width="44" height="4" fill={DARK} />
      <polygon points="58,92 102,92 107,102 53,102" fill={HULL_DARK} />
    </g>
  );
}

function CapsuleModern() {
  return (
    <g>
      <polygon points="56,98 46,104 56,80" fill={HULL_SHADE} />
      <polygon points="104,98 114,104 104,80" fill={HULL_DARK} />
      {/* Trunk with solar cells on one side */}
      <rect x="56" y="68" width="48" height="32" fill={HULL} />
      <rect x="80" y="68" width="24" height="32" fill={HULL_SHADE} />
      <Panel x={56} y={70} w={24} h={28} cols={3} rows={3} />
      {/* Heat shield and capsule */}
      <rect x="53" y="62" width="54" height="7" rx="2" fill={DARK} />
      <path d="M54 62C56 32 70 12 80 12C90 12 104 32 106 62Z" fill={HULL} />
      <path d="M54 62C56 32 70 12 80 12C72 26 66 42 65 62Z" fill="#ffffff" opacity="0.85" />
      <path d="M96 62C96 40 90 22 80 12C90 12 104 32 106 62Z" fill={HULL_SHADE} />
      <path d="M72 20h16" stroke={HULL_DARK} strokeWidth="1.300" />
      <rect
        x="68"
        y="34"
        width="9"
        height="10"
        rx="2.500"
        fill={GLASS}
        stroke={HULL_DARK}
        strokeWidth="1.300"
      />
      <rect
        x="83"
        y="34"
        width="9"
        height="10"
        rx="2.500"
        fill={GLASS}
        stroke={HULL_DARK}
        strokeWidth="1.300"
      />
      <ellipse cx="62" cy="54" rx="3" ry="4" fill={DARK} />
      <ellipse cx="98" cy="54" rx="3" ry="4" fill={DARK} />
    </g>
  );
}

function CapsuleShielded() {
  return (
    <g>
      <Panel x={4} y={60} w={48} h={11} cols={5} rows={1} transform="rotate(-14 52 66)" />
      <Panel x={4} y={80} w={48} h={11} cols={5} rows={1} transform="rotate(12 52 86)" />
      <Panel x={108} y={60} w={48} h={11} cols={5} rows={1} transform="rotate(14 108 66)" />
      <Panel x={108} y={80} w={48} h={11} cols={5} rows={1} transform="rotate(-12 108 86)" />
      {/* Service module and engine */}
      <polygon points="71,94 89,94 96,106 64,106" fill="#39445c" />
      <rect x="55" y="66" width="50" height="28" fill={HULL} />
      <rect x="55" y="66" width="14" height="28" fill="#ffffff" opacity="0.85" />
      <rect x="91" y="66" width="14" height="28" fill={HULL_SHADE} />
      {/* Capsule with thick shielding */}
      <rect x="70" y="12" width="20" height="9" fill={HULL_SHADE} />
      <polygon points="48,60 112,60 94,20 66,20" fill="#5d6c8a" />
      <polygon points="48,60 62,60 72,20 66,20" fill="#8292b0" />
      <polygon points="94,60 112,60 94,20 88,20" fill="#3a4660" />
      <g stroke="#8292b0" strokeWidth="0.900" opacity="0.7">
        <line x1="58" y1="46" x2="102" y2="46" />
        <line x1="63" y1="33" x2="97" y2="33" />
      </g>
      {/* Shield emblem */}
      <path
        d="M80 28l9 3.500v7.500c0 6-4 9.500-9 11.500c-5-2-9-5.500-9-11.500v-7.500z"
        fill={GLASS}
        stroke={CYAN}
        strokeWidth="1.800"
      />
      <path
        d="M76 39.500l3 3 5.500-6"
        fill="none"
        stroke={CYAN}
        strokeWidth="1.800"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="45"
        y="59"
        width="70"
        height="8"
        rx="2"
        fill={DARK}
        stroke={CYAN}
        strokeWidth="1.400"
      />
    </g>
  );
}

function StationCore() {
  return (
    <g>
      <rect x="18" y="52" width="124" height="6" fill={HULL_DARK} />
      <Panel x={8} y={12} w={32} h={36} cols={3} rows={3} />
      <Panel x={8} y={62} w={32} h={36} cols={3} rows={3} />
      <Panel x={120} y={12} w={32} h={36} cols={3} rows={3} />
      <Panel x={120} y={62} w={32} h={36} cols={3} rows={3} />
      {/* Docking ports on four sides */}
      <rect x="51" y="47" width="10" height="16" fill={HULL_SHADE} />
      <rect x="99" y="47" width="10" height="16" fill={HULL_SHADE} />
      <rect x="72" y="26" width="16" height="10" fill={HULL_SHADE} />
      <rect x="72" y="74" width="16" height="10" fill={HULL_SHADE} />
      <rect x="60" y="35" width="40" height="40" rx="9" fill={HULL} />
      <path d="M60 44a9 9 0 0 1 9-9h8v40h-8a9 9 0 0 1-9-9z" fill="#ffffff" opacity="0.85" />
      <path d="M88 35h3a9 9 0 0 1 9 9v22a9 9 0 0 1-9 9h-3z" fill={HULL_SHADE} />
      <circle cx="80" cy="55" r="9" fill={DARK} />
      <circle cx="80" cy="55" r="5.500" fill={GLASS} stroke={CYAN} strokeWidth="1.500" />
      <rect x="74" y="22" width="12" height="4" fill={DARK} />
      <rect x="74" y="84" width="12" height="4" fill={DARK} />
    </g>
  );
}

function StationLab() {
  return (
    <g>
      {/* Experiment pallet on top */}
      <path
        d="M118 22v-9M118 13l-6-5M118 13l6-5"
        stroke={HULL}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="66" y="22" width="60" height="12" fill={FOIL} />
      <rect x="66" y="22" width="60" height="3.500" fill={FOIL_LIGHT} />
      <rect x="72" y="14" width="12" height="8" fill={HULL_DARK} />
      <rect
        x="90"
        y="16"
        width="16"
        height="6"
        fill={CELL}
        stroke={CELL_LINE}
        strokeWidth="0.800"
      />
      {/* Pressurised cylinder */}
      <polygon points="22,40 8,48 8,62 22,70" fill={HULL_SHADE} />
      <rect x="138" y="45" width="12" height="20" fill={HULL_DARK} />
      <rect x="22" y="34" width="116" height="42" rx="9" fill={HULL} />
      <rect x="26" y="34" width="108" height="10" rx="5" fill="#ffffff" opacity="0.85" />
      <rect x="26" y="64" width="108" height="12" rx="5" fill={HULL_SHADE} />
      <g stroke={HULL_DARK} strokeWidth="1.200" opacity="0.7">
        <line x1="66" y1="36" x2="66" y2="74" />
        <line x1="96" y1="36" x2="96" y2="74" />
        <line x1="122" y1="36" x2="122" y2="74" />
      </g>
      <circle cx="46" cy="55" r="9" fill={HULL_DARK} />
      <circle cx="46" cy="55" r="6.500" fill={GLASS} />
      <circle cx="43.500" cy="52.500" r="2" fill={CYAN} />
      <rect x="74" y="50" width="16" height="10" rx="2" fill={CYAN} opacity="0.85" />
      <rect x="102" y="50" width="14" height="10" rx="2" fill={RED} opacity="0.85" />
      <path d="M30 84h100" stroke={FOIL} strokeWidth="2.200" strokeLinecap="round" />
    </g>
  );
}

function StationHabitat() {
  return (
    <g>
      <rect x="76" y="14" width="5" height="10" fill={HULL_DARK} />
      <Panel x={56} y={3} w={46} h={12} cols={5} rows={1} />
      <rect x="12" y="42" width="16" height="26" fill={HULL_DARK} />
      <rect x="132" y="42" width="16" height="26" fill={HULL_DARK} />
      <rect x="24" y="22" width="112" height="66" rx="30" fill="#dfe6f0" />
      <path d="M54 22h52a30 30 0 0 1 22 9H32a30 30 0 0 1 22-9z" fill="#ffffff" opacity="0.9" />
      <path d="M30 76h100a30 30 0 0 1-24 12H54a30 30 0 0 1-24-12z" fill={HULL_SHADE} />
      {/* Restraint straps of the inflatable shell */}
      <g fill="none" stroke={HULL_DARK} strokeWidth="1.300" opacity="0.55">
        <path d="M52 23q-8 32 0 64" />
        <path d="M80 22q-5 33 0 66" />
        <path d="M108 23q8 32 0 64" />
      </g>
      {/* Lit windows */}
      {[44, 66, 94, 116].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="55" r="7.500" fill={HULL_DARK} />
          <circle cx={cx} cy="55" r="5.500" fill="#ffdc6b" />
          <circle cx={cx - 1.5} cy="53.500" r="1.800" fill="#fff6d6" />
        </g>
      ))}
    </g>
  );
}

const GLYPHS: Record<PayloadId, () => ReactNode> = {
  cubesat: CubeSat,
  earth_observation: EarthObservation,
  sar_radar: SarRadar,
  telecom: Telecom,
  observatory: Observatory,
  capsule_suborbital: CapsuleSuborbital,
  capsule_classic: CapsuleClassic,
  capsule_modern: CapsuleModern,
  capsule_shielded: CapsuleShielded,
  station_core: StationCore,
  station_lab: StationLab,
  station_habitat: StationHabitat,
};

/** The drawing of a payload as a group, to place inside another `<svg>`. */
export function PayloadGlyph({ payloadId }: { payloadId: PayloadId }) {
  const Glyph = GLYPHS[payloadId];
  return <Glyph />;
}

interface PayloadArtProps {
  payloadId: PayloadId;
  className?: string;
}

export function PayloadArt({ payloadId, className }: PayloadArtProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 160 110"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <PayloadGlyph payloadId={payloadId} />
    </svg>
  );
}

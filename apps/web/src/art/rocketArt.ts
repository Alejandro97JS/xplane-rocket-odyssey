import type { RocketId } from '@rocket-odyssey/game-core';

/**
 * Drawings of the launchers as plain data, so the same geometry is drawn as
 * SVG on the rocket cards and with PixiJS in the launch animation.
 *
 * Units are metres. `x` is the distance from the centre line and `y` the
 * height above the nozzle exits, so y grows upwards.
 */

export type Shape =
  | { kind: 'poly'; pts: number[]; fill: string; opacity?: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string; opacity?: number };

export interface Engine {
  /** Centre of the nozzle exit. */
  x: number;
  y: number;
  /** Width of the nozzle exit. */
  w: number;
}

export interface RocketArt {
  id: RocketId;
  height: number;
  /** Half of the widest part, boosters and wings included. */
  halfWidth: number;
  /** The part dropped at stage separation. */
  lower: Shape[];
  /** The part that goes on to orbit, drawn behind the lower part. */
  upperBack: Shape[];
  /** Pieces of the upper part drawn in front of the lower part. */
  upperFront: Shape[];
  /** Nose fairing in two halves, or null when the payload rides inside the vehicle. */
  fairing: { left: Shape[]; right: Shape[] } | null;
  /** Height where the nose (fairing or capsule) starts. */
  noseBaseY: number;
  /** Diameter of the vehicle where the nose starts. */
  noseBaseDiameter: number;
  /** Height where the two parts come apart. */
  separationY: number;
  enginesLower: Engine[];
  enginesUpper: Engine[];
  /** True when the upper engines also fire from liftoff, as on the Space Shuttle. */
  upperBurnsFromLiftoff: boolean;
}

interface Palette {
  base: string;
  light: string;
  dark: string;
}

const WHITE: Palette = { base: '#e3e9f3', light: '#ffffff', dark: '#a7b3c8' };
const GREY: Palette = { base: '#b3bece', light: '#d6dee9', dark: '#7c889e' };
const STEEL: Palette = { base: '#a4b0c2', light: '#e1e8f1', dark: '#6a768c' };
const BLACK: Palette = { base: '#2c364c', light: '#55627e', dark: '#171d2d' };
const ORANGE: Palette = { base: '#d8742a', light: '#f29d59', dark: '#9a4d16' };
const NOZZLE = '#39445c';
const NOZZLE_DARK = '#1c2335';

const poly = (pts: number[], fill: string, opacity?: number): Shape =>
  opacity === undefined ? { kind: 'poly', pts, fill } : { kind: 'poly', pts, fill, opacity };

const rect = (x0: number, y0: number, x1: number, y1: number, fill: string, opacity?: number) =>
  poly([x0, y0, x1, y0, x1, y1, x0, y1], fill, opacity);

/** A body section whose diameter goes from `d0` at `y0` to `d1` at `y1`, with simple shading. */
function section(cx: number, y0: number, y1: number, d0: number, d1: number, c: Palette): Shape[] {
  const a = d0 / 2;
  const b = d1 / 2;
  return [
    poly([cx - a, y0, cx + a, y0, cx + b, y1, cx - b, y1], c.base),
    // Highlight down the left, shadow down the right: light comes from the left.
    poly([cx - a * 0.72, y0, cx - a * 0.4, y0, cx - b * 0.4, y1, cx - b * 0.72, y1], c.light, 0.75),
    poly([cx + a * 0.45, y0, cx + a, y0, cx + b, y1, cx + b * 0.45, y1], c.dark, 0.8),
  ];
}

const tube = (cx: number, y0: number, y1: number, d: number, c: Palette) =>
  section(cx, y0, y1, d, d, c);

/** Rounded nose profile: half-width at fraction `t` of the nose height. */
const noseProfile = (t: number) => Math.cos((t * Math.PI) / 2) ** 0.75;

/** A full rounded nose cone. */
function nose(cx: number, y0: number, y1: number, d: number, c: Palette): Shape[] {
  return [...noseHalf(cx, y0, y1, d, -1, c), ...noseHalf(cx, y0, y1, d, 1, c)];
}

/** One half of a rounded nose cone. `side` is -1 for the left half and 1 for the right. */
function noseHalf(
  cx: number,
  y0: number,
  y1: number,
  d: number,
  side: -1 | 1,
  c: Palette,
): Shape[] {
  const STEPS = 9;
  const outline = (scale: number) => {
    const pts: number[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      pts.push(cx + side * (d / 2) * scale * noseProfile(t), y0 + (y1 - y0) * t);
    }
    return pts;
  };
  const outer = outline(1);
  const shapes: Shape[] = [poly([cx, y0, ...outer], side === -1 ? c.base : c.dark)];
  if (side === -1) {
    // Highlight band on the lit side.
    const inner = outline(0.4);
    const band = outline(0.72);
    const reversed: number[] = [];
    for (let i = inner.length - 2; i >= 0; i -= 2) reversed.push(inner[i]!, inner[i + 1]!);
    shapes.push(poly([...band, ...reversed], c.light, 0.75));
  } else {
    // The half nearest the centre line keeps the base colour.
    const inner = outline(0.45);
    shapes.push(poly([cx, y0, ...inner], c.base));
  }
  return shapes;
}

/** A fairing half: an optional flare at the bottom, a straight part and a rounded tip. */
function fairingHalf(
  y0: number,
  yFlare: number,
  yStraight: number,
  yTop: number,
  dBase: number,
  d: number,
  side: -1 | 1,
  c: Palette,
): Shape[] {
  const shade = side === -1 ? c.base : c.dark;
  const shapes: Shape[] = [];
  if (yFlare > y0) {
    shapes.push(poly([0, y0, (side * dBase) / 2, y0, (side * d) / 2, yFlare, 0, yFlare], shade));
  }
  shapes.push(rect(0, yFlare, (side * d) / 2, yStraight, shade));
  if (side === -1) {
    shapes.push(rect(-d * 0.36, yFlare, -d * 0.2, yStraight, c.light, 0.75));
  } else {
    shapes.push(rect(0, yFlare, d * 0.225, yStraight, c.base));
  }
  shapes.push(...noseHalf(0, yStraight, yTop, d, side, c));
  return shapes;
}

const bell = (cx: number, yTop: number, w: number, h: number): Shape[] => [
  poly([cx - w * 0.28, yTop, cx + w * 0.28, yTop, cx + w / 2, yTop - h, cx - w / 2, yTop - h], NOZZLE),
  poly([cx + w * 0.08, yTop, cx + w * 0.28, yTop, cx + w / 2, yTop - h, cx + w * 0.16, yTop - h], NOZZLE_DARK),
];

const band = (cx: number, y0: number, y1: number, d: number, fill: string) =>
  rect(cx - d / 2, y0, cx + d / 2, y1, fill);

function electron(): RocketArt {
  const d = 1.2;
  const lower: Shape[] = [
    ...bell(-0.38, 0.5, 0.34, 0.5),
    ...bell(0, 0.5, 0.34, 0.5),
    ...bell(0.38, 0.5, 0.34, 0.5),
    ...tube(0, 0.5, 12.4, d, BLACK),
    band(0, 0.5, 0.9, d, '#8794ab'),
    band(0, 8.6, 8.9, d, '#e3e9f3'),
    band(0, 9.2, 9.35, d, '#ff7c89'),
    ...tube(0, 12.4, 13, d, GREY),
  ];
  const upperBack: Shape[] = [
    ...bell(0, 13, 0.6, 0.9),
    ...tube(0, 13, 15, d, BLACK),
    band(0, 14.7, 15, d, '#8794ab'),
  ];
  return {
    id: 'electron',
    height: 18,
    halfWidth: 0.6,
    lower,
    upperBack,
    upperFront: [],
    fairing: {
      left: fairingHalf(15, 15, 16.3, 18, d, d, -1, BLACK),
      right: fairingHalf(15, 15, 16.3, 18, d, d, 1, BLACK),
    },
    noseBaseY: 15,
    noseBaseDiameter: d,
    separationY: 13,
    enginesLower: [
      { x: -0.38, y: 0, w: 0.34 },
      { x: 0, y: 0, w: 0.34 },
      { x: 0.38, y: 0, w: 0.34 },
    ],
    enginesUpper: [{ x: 0, y: 12.1, w: 0.6 }],
    upperBurnsFromLiftoff: false,
  };
}

function soyuz(): RocketArt {
  const booster = (side: -1 | 1): Shape[] => {
    const x = side * 2.3;
    return [
      ...bell(x - 0.55, 1.2, 0.8, 1.2),
      ...bell(x + 0.55, 1.2, 0.8, 1.2),
      ...section(x, 1.2, 15.5, 2.68, 1.5, GREY),
      // The tip leans towards the core.
      poly([x - 0.75, 15.5, x + 0.75, 15.5, x - side * 0.55, 20.8], side === -1 ? GREY.base : GREY.dark),
      band(x, 1.2, 2.6, 2.68, '#d8742a'),
    ];
  };
  const lower: Shape[] = [
    ...booster(-1),
    ...booster(1),
    ...bell(-0.5, 1.2, 0.8, 1.2),
    ...bell(0.5, 1.2, 0.8, 1.2),
    ...tube(0, 1.2, 14, 2.05, WHITE),
    ...section(0, 14, 19, 2.05, 2.95, WHITE),
    ...tube(0, 19, 27.8, 2.95, WHITE),
    band(0, 1.2, 2.6, 2.05, '#d8742a'),
    band(0, 26.6, 27.8, 2.95, '#5f6f66'),
    // Open lattice between the stages.
    ...tube(0, 27.8, 28.9, 2.3, BLACK),
  ];
  const upperBack: Shape[] = [
    ...bell(0, 28.9, 1.4, 1.5),
    ...tube(0, 28.9, 35.5, 2.66, WHITE),
    band(0, 28.9, 29.6, 2.66, '#5f6f66'),
  ];
  return {
    id: 'soyuz',
    height: 46,
    halfWidth: 3.7,
    lower,
    upperBack,
    upperFront: [],
    fairing: {
      left: fairingHalf(35.5, 36.6, 42, 46, 2.66, 3.7, -1, WHITE),
      right: fairingHalf(35.5, 36.6, 42, 46, 2.66, 3.7, 1, WHITE),
    },
    noseBaseY: 35.5,
    noseBaseDiameter: 2.66,
    separationY: 28.9,
    enginesLower: [
      { x: -2.3, y: 0, w: 1.6 },
      { x: 0, y: 0, w: 1.5 },
      { x: 2.3, y: 0, w: 1.6 },
    ],
    enginesUpper: [{ x: 0, y: 27.4, w: 1.4 }],
    upperBurnsFromLiftoff: false,
  };
}

function falcon9(): RocketArt {
  const d = 3.7;
  const leg = (side: -1 | 1) =>
    poly([side * 1.85, 9.5, side * 2.75, 1.4, side * 1.85, 1.4], BLACK.base);
  const lower: Shape[] = [
    ...bell(-1.15, 1.2, 1, 1.2),
    ...bell(0, 1.2, 1, 1.2),
    ...bell(1.15, 1.2, 1, 1.2),
    ...tube(0, 1.2, 42.6, d, WHITE),
    band(0, 1.2, 3, d, BLACK.base),
    leg(-1),
    leg(1),
    // Grid fins.
    rect(-2.75, 40, -1.85, 41, BLACK.base),
    rect(1.85, 40, 2.75, 41, BLACK.base),
    ...tube(0, 42.6, 47.2, d, BLACK),
  ];
  const upperBack: Shape[] = [
    ...bell(0, 47.2, 2.4, 2.8),
    ...tube(0, 47.2, 56.5, d, WHITE),
    band(0, 47.2, 47.9, d, '#8794ab'),
  ];
  return {
    id: 'falcon9',
    height: 70,
    halfWidth: 2.75,
    lower,
    upperBack,
    upperFront: [],
    fairing: {
      left: fairingHalf(56.5, 58, 64.5, 70, d, 5.2, -1, WHITE),
      right: fairingHalf(56.5, 58, 64.5, 70, d, 5.2, 1, WHITE),
    },
    noseBaseY: 56.5,
    noseBaseDiameter: d,
    separationY: 47.2,
    enginesLower: [
      { x: -1.15, y: 0, w: 1 },
      { x: 0, y: 0, w: 1 },
      { x: 1.15, y: 0, w: 1 },
    ],
    enginesUpper: [{ x: 0, y: 44.4, w: 2.4 }],
    upperBurnsFromLiftoff: false,
  };
}

function ariane6(): RocketArt {
  const d = 5.4;
  const booster = (side: -1 | 1): Shape[] => {
    const x = side * 4.45;
    return [
      ...bell(x, 1, 2.2, 1),
      ...tube(x, 1, 14.5, 3.4, GREY),
      ...nose(x, 14.5, 19, 3.4, GREY),
      band(x, 1, 2.2, 3.4, BLACK.base),
    ];
  };
  const lower: Shape[] = [
    ...booster(-1),
    ...booster(1),
    ...bell(0, 1.6, 2.1, 1.6),
    ...tube(0, 1.6, 33, d, WHITE),
    band(0, 1.6, 3.2, d, BLACK.base),
    band(0, 21, 21.6, d, '#38bdf8'),
    ...tube(0, 33, 35, d, BLACK),
  ];
  const upperBack: Shape[] = [
    ...bell(0, 35, 2.4, 1.8),
    ...tube(0, 35, 41, d, WHITE),
  ];
  return {
    id: 'ariane6',
    height: 56,
    halfWidth: 6.15,
    lower,
    upperBack,
    upperFront: [],
    fairing: {
      left: [...fairingHalf(41, 41, 49, 56, d, d, -1, WHITE), rect(-d / 2, 42, 0, 42.8, '#38bdf8')],
      right: [...fairingHalf(41, 41, 49, 56, d, d, 1, WHITE), rect(0, 42, d / 2, 42.8, '#1d7fb5')],
    },
    noseBaseY: 41,
    noseBaseDiameter: d,
    separationY: 35,
    enginesLower: [
      { x: -4.45, y: 0, w: 2.2 },
      { x: 0, y: 0, w: 2.1 },
      { x: 4.45, y: 0, w: 2.2 },
    ],
    enginesUpper: [{ x: 0, y: 33.2, w: 2.4 }],
    upperBurnsFromLiftoff: false,
  };
}

function starship(): RocketArt {
  const d = 9;
  const lower: Shape[] = [
    ...[-3.2, -1.6, 0, 1.6, 3.2].flatMap((x) => bell(x, 1.5, 1.4, 1.5)),
    ...tube(0, 1.5, 69, d, STEEL),
    // Chines and grid fins.
    rect(-4.9, 3, -4.5, 22, STEEL.dark),
    rect(4.5, 3, 4.9, 22, STEEL.dark),
    rect(-6.6, 64, -4.5, 66.5, BLACK.base),
    rect(4.5, 64, 6.6, 66.5, BLACK.base),
    band(0, 1.5, 4, d, '#7a869b'),
    ...tube(0, 69, 71, d, BLACK),
  ];
  const flap = (side: -1 | 1, y0: number, y1: number, reach: number) =>
    poly(
      [side * 4.5, y0, side * (4.5 + reach), y0 + 1, side * (4.5 + reach), y1 - 2.5, side * 4.5, y1],
      BLACK.base,
    );
  const upperBack: Shape[] = [
    ...[-2, 0, 2].flatMap((x) => bell(x, 71, 1.8, 2.2)),
    flap(-1, 72, 84, 3),
    flap(1, 72, 84, 3),
    flap(-1, 99, 109, 2.2),
    flap(1, 99, 109, 2.2),
    ...tube(0, 71, 104, d, STEEL),
    ...nose(0, 104, 121, d, STEEL),
    // Heat shield tiles on the shaded side.
    rect(1.2, 71, 4.5, 104, BLACK.base, 0.85),
    poly(
      [1.2, 104, 4.5, 104, ...[0.2, 0.4, 0.6, 0.8, 1].flatMap((t) => [
        Math.max(1.2 * (1 - t), 4.5 * noseProfile(t)),
        104 + 17 * t,
      ]), 0, 121],
      BLACK.base,
      0.85,
    ),
  ];
  return {
    id: 'starship',
    height: 121,
    halfWidth: 7.5,
    lower,
    upperBack,
    upperFront: [],
    fairing: null,
    noseBaseY: 104,
    noseBaseDiameter: d,
    separationY: 71,
    enginesLower: [-3.2, -1.6, 0, 1.6, 3.2].map((x) => ({ x, y: 0, w: 1.4 })),
    enginesUpper: [-2, 0, 2].map((x) => ({ x, y: 68.8, w: 1.8 })),
    upperBurnsFromLiftoff: false,
  };
}

function ariane5(): RocketArt {
  const d = 5.4;
  const booster = (side: -1 | 1): Shape[] => {
    const x = side * 4.3;
    return [
      ...bell(x, 0.9, 2.6, 0.9),
      ...tube(x, 0.9, 27, 3.05, WHITE),
      ...nose(x, 27, 31.6, 3.05, WHITE),
      band(x, 0.9, 2.4, 3.05, BLACK.base),
      band(x, 13.5, 14.1, 3.05, '#8794ab'),
    ];
  };
  const lower: Shape[] = [
    ...booster(-1),
    ...booster(1),
    ...bell(0, 1.8, 2.2, 1.8),
    ...tube(0, 1.8, 30.5, d, WHITE),
    band(0, 1.8, 3.2, d, BLACK.base),
    band(0, 23.5, 24.1, d, '#ffc533'),
    ...tube(0, 30.5, 31.6, d, BLACK),
  ];
  const upperBack: Shape[] = [
    ...bell(0, 31.6, 1.8, 1.5),
    ...tube(0, 31.6, 35.2, d, WHITE),
  ];
  return {
    id: 'ariane5',
    height: 52,
    halfWidth: 5.85,
    lower,
    upperBack,
    upperFront: [],
    fairing: {
      left: fairingHalf(35.2, 35.2, 45, 52, d, d, -1, WHITE),
      right: fairingHalf(35.2, 35.2, 45, 52, d, d, 1, WHITE),
    },
    noseBaseY: 35.2,
    noseBaseDiameter: d,
    separationY: 31.6,
    enginesLower: [
      { x: -4.3, y: 0, w: 2.6 },
      { x: 0, y: 0, w: 2.2 },
      { x: 4.3, y: 0, w: 2.6 },
    ],
    enginesUpper: [{ x: 0, y: 30.1, w: 1.8 }],
    upperBurnsFromLiftoff: false,
  };
}

function saturn5(): RocketArt {
  const d = 10;
  const fin = (side: -1 | 1) =>
    poly([side * 5, 11, side * 8, 4.5, side * 8, 4, side * 5, 4], GREY.base);
  const lower: Shape[] = [
    ...[-3.3, 0, 3.3].flatMap((x) => bell(x, 4, 3.4, 4)),
    fin(-1),
    fin(1),
    ...tube(0, 4, 42, d, WHITE),
    // The black roll pattern of the first stage.
    rect(-5, 4, -1.8, 9, BLACK.base),
    rect(1.8, 4, 5, 9, BLACK.base),
    rect(-1.6, 22, 1.6, 34, BLACK.base),
    band(0, 34, 35.5, d, BLACK.base),
    ...tube(0, 42, 47, d, WHITE),
    rect(-5, 42, -1.8, 47, BLACK.base),
    rect(1.8, 42, 5, 47, BLACK.base),
    ...tube(0, 47, 67, d, WHITE),
    band(0, 65, 67, d, BLACK.base),
  ];
  const upperBack: Shape[] = [
    ...bell(0, 67.5, 3, 3.5),
    ...section(0, 67, 73, d, 6.6, WHITE),
    rect(-1.4, 67, 1.4, 73, BLACK.base),
    ...tube(0, 73, 85, 6.6, WHITE),
    band(0, 85, 86, 6.6, BLACK.base),
    ...section(0, 86, 93, 6.6, 3.9, WHITE),
  ];
  return {
    id: 'saturn5',
    height: 111,
    halfWidth: 8,
    lower,
    upperBack,
    upperFront: [],
    fairing: {
      left: fairingHalf(93, 93, 104, 111, 3.9, 3.9, -1, WHITE),
      right: fairingHalf(93, 93, 104, 111, 3.9, 3.9, 1, WHITE),
    },
    noseBaseY: 93,
    noseBaseDiameter: 3.9,
    separationY: 67,
    enginesLower: [
      { x: -3.3, y: 0, w: 3.4 },
      { x: 0, y: 0, w: 3.4 },
      { x: 3.3, y: 0, w: 3.4 },
    ],
    enginesUpper: [{ x: 0, y: 64, w: 3 }],
    upperBurnsFromLiftoff: false,
  };
}

function shuttle(): RocketArt {
  const booster = (side: -1 | 1): Shape[] => {
    const x = side * 6.05;
    return [
      ...section(x, 0, 2.6, 5, 3.7, GREY),
      ...tube(x, 2.6, 40, 3.7, WHITE),
      ...nose(x, 40, 45.5, 3.7, WHITE),
      band(x, 11, 11.6, 3.7, '#8794ab'),
      band(x, 26, 26.6, 3.7, '#8794ab'),
      band(x, 38.6, 40, 3.7, BLACK.base),
    ];
  };
  const tank: Shape[] = [...tube(0, 4, 38, 8.4, ORANGE), ...nose(0, 38, 47.5, 8.4, ORANGE)];
  const wing = (side: -1 | 1): Shape[] => [
    poly([side * 2.6, 22, side * 11.9, 7.2, side * 11.9, 5.4, side * 2.6, 5.4], WHITE.base),
    // Dark leading edge.
    poly([side * 2.6, 22, side * 11.9, 7.2, side * 11.9, 6.2, side * 2.6, 20.4], BLACK.base),
  ];
  const orbiter: Shape[] = [
    ...bell(-1.7, 5.2, 2.1, 2.6),
    ...bell(1.7, 5.2, 2.1, 2.6),
    ...bell(0, 6.6, 2.1, 2.6),
    ...wing(-1),
    ...wing(1),
    ...tube(0, 5.2, 32, 5.2, WHITE),
    ...nose(0, 32, 38.6, 5.2, WHITE),
    // Black nose cap and cockpit windows.
    ...nose(0, 36.2, 38.6, 2.6, BLACK),
    poly([-1.5, 32.6, 1.5, 32.6, 1.1, 34.2, -1.1, 34.2], BLACK.base),
    // Payload bay doors and tail.
    rect(-0.08, 10, 0.08, 30.5, '#7c889e'),
    rect(-0.35, 5.2, 0.35, 13.5, BLACK.base),
  ];
  return {
    id: 'shuttle',
    height: 47.5,
    halfWidth: 11.9,
    lower: [...booster(-1), ...booster(1)],
    upperBack: tank,
    upperFront: orbiter,
    fairing: null,
    noseBaseY: 38,
    noseBaseDiameter: 8.4,
    separationY: 4,
    enginesLower: [
      { x: -6.05, y: 0, w: 4.2 },
      { x: 6.05, y: 0, w: 4.2 },
    ],
    enginesUpper: [
      { x: -1.7, y: 2.6, w: 2.1 },
      { x: 0, y: 4, w: 2.1 },
      { x: 1.7, y: 2.6, w: 2.1 },
    ],
    upperBurnsFromLiftoff: true,
  };
}

const BUILDERS: Record<RocketId, () => RocketArt> = {
  electron,
  soyuz,
  falcon9,
  ariane6,
  starship,
  ariane5,
  saturn5,
  shuttle,
};

const cache = new Map<RocketId, RocketArt>();

export function getRocketArt(id: RocketId): RocketArt {
  let art = cache.get(id);
  if (!art) {
    art = BUILDERS[id]();
    cache.set(id, art);
  }
  return art;
}

/**
 * A crew capsule with its launch escape tower, drawn in place of the fairing
 * when the payload is only a capsule. Returns shapes whose base is at y = 0.
 */
export function buildCapsuleNose(diameter: number): { capsule: Shape[]; tower: Shape[]; height: number } {
  const d = diameter;
  const serviceTop = d * 0.45;
  const capsuleTop = serviceTop + d * 0.62;
  const towerTop = capsuleTop + d * 0.95;
  const capsule: Shape[] = [
    ...tube(0, 0, serviceTop, d * 0.94, GREY),
    band(0, serviceTop - d * 0.06, serviceTop, d * 0.98, BLACK.base),
    ...section(0, serviceTop, capsuleTop, d * 0.98, d * 0.42, WHITE),
    // Window.
    { kind: 'ellipse', cx: -d * 0.12, cy: serviceTop + d * 0.3, rx: d * 0.07, ry: d * 0.08, fill: '#0b2f78' },
  ];
  const tower: Shape[] = [
    // Lattice legs and the escape motor.
    poly([-d * 0.2, capsuleTop, -d * 0.15, capsuleTop, -d * 0.04, capsuleTop + d * 0.3, -d * 0.08, capsuleTop + d * 0.3], BLACK.light),
    poly([d * 0.2, capsuleTop, d * 0.15, capsuleTop, d * 0.04, capsuleTop + d * 0.3, d * 0.08, capsuleTop + d * 0.3], BLACK.light),
    ...tube(0, capsuleTop + d * 0.28, towerTop - d * 0.14, d * 0.17, WHITE),
    poly([-d * 0.085, towerTop - d * 0.14, d * 0.085, towerTop - d * 0.14, 0, towerTop], '#ff7c89'),
  ];
  return { capsule, tower, height: towerTop };
}

/**
 * A generic satellite folded for launch, shown under the fairing once the
 * fairing is gone. Returns shapes whose base is at y = 0.
 */
export function buildStowedPayload(diameter: number, height: number): Shape[] {
  const d = diameter * 0.62;
  const bodyTop = height * 0.72;
  return [
    // Adapter cone.
    poly([-diameter * 0.42, 0, diameter * 0.42, 0, d * 0.45, height * 0.14, -d * 0.45, height * 0.14], GREY.dark),
    rect(-d / 2, height * 0.14, d / 2, bodyTop, '#d9a53a'),
    rect(-d / 2, height * 0.14, -d * 0.2, bodyTop, '#f1cc6f', 0.8),
    rect(d * 0.18, height * 0.14, d / 2, bodyTop, '#a6761d', 0.85),
    // Folded solar panels on both sides.
    rect(-d * 0.66, height * 0.2, -d * 0.52, bodyTop * 0.94, '#1e4fa8'),
    rect(d * 0.52, height * 0.2, d * 0.66, bodyTop * 0.94, '#153a80'),
    // Antenna dish on top.
    poly([-d * 0.3, bodyTop, d * 0.3, bodyTop, d * 0.12, bodyTop + height * 0.1, -d * 0.12, bodyTop + height * 0.1], WHITE.base),
  ];
}

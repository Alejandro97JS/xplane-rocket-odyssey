import type { PayloadId } from '@rocket-odyssey/game-core';
import type { Graphics } from 'pixi.js';

/**
 * Each payload as the launch animation draws it, folded for the ride and
 * unfolding once it flies free. The look follows the payload cards
 * (`art/PayloadArt.tsx`): solar wings, dishes, radar, telescope and modules.
 *
 * Drawings are centred on (0, 0) in pixels, with y pointing down the screen
 * as PixiJS draws it. In the rocket, -y is the nose. In orbit the rocket lies
 * level, so +x faces the Earth: cameras, radar and dishes look that way.
 *
 * `w` and `h` are the size of the slot the payload rides in. `open` goes
 * from 0, folded, to 1, fully deployed.
 */

const HULL = 0xe3e9f3;
const HULL_LIGHT = 0xffffff;
const HULL_SHADE = 0xa7b3c8;
const HULL_DARK = 0x6f7d96;
const FOIL = 0xe0aa3e;
const FOIL_LIGHT = 0xf4d37c;
const FOIL_SHADE = 0xa8741c;
const CELL = 0x1e4fa8;
const CELL_LINE = 0x6fb1ff;
const DARK = 0x1b2540;
const GLASS = 0x0b2f78;
const CYAN = 0x38bdf8;
const RED = 0xff7c89;
const HEAT_SHIELD = 0x5b3a22;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Share of a step `k` of `steps` that is done when the whole is at `open`. */
const stage = (open: number, k: number, steps: number) => clamp01(open * steps - k);

function box(
  g: Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: number,
  alpha = 1,
) {
  const w = Math.abs(x1 - x0);
  const h = Math.abs(y1 - y0);
  if (w < 0.05 || h < 0.05) return;
  g.rect(Math.min(x0, x1), Math.min(y0, y1), w, h).fill({ color, alpha });
}

function line(
  g: Graphics,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  color: number,
  alpha = 1,
) {
  g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width, color, alpha });
}

/** A box wrapped in gold foil, lit from the left. */
function foilBody(g: Graphics, hw: number, hh: number) {
  box(g, -hw, -hh, hw, hh, FOIL);
  box(g, -hw, -hh, -hw * 0.4, hh, FOIL_LIGHT, 0.8);
  box(g, hw * 0.4, -hh, hw, hh, FOIL_SHADE, 0.85);
}

/** A white pressurised cylinder seen from the side, its axis along y. */
function cylinder(g: Graphics, hw: number, hh: number) {
  const r = Math.min(hw, hh) * 0.35;
  g.roundRect(-hw, -hh, hw * 2, hh * 2, r).fill({ color: HULL });
  box(g, -hw * 0.75, -hh + r * 0.4, -hw * 0.35, hh - r * 0.4, HULL_LIGHT, 0.85);
  box(g, hw * 0.45, -hh + r * 0.4, hw * 0.85, hh - r * 0.4, HULL_SHADE);
}

/**
 * A solar wing that unfolds out of the body like an accordion, one panel
 * after another. It grows from (x, y) along the direction (dx, dy), and
 * `span` is its size across that direction.
 */
function wing(
  g: Graphics,
  x: number,
  y: number,
  dx: number,
  dy: number,
  panelLength: number,
  span: number,
  panels: number,
  open: number,
) {
  if (open <= 0) return;
  const boom = panelLength * 0.25;
  const boomShown = boom * stage(open, 0, panels + 1);
  line(g, x, y, x + dx * boomShown, y + dy * boomShown, Math.max(1, span * 0.1), HULL_SHADE);
  let along = boom;
  for (let k = 0; k < panels; k++) {
    const f = stage(open, k + 1, panels + 1);
    if (f <= 0) break;
    const length = panelLength * f;
    // A panel swings open: it is narrow while it turns and full width at the end.
    const half = (span / 2) * (0.35 + 0.65 * f);
    const ax = x + dx * along;
    const ay = y + dy * along;
    const bx = ax + dx * length;
    const by = ay + dy * length;
    const px = -dy * half;
    const py = dx * half;
    g.poly([ax + px, ay + py, bx + px, by + py, bx - px, by - py, ax - px, ay - py]).fill({
      color: CELL,
    });
    // Grid of the cells.
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    line(g, mx + px, my + py, mx - px, my - py, 0.8, CELL_LINE, 0.8);
    line(g, ax, ay, bx, by, 0.8, CELL_LINE, 0.6);
    along += panelLength * f + panelLength * 0.04;
  }
}

/** A dish antenna seen from the side, opening towards +x. */
function dish(g: Graphics, x: number, y: number, size: number, tilt: number) {
  g.ellipse(x, y, size * 0.32, size).fill({ color: HULL });
  g.ellipse(x + size * 0.08, y, size * 0.18, size * 0.72).fill({ color: HULL_SHADE });
  const fx = x + size * 0.9 * Math.cos(tilt);
  const fy = y + size * 0.9 * Math.sin(tilt);
  line(g, x, y, fx, fy, 1, HULL);
  g.circle(fx, fy, Math.max(1, size * 0.12)).fill({ color: CYAN });
}

function cubesat(g: Graphics, w: number, h: number, open: number) {
  const c = Math.min(w, h, 26) * 0.5;
  // Whip antennas spring out from the corners.
  const whip = c * 1.4 * stage(open, 0, 2);
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    if (whip > 0.5) {
      line(g, sx * c, sy * c, sx * (c + whip * 0.7), sy * (c + whip * 0.7), 1, HULL);
      g.circle(sx * (c + whip * 0.7), sy * (c + whip * 0.7), 1.2).fill({ color: CYAN });
    }
  }
  // Two small panels fold out along the body.
  const panel = stage(open, 1, 2);
  if (panel > 0) {
    for (const side of [-1, 1]) {
      const length = c * 1.8 * panel;
      box(g, side * c, -c * 0.8, side * (c + length), c * 0.8, CELL);
      line(
        g,
        side * (c + length / 2),
        -c * 0.8,
        side * (c + length / 2),
        c * 0.8,
        0.8,
        CELL_LINE,
        0.8,
      );
    }
  }
  box(g, -c, -c, c, c, HULL);
  box(g, -c * 0.8, -c * 0.8, c * 0.8, c * 0.8, CELL);
  line(g, 0, -c * 0.8, 0, c * 0.8, 0.8, CELL_LINE);
  line(g, -c * 0.8, 0, c * 0.8, 0, 0.8, CELL_LINE);
}

function earthObservation(g: Graphics, w: number, h: number, open: number) {
  const hw = w * 0.34;
  const hh = Math.min(h * 0.4, hw * 1.5);
  // The camera looks at the Earth: a faint cone of view once it is switched on.
  const look = stage(open, 2, 3);
  if (look > 0) {
    const reach = hh * 6;
    g.poly([
      hw * 1.3,
      -hh * 0.2,
      hw * 1.3 + reach,
      -reach * 0.45,
      hw * 1.3 + reach,
      reach * 0.45,
      hw * 1.3,
      hh * 0.2,
    ]).fill({
      color: CYAN,
      alpha: 0.12 * look,
    });
  }
  // One long wing towards the back, away from the camera.
  wing(g, 0, hh, 0, 1, hh * 1.2, hw * 1.3, 2, clamp01(open * 1.5));
  foilBody(g, hw, hh);
  // Telescope barrel and lens on the side that faces the Earth.
  box(g, hw, -hh * 0.4, hw * 1.3, hh * 0.4, HULL_DARK);
  g.circle(hw * 1.3, 0, hh * 0.32).fill({ color: DARK });
  g.circle(hw * 1.3, 0, hh * 0.2).fill({ color: GLASS });
}

function sarRadar(g: Graphics, w: number, h: number, open: number) {
  const hw = w * 0.26;
  const hh = Math.min(h * 0.3, hw * 1.4);
  // The radar antenna lies folded in three along the body and opens flat.
  const length = Math.max(hh * 2.2, h * 0.75);
  const x0 = hw + hw * 0.25;
  const x1 = x0 + Math.max(2, hw * 0.3);
  const unfold = stage(open, 0, 2);
  const reach = length / 2 + length * unfold;
  box(g, x0, -reach, x1, reach, HULL);
  box(g, x1 - (x1 - x0) * 0.3, -reach, x1, reach, HULL_DARK);
  for (let k = -3; k <= 3; k++) {
    const y = (reach * k) / 3.5;
    line(g, x0, y, x1, y, 0.8, HULL_SHADE);
  }
  box(g, hw, -hh * 0.15, x0, hh * 0.15, HULL_DARK);
  // Radar pulses towards the Earth once it works. They fade in, they do not flash.
  const on = stage(open, 1, 2);
  if (on > 0) {
    for (let k = 1; k <= 3; k++) {
      const r = hh * (1.5 + k * 1.3);
      g.arc(x1, 0, r, -0.5, 0.5).stroke({ width: 1.4, color: CYAN, alpha: (0.7 - k * 0.15) * on });
    }
  }
  // A short wing on the side that faces away from the Earth.
  wing(g, -hw, 0, -1, 0, hh * 1.1, hh * 1.1, 1, clamp01(open * 1.4));
  foilBody(g, hw, hh);
}

function telecom(g: Graphics, w: number, h: number, open: number) {
  const hw = w * 0.32;
  const hh = Math.min(h * 0.42, hw * 1.5);
  // Two long wings, three panels each, along the north-south line.
  const wings = clamp01(open * 1.25);
  wing(g, 0, -hh, 0, -1, hh * 0.95, hw * 1.2, 3, wings);
  wing(g, 0, hh, 0, 1, hh * 0.95, hw * 1.2, 3, wings);
  foilBody(g, hw, hh);
  // Two dishes swing out and point at the Earth.
  const swing = stage(open, 1, 2);
  const size = hh * 0.55;
  for (const side of [-1, 1]) {
    const y = side * hh * (0.45 + 0.35 * swing);
    const x = hw + size * 0.3 + size * 0.9 * swing;
    line(g, hw, side * hh * 0.4, x, y, Math.max(1, size * 0.15), HULL_DARK);
    dish(g, x, y, size, -side * 0.35 * swing);
  }
}

function observatory(g: Graphics, w: number, h: number, open: number) {
  const hw = w * 0.3;
  const hh = h * 0.44;
  // Two wings, one to each side of the tube.
  const wings = clamp01(open * 1.4);
  wing(g, -hw, hh * 0.3, -1, 0, hw * 1.6, hh * 0.45, 1, wings);
  wing(g, hw, hh * 0.3, 1, 0, hw * 1.6, hh * 0.45, 1, wings);
  cylinder(g, hw, hh);
  box(g, -hw, hh * 0.55, hw, hh * 0.65, HULL_DARK);
  // The aperture at the front, with a lid that swings open.
  box(g, -hw * 0.8, -hh, hw * 0.8, -hh + Math.max(2, hh * 0.06), DARK);
  const lid = stage(open, 1, 2) * 1.9;
  const hingeX = hw;
  const hingeY = -hh;
  const length = hw * 1.9;
  const angle = Math.PI + lid;
  const ex = hingeX + Math.cos(angle) * length;
  const ey = hingeY + Math.sin(angle) * length;
  line(g, hingeX, hingeY, ex, ey, Math.max(2, hh * 0.07), HULL_SHADE);
}

function capsule(g: Graphics, id: PayloadId, w: number, h: number) {
  const scale = id === 'capsule_suborbital' ? 0.8 : 1;
  const hw = w * 0.55 * scale;
  const hh = Math.min(h * 0.45, hw * 1.1);
  const top = id === 'capsule_shielded' ? HULL_SHADE : HULL;
  g.poly([-hw * 0.35, -hh, hw * 0.35, -hh, hw, hh * 0.75, -hw, hh * 0.75]).fill({ color: top });
  box(g, -hw * 0.6, -hh * 0.2, -hw * 0.2, hh * 0.6, HULL_LIGHT, 0.6);
  box(g, -hw, hh * 0.75, hw, hh, HEAT_SHIELD);
  if (id === 'capsule_modern') box(g, -hw * 0.75, hh * 0.2, hw * 0.75, hh * 0.35, DARK);
  g.circle(hw * 0.2, -hh * 0.2, Math.max(1, hw * 0.14)).fill({ color: GLASS });
}

function stationCore(g: Graphics, w: number, h: number, open: number) {
  const hw = w * 0.3;
  const hh = h * 0.42;
  // Four large wings, two on each side: the power plant of the station.
  const wings = clamp01(open * 1.2);
  for (const y of [-hh * 0.55, hh * 0.55]) {
    wing(g, -hw, y, -1, 0, hw * 1.5, hh * 0.6, 2, wings);
    wing(g, hw, y, 1, 0, hw * 1.5, hh * 0.6, 2, wings);
  }
  cylinder(g, hw, hh);
  // Docking ports at both ends.
  box(g, -hw * 0.5, -hh - hh * 0.12, hw * 0.5, -hh, HULL_DARK);
  box(g, -hw * 0.5, hh, hw * 0.5, hh + hh * 0.12, HULL_DARK);
  g.circle(0, 0, hw * 0.35).fill({ color: DARK });
  g.circle(0, 0, hw * 0.22).fill({ color: GLASS });
}

function stationLab(g: Graphics, w: number, h: number, open: number) {
  const hw = w * 0.3;
  const hh = h * 0.44;
  // A white radiator unfolds on the side away from the Earth.
  const radiator = stage(open, 0, 2);
  if (radiator > 0) {
    const reach = hw * 1.8 * radiator;
    box(g, -hw - reach, -hh * 0.5, -hw, hh * 0.1, HULL_LIGHT);
    for (let k = 1; k < 4; k++) {
      const x = -hw - (reach * k) / 4;
      line(g, x, -hh * 0.5, x, hh * 0.1, 0.8, HULL_SHADE);
    }
  }
  // An experiment platform swings out towards the Earth.
  const platform = stage(open, 1, 2);
  if (platform > 0) {
    const x = hw + hw * 0.6 * platform;
    line(g, hw, hh * 0.3, x, hh * 0.3, Math.max(1, hw * 0.12), HULL_DARK);
    box(g, x, hh * 0.1, x + hw * 0.45, hh * 0.5, FOIL);
  }
  cylinder(g, hw, hh);
  for (const y of [-hh * 0.35, hh * 0.05, hh * 0.45]) line(g, -hw, y, hw, y, 1, HULL_DARK, 0.6);
  g.circle(0, -hh * 0.6, hw * 0.25).fill({ color: GLASS });
  box(g, -hw * 0.4, -hh * 0.2, -hw * 0.05, -hh * 0.05, CYAN, 0.85);
  box(g, hw * 0.05, -hh * 0.2, hw * 0.4, -hh * 0.05, RED, 0.85);
}

function stationHabitat(g: Graphics, w: number, h: number, open: number) {
  // An inflatable module: folded thin for launch, it swells once in orbit.
  const swell = stage(open, 0, 2);
  const hw = w * (0.22 + 0.24 * swell);
  const hh = h * 0.4;
  box(g, -w * 0.15, -hh - hh * 0.12, w * 0.15, -hh, HULL_DARK);
  box(g, -w * 0.15, hh, w * 0.15, hh + hh * 0.12, HULL_DARK);
  g.roundRect(-hw, -hh, hw * 2, hh * 2, hw * 0.9).fill({ color: 0xdfe6f0 });
  box(g, hw * 0.45, -hh * 0.75, hw * 0.8, hh * 0.75, HULL_SHADE);
  // Restraint straps of the shell.
  for (const f of [-0.5, 0, 0.5]) line(g, -hw, hh * f, hw, hh * f, 1, HULL_DARK, 0.55);
  // Windows light up once the module is full.
  const lit = stage(open, 1, 2);
  if (lit > 0) {
    for (const f of [-0.25, 0.25]) {
      g.circle(0, hh * f, Math.max(1, hw * 0.16)).fill({ color: HULL_DARK });
      g.circle(0, hh * f, Math.max(0.8, hw * 0.11)).fill({ color: FOIL_LIGHT, alpha: lit });
    }
  }
}

export function drawPayload(g: Graphics, id: PayloadId, w: number, h: number, open: number): void {
  const o = clamp01(open);
  switch (id) {
    case 'cubesat':
      return cubesat(g, w, h, o);
    case 'earth_observation':
      return earthObservation(g, w, h, o);
    case 'sar_radar':
      return sarRadar(g, w, h, o);
    case 'telecom':
      return telecom(g, w, h, o);
    case 'observatory':
      return observatory(g, w, h, o);
    case 'capsule_suborbital':
    case 'capsule_classic':
    case 'capsule_modern':
    case 'capsule_shielded':
      return capsule(g, id, w, h);
    case 'station_core':
      return stationCore(g, w, h, o);
    case 'station_lab':
      return stationLab(g, w, h, o);
    case 'station_habitat':
      return stationHabitat(g, w, h, o);
  }
}

import type { SimulationResult } from '@rocket-odyssey/game-core';
import { Application, Container, Graphics } from 'pixi.js';
import {
  buildCapsuleNose,
  buildStowedPayload,
  getRocketArt,
  type Engine,
  type RocketArt,
  type Shape,
} from '../art/rocketArt.ts';
import { createRandom } from '../lib/random.ts';
import { frameAt, type Playback, type SceneFrame } from './playback.ts';

/**
 * The launch animation. It draws what game-core has already computed: every
 * frame is a function of the playback time, so the animation can be paused,
 * restarted or skipped, and it can never disagree with the result.
 *
 * Nothing here flashes: the only bright event, the breakup of an overloaded
 * rocket, is a single fireball that swells once and fades (WCAG 2.3.1).
 */

/** The scene is drawn in a fixed 960 x 540 space and scaled to the canvas. */
const W = 960;
const H = 540;
const GROUND_Y = 436;
const ROCKET_HEIGHT_PX = 232;
const FLIGHT_CENTRE_Y = 270;

const SPACE = 0x020611;
const SKY_TOP = 0x0c2259;
const SKY_MIDDLE = 0x2b4688;
const SKY_HORIZON = 0xe8894f;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const easeOut = (v: number) => 1 - (1 - clamp01(v)) ** 3;

function mixColor(a: number, b: number, f: number): number {
  const t = clamp01(f);
  const r = Math.round(lerp((a >> 16) & 0xff, (b >> 16) & 0xff, t));
  const g = Math.round(lerp((a >> 8) & 0xff, (b >> 8) & 0xff, t));
  const bl = Math.round(lerp(a & 0xff, b & 0xff, t));
  return (r << 16) | (g << 8) | bl;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  growth: number;
  life: number;
  maxLife: number;
  color: number;
  alpha: number;
  /** Scroll of the camera when the particle was born, for smoke that stays near the ground. */
  bornAtScroll: number | null;
}

interface Debris {
  angle: number;
  speed: number;
  spin: number;
  size: number;
  color: number;
}

type NoseKind = 'fairing' | 'capsule' | 'internal';

export class LaunchScene {
  private app: Application | null = null;
  private host: HTMLElement | null = null;
  private observer: ResizeObserver | null = null;
  private destroyed = false;

  private readonly art: RocketArt;
  private readonly noseKind: NoseKind;
  /** Pixels per metre of rocket. */
  private readonly unit: number;
  /** Height of the whole vehicle, nose included, in metres. */
  private readonly totalHeight: number;
  private readonly payloadBaseY: number;
  private readonly payloadHeight: number;
  private readonly exposedCrew: boolean;

  // Layers, from back to front.
  private readonly root = new Container();
  private readonly sky = new Graphics();
  private readonly stars = new Graphics();
  private readonly earth = new Container();
  private readonly ground = new Container();
  private readonly beacon = new Graphics();
  private readonly smoke = new Graphics();
  private readonly rocket = new Container();
  private readonly effects = new Graphics();
  private readonly haze = new Graphics();

  // Parts of the rocket.
  private readonly flameUpper = new Graphics();
  private readonly upperBack = new Graphics();
  private readonly lowerGroup = new Container();
  private readonly flameLower = new Graphics();
  private readonly lower = new Graphics();
  private readonly upperFront = new Graphics();
  private readonly payload = new Container();
  private readonly payloadPanels = new Graphics();
  private readonly fairingLeft = new Graphics();
  private readonly fairingRight = new Graphics();
  private readonly tower = new Graphics();

  private particles: Particle[] = [];
  private readonly debris: Debris[];
  private readonly random = createRandom(7);
  private lastSeconds = 0;
  private readonly result: SimulationResult;
  private readonly playback: Playback;

  constructor(result: SimulationResult, playback: Playback) {
    this.result = result;
    this.playback = playback;
    const { rocket, payloads } = result.evaluation;
    this.art = getRocketArt(rocket.id);
    const crewOnly = payloads.every((payload) => payload.crew > 0);
    this.noseKind = this.art.fairing === null ? 'internal' : crewOnly ? 'capsule' : 'fairing';
    this.exposedCrew = result.evaluation.radiation.exposedCrew > 0;

    this.payloadBaseY = this.art.noseBaseY;
    if (this.noseKind === 'capsule') {
      const capsule = buildCapsuleNose(this.art.noseBaseDiameter);
      this.payloadHeight = capsule.height * 0.55;
      this.totalHeight = Math.max(this.art.height, this.art.noseBaseY + capsule.height);
    } else if (this.noseKind === 'internal') {
      this.payloadHeight = this.art.noseBaseDiameter * 0.9;
      this.totalHeight = this.art.height;
    } else {
      this.payloadHeight = (this.art.height - this.art.noseBaseY) * 0.82;
      this.totalHeight = this.art.height;
    }
    this.unit = ROCKET_HEIGHT_PX / this.totalHeight;

    const debrisRandom = createRandom(42);
    this.debris = Array.from({ length: 18 }, () => ({
      angle: debrisRandom() * Math.PI * 2,
      speed: 60 + debrisRandom() * 190,
      spin: (debrisRandom() - 0.5) * 9,
      size: 3 + debrisRandom() * 8,
      color: debrisRandom() > 0.5 ? 0xe3e9f3 : debrisRandom() > 0.5 ? 0x7c889e : 0x2c364c,
    }));
  }

  /** Creates the canvas inside `host` and draws the first frame. */
  async mount(host: HTMLElement): Promise<void> {
    const app = new Application();
    await app.init({
      width: Math.max(1, host.clientWidth),
      height: Math.max(1, host.clientHeight),
      antialias: true,
      background: SPACE,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      autoStart: false,
      preference: 'webgl',
    });
    if (this.destroyed) {
      app.destroy({ removeView: true }, { children: true });
      return;
    }
    this.app = app;
    this.host = host;
    app.canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(app.canvas);

    this.build();
    app.stage.addChild(this.root);
    this.layout();
    this.observer = new ResizeObserver(() => {
      this.layout();
      this.draw(this.lastSeconds);
    });
    this.observer.observe(host);
    this.draw(0);
  }

  destroy(): void {
    this.destroyed = true;
    this.observer?.disconnect();
    this.observer = null;
    this.app?.destroy({ removeView: true }, { children: true });
    this.app = null;
  }

  /** Forgets the smoke, for a restart or a jump in time. */
  reset(): void {
    this.particles = [];
    this.lastSeconds = 0;
  }

  /** Draws the frame for a moment of the playback. */
  draw(seconds: number): void {
    const app = this.app;
    if (!app) return;
    const frame = frameAt(this.playback, seconds);
    const dt = Math.min(0.05, Math.max(0, seconds - this.lastSeconds));
    if (seconds < this.lastSeconds) this.particles = [];
    this.lastSeconds = seconds;

    const altitudeKm = frame.telemetry.altitudeKm;
    const scroll = 150 * Math.log(1 + (altitudeKm * 1000) / 60);
    const padCentreY = GROUND_Y - (this.totalHeight * this.unit) / 2;
    const rise = Math.min(scroll * 0.6, padCentreY - FLIGHT_CENTRE_Y);
    const groundOffset = scroll - rise;

    this.drawSky(altitudeKm);
    this.stars.alpha = smooth((altitudeKm - 18) / 50);
    this.drawEarth(frame);
    this.ground.y = groundOffset;
    this.ground.visible = groundOffset < H;
    this.drawBeacon(frame, groundOffset);
    this.poseRocket(frame, padCentreY - rise);
    this.emitParticles(frame, dt, scroll);
    this.drawParticles(dt, scroll);
    this.drawEffects(frame);
    this.drawHaze(frame);

    app.render();
  }

  // --- Construction ----------------------------------------------------------

  private build(): void {
    this.root.addChild(
      this.sky,
      this.stars,
      this.earth,
      this.ground,
      this.beacon,
      this.smoke,
      this.rocket,
      this.effects,
      this.haze,
    );

    // Stars: drawn once, faded in with altitude.
    const starRandom = createRandom(11);
    for (let i = 0; i < 150; i++) {
      const size = starRandom();
      this.stars
        .circle(starRandom() * W, starRandom() * H, size > 0.92 ? 1.6 : size > 0.6 ? 1.1 : 0.7)
        .fill({ color: 0xdcecff, alpha: 0.4 + starRandom() * 0.6 });
    }

    this.buildEarth();
    this.buildGround();
    this.buildRocket();
  }

  /** The Earth seen from space: a disc of radius 1000 that is scaled and rotated each frame. */
  private buildEarth(): void {
    const disc = new Graphics();
    const ring = (radius: number) => {
      const points: number[] = [];
      for (let i = 0; i < 720; i++) {
        const a = (i / 720) * Math.PI * 2;
        points.push(Math.cos(a) * radius, Math.sin(a) * radius);
      }
      return points;
    };
    // Air glow outside the rim, then the ocean, brighter towards the rim.
    disc.poly(ring(1013)).fill({ color: 0x38bdf8, alpha: 0.12 });
    disc.poly(ring(1007)).fill({ color: 0x7dd3fc, alpha: 0.2 });
    disc.poly(ring(1003)).fill({ color: 0x9be5ff, alpha: 0.4 });
    disc.poly(ring(1000)).fill({ color: 0x4aa3f5 });
    disc.poly(ring(994)).fill({ color: 0x2b7fdc });
    disc.poly(ring(978)).fill({ color: 0x1c63c4 });
    disc.poly(ring(930)).fill({ color: 0x154ea3 });
    disc.poly(ring(820)).fill({ color: 0x0f3d86 });

    // Land and clouds, scattered so that turning the disc shows motion.
    const blobRandom = createRandom(5);
    const blobs: Graphics[] = [];
    for (let i = 0; i < 46; i++) {
      const angle = blobRandom() * Math.PI * 2;
      const distance = 300 + blobRandom() * 660;
      const cloud = blobRandom() > 0.55;
      const rx = 18 + blobRandom() * (cloud ? 70 : 54);
      const ry = 8 + blobRandom() * (cloud ? 16 : 30);
      const blob = new Graphics()
        .ellipse(0, 0, rx, ry)
        .fill({ color: cloud ? 0xffffff : 0x3aa876, alpha: cloud ? 0.5 : 0.85 });
      blob.position.set(Math.cos(angle) * distance, Math.sin(angle) * distance);
      // Laid along the rim, as land looks near the horizon.
      blob.rotation = angle + Math.PI / 2;
      blobs.push(blob);
    }
    this.earth.addChild(disc, ...blobs);
    this.earth.visible = false;
  }

  private buildGround(): void {
    const g = new Graphics();
    const cx = W / 2;
    const halfRocket = this.art.halfWidth * this.unit;

    // Glow of the horizon and distant hills.
    g.rect(0, GROUND_Y - 46, W, 46).fill({ color: SKY_HORIZON, alpha: 0.16 });
    g.poly([
      0,
      GROUND_Y,
      0,
      GROUND_Y - 30,
      140,
      GROUND_Y - 52,
      270,
      GROUND_Y - 22,
      380,
      GROUND_Y - 36,
      470,
      GROUND_Y,
    ]).fill({ color: 0x0b1838 });
    g.poly([
      560,
      GROUND_Y,
      660,
      GROUND_Y - 30,
      770,
      GROUND_Y - 16,
      880,
      GROUND_Y - 44,
      W,
      GROUND_Y - 26,
      W,
      GROUND_Y,
    ]).fill({ color: 0x0b1838 });
    // Ground, far below the screen so it covers everything as the camera rises.
    g.rect(0, GROUND_Y, W, H * 3).fill({ color: 0x050b1c });
    g.rect(0, GROUND_Y, W, 3).fill({ color: 0x2a6da3, alpha: 0.7 });

    // Pad with its flame trench.
    const padHalf = Math.max(70, halfRocket + 46);
    g.rect(cx - padHalf, GROUND_Y - 8, padHalf * 2, 12).fill({ color: 0x3b475f });
    g.rect(cx - padHalf, GROUND_Y - 8, padHalf * 2, 3).fill({ color: 0x8794ab });
    g.rect(cx - halfRocket - 8, GROUND_Y + 4, halfRocket * 2 + 16, 14).fill({ color: 0x0b1326 });

    // Service tower, a little taller than the rocket.
    const towerX = cx - halfRocket - 44;
    const towerTop = GROUND_Y - ROCKET_HEIGHT_PX * 1.08;
    g.rect(towerX - 9, towerTop, 18, GROUND_Y - towerTop - 8).fill({ color: 0x24324f });
    for (let y = towerTop + 6; y < GROUND_Y - 20; y += 22) {
      g.moveTo(towerX - 9, y)
        .lineTo(towerX + 9, y + 22)
        .stroke({ width: 1.6, color: 0x55688f });
      g.moveTo(towerX + 9, y)
        .lineTo(towerX - 9, y + 22)
        .stroke({ width: 1.6, color: 0x55688f });
      g.moveTo(towerX - 9, y)
        .lineTo(towerX + 9, y)
        .stroke({ width: 1.6, color: 0x55688f });
    }
    // Arms that reach the rocket.
    for (const fraction of [0.3, 0.62, 0.9]) {
      const y = GROUND_Y - ROCKET_HEIGHT_PX * fraction;
      g.rect(towerX + 9, y, 34, 4).fill({ color: 0x3b4e77 });
    }
    g.rect(towerX - 1.5, towerTop - 26, 3, 26).fill({ color: 0x55688f });
    // Floodlights.
    g.poly([
      cx + padHalf + 60,
      GROUND_Y,
      cx + padHalf + 54,
      GROUND_Y - 70,
      cx + padHalf + 66,
      GROUND_Y - 70,
    ]).fill({ color: 0x24324f });
    g.poly([
      cx + padHalf + 60,
      GROUND_Y - 72,
      cx - 10,
      GROUND_Y - ROCKET_HEIGHT_PX,
      cx + 40,
      GROUND_Y - ROCKET_HEIGHT_PX * 0.2,
    ]).fill({ color: 0xcfe6ff, alpha: 0.035 });
    g.circle(cx + padHalf + 60, GROUND_Y - 72, 4).fill({ color: 0xfff3b0 });
    this.ground.addChild(g);
  }

  private buildRocket(): void {
    const art = this.art;
    this.drawShapes(this.upperBack, art.upperBack, 0);
    this.drawShapes(this.lower, art.lower, 0);
    this.drawShapes(this.upperFront, art.upperFront, 0);
    this.lowerGroup.addChild(this.flameLower, this.lower);

    // What rides on top: a capsule, a satellite under the fairing, or cargo inside.
    const body = new Graphics();
    if (this.noseKind === 'capsule') {
      const capsule = buildCapsuleNose(art.noseBaseDiameter);
      this.drawShapes(body, capsule.capsule, 0);
      this.drawShapes(this.tower, capsule.tower, -this.payloadBaseY);
    } else {
      const diameter =
        this.noseKind === 'internal' ? art.noseBaseDiameter * 0.5 : art.noseBaseDiameter;
      this.drawShapes(body, buildStowedPayload(diameter, this.payloadHeight), 0);
    }
    this.payload.addChild(this.payloadPanels, body);
    this.payload.y = -this.payloadBaseY * this.unit;
    this.payload.visible = this.noseKind !== 'internal';

    if (art.fairing) {
      this.drawShapes(this.fairingLeft, art.fairing.left, 0);
      this.drawShapes(this.fairingRight, art.fairing.right, 0);
    }
    const hasFairing = this.noseKind === 'fairing';
    this.fairingLeft.visible = hasFairing;
    this.fairingRight.visible = hasFairing;
    this.tower.visible = this.noseKind === 'capsule';

    this.rocket.addChild(
      this.flameUpper,
      this.upperBack,
      this.lowerGroup,
      this.upperFront,
      this.payload,
      this.fairingLeft,
      this.fairingRight,
      this.tower,
    );
  }

  /** Draws rocket shapes. The drawing has y pointing up; the screen has y pointing down. */
  private drawShapes(g: Graphics, shapes: Shape[], offsetY: number): void {
    const u = this.unit;
    for (const shape of shapes) {
      const alpha = shape.opacity ?? 1;
      if (shape.kind === 'ellipse') {
        g.ellipse(shape.cx * u, -(shape.cy - offsetY) * u, shape.rx * u, shape.ry * u).fill({
          color: shape.fill,
          alpha,
        });
      } else {
        const points = shape.pts.map((value, i) =>
          i % 2 === 0 ? value * u : -(value - offsetY) * u,
        );
        g.poly(points).fill({ color: shape.fill, alpha });
      }
    }
  }

  private layout(): void {
    const app = this.app;
    const host = this.host;
    if (!app || !host) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    app.renderer.resize(width, height);
    // Cover the canvas and keep the centre, where the rocket is, in view.
    const scale = Math.max(width / W, height / H);
    this.root.scale.set(scale);
    this.root.position.set((width - W * scale) / 2, (height - H * scale) / 2);
  }

  // --- Per frame --------------------------------------------------------------

  private drawSky(altitudeKm: number): void {
    const toSpace = smooth(altitudeKm / 75);
    const BANDS = 18;
    this.sky.clear();
    for (let i = 0; i < BANDS; i++) {
      const f = i / (BANDS - 1);
      const dusk =
        f < 0.62
          ? mixColor(SKY_TOP, SKY_MIDDLE, f / 0.62)
          : mixColor(SKY_MIDDLE, SKY_HORIZON, ((f - 0.62) / 0.38) ** 1.6);
      this.sky
        .rect(0, (H * i) / BANDS, W, H / BANDS + 1)
        .fill({ color: mixColor(dusk, SPACE, toSpace) });
    }
  }

  private drawEarth(frame: SceneFrame): void {
    const altitudeKm = frame.telemetry.altitudeKm;
    if (altitudeKm < 30) {
      this.earth.visible = false;
      return;
    }
    this.earth.visible = true;
    // Apparent size: the disc fills the view from a low orbit and shrinks to a ball far away.
    const angular = Math.asin(6371 / (6371 + Math.max(200, altitudeKm)));
    const radius = Math.min(2400, 600 * Math.tan(angular));
    const far = clamp01((1700 - radius) / 1600);
    const settledTop = lerp(H * 0.84, H * 0.58, far);
    const top = lerp(H + 70, settledTop, smooth((altitudeKm - 30) / 150));
    this.earth.scale.set(radius / 1000);
    this.earth.position.set(W / 2, top + radius);
    // The ground slides by underneath: faster the closer the camera is.
    this.earth.rotation = (-(frame.telemetry.downrangeDeg * Math.PI) / 180) * lerp(0.5, 1, far);
    this.earth.alpha = smooth((altitudeKm - 30) / 40);
  }

  /** A steady amber light on the tower after a hold. It does not blink. */
  private drawBeacon(frame: SceneFrame, groundOffset: number): void {
    this.beacon.clear();
    const hold = frame.since.hold;
    if (hold === undefined) return;
    const x = W / 2 - this.art.halfWidth * this.unit - 44;
    const y = GROUND_Y - ROCKET_HEIGHT_PX * 1.08 - 30 + groundOffset;
    const glow = smooth(hold / 0.8);
    this.beacon.circle(x, y, 26).fill({ color: 0xfbbf24, alpha: 0.16 * glow });
    this.beacon.circle(x, y, 12).fill({ color: 0xfbbf24, alpha: 0.35 * glow });
    this.beacon.circle(x, y, 5).fill({ color: 0xffe9a8, alpha: glow });
  }

  private poseRocket(frame: SceneFrame, centreY: number): void {
    const { since, phase } = frame;
    const u = this.unit;
    const art = this.art;

    // Lost vehicles are no longer drawn; the effects layer shows what is left.
    const broken = since.structural_failure !== undefined || since.breakup !== undefined;
    this.rocket.visible = !broken;
    if (broken) return;

    // Where the camera looks along the rocket, and how close.
    const separated = since.stage_separation;
    const deployed = since.payload_deployed;
    const upperCentre = (art.separationY + this.totalHeight) / 2;
    const upperHeight = this.totalHeight - art.separationY;
    let focus = this.totalHeight / 2;
    let zoom = 1;
    if (separated !== undefined) {
      const f = smooth(separated / 1.6);
      focus = lerp(focus, upperCentre, f);
      zoom = lerp(1, Math.min(2.4, Math.max(1, (ROCKET_HEIGHT_PX * 0.6) / (upperHeight * u))), f);
    }
    // A payload under a fairing leaves ahead of the stage; one carried inside
    // leaves sideways, out of the cargo bay.
    const internal = this.noseKind === 'internal';
    const payloadShift = deployed === undefined ? 0 : 26 * deployed + 9 * deployed * deployed;
    let focusSide = 0;
    if (deployed !== undefined) {
      const f = smooth(deployed / 1.5);
      const along = internal ? 0 : payloadShift / u;
      focus = lerp(focus, this.payloadBaseY + this.payloadHeight / 2 + along, f);
      focusSide = internal ? -payloadShift * f : 0;
      zoom = lerp(zoom, Math.min(3.4, Math.max(zoom, 86 / (this.payloadHeight * u))), f);
    }

    // Tilt: straight up at liftoff, level with the horizon at orbital speed.
    const ascentProgress = Math.sqrt(clamp01(frame.telemetry.downrangeDeg / 18));
    let tilt = (Math.PI / 2) * smooth(ascentProgress) ** 0.9;
    if (phase === 'countdown' || phase === 'scrub') tilt = 0;
    else if (phase === 'ballistic') tilt = lerp(tilt, 1.85, smooth(frame.phaseProgress));
    else if (phase === 'reentry') tilt = 1.85 + frame.phaseProgress * 3.2;
    else if (phase !== 'stage1_burn' && phase !== 'staging' && phase !== 'insertion_burn') {
      tilt = Math.PI / 2;
    }

    // An overloaded rocket shakes on its way to Max-Q.
    const struggling =
      this.result.failure === 'payload_overweight' && since.liftoff !== undefined
        ? smooth((since.liftoff - 1) / 3)
        : 0;
    const shake = struggling * Math.sin(frame.seconds * 46) * 1.8;

    this.rocket.pivot.set(focusSide, -focus * u);
    this.rocket.scale.set(zoom);
    this.rocket.rotation = tilt;
    this.rocket.position.set(
      W / 2 + shake,
      centreY +
        (FLIGHT_CENTRE_Y - centreY) * (separated === undefined ? 0 : smooth(separated / 1.6)),
    );

    // The spent lower part falls away.
    if (separated === undefined) {
      this.lowerGroup.visible = true;
      this.lowerGroup.position.set(0, 0);
      this.lowerGroup.rotation = 0;
      this.lowerGroup.alpha = 1;
    } else {
      this.lowerGroup.visible = separated < 3.2;
      this.lowerGroup.position.set(10 * separated, 46 * separated + 60 * separated * separated);
      this.lowerGroup.rotation = 0.22 * separated;
      this.lowerGroup.alpha = 1 - clamp01((separated - 1.2) / 2);
    }

    // Fairing halves peel away; the escape tower shoots ahead.
    const nose = since.fairing_separation;
    if (this.noseKind === 'fairing') {
      const open = nose ?? 0;
      const gone = open >= 2.2;
      this.fairingLeft.visible = !gone;
      this.fairingRight.visible = !gone;
      const dx = 26 * open + 110 * open * open;
      const dy = 50 * open * open;
      const pivotY = -art.noseBaseY * u;
      for (const [half, side] of [
        [this.fairingLeft, -1],
        [this.fairingRight, 1],
      ] as const) {
        half.pivot.set(0, pivotY);
        half.position.set(side * dx, pivotY + dy);
        half.rotation = side * 0.7 * open;
        half.alpha = 1 - clamp01((open - 0.9) / 1.3);
      }
    } else if (this.noseKind === 'capsule') {
      const fired = nose ?? 0;
      this.tower.visible = fired < 1.6;
      this.tower.position.set(14 * fired, -(150 * fired + 260 * fired * fired));
      this.tower.alpha = 1 - clamp01((fired - 0.5) / 1);
    }

    // The payload flies free and opens its solar panels.
    this.payload.visible = !internal || deployed !== undefined;
    this.payload.alpha = internal ? smooth((deployed ?? 0) / 0.6) : 1;
    this.payload.position.set(
      internal ? -payloadShift : 0,
      -this.payloadBaseY * u - (internal ? 0 : payloadShift),
    );
    this.payloadPanels.clear();
    if (deployed !== undefined && this.noseKind !== 'capsule') {
      const open = smooth((deployed - 0.5) / 1.8);
      const reach = this.payloadHeight * u * 1.5 * open;
      const panelY = -this.payloadHeight * u * 0.62;
      const panelHeight = this.payloadHeight * u * 0.3;
      const bodyHalf = (internal ? art.noseBaseDiameter * 0.5 : art.noseBaseDiameter) * 0.31 * u;
      if (reach > 1) {
        for (const side of [-1, 1]) {
          const x0 = side * bodyHalf;
          this.payloadPanels
            .poly([
              x0,
              panelY,
              x0 + side * reach,
              panelY,
              x0 + side * reach,
              panelY + panelHeight,
              x0,
              panelY + panelHeight,
            ])
            .fill({ color: 0x1e4fa8 });
          this.payloadPanels
            .moveTo(x0 + side * reach * 0.5, panelY)
            .lineTo(x0 + side * reach * 0.5, panelY + panelHeight)
            .stroke({ width: 1, color: 0x6fb1ff, alpha: 0.8 });
        }
      }
    }
    // After the release the stage is left behind.
    const stageAlpha = deployed === undefined ? 1 : 1 - 0.55 * smooth(deployed / 2.5);
    this.upperBack.alpha = stageAlpha;
    this.upperFront.alpha = stageAlpha;

    this.drawFlames(frame);
  }

  private drawFlames(frame: SceneFrame): void {
    const { since, telemetry } = frame;
    const vacuum = smooth((telemetry.altitudeKm - 20) / 60);
    this.flameLower.clear();
    this.flameUpper.clear();

    // Before liftoff the engines build up thrust for three seconds.
    let lowerPower = 0;
    if (since.liftoff === undefined) {
      if (since.ignition !== undefined && since.scrub === undefined && since.hold === undefined) {
        lowerPower = 0.2 + 0.55 * smooth(since.ignition / 1.2);
      }
    } else if (telemetry.burning === 1) {
      lowerPower = 1;
    }
    if (since.stage_separation !== undefined) lowerPower = 0;
    if (lowerPower > 0) {
      for (const engine of this.art.enginesLower) {
        this.drawPlume(this.flameLower, engine, lowerPower, vacuum, frame.seconds);
      }
    }

    let upperPower = telemetry.burning === 2 ? 1 : 0;
    if (this.art.upperBurnsFromLiftoff && lowerPower > 0) upperPower = lowerPower;
    if (upperPower > 0) {
      for (const engine of this.art.enginesUpper) {
        this.drawPlume(this.flameUpper, engine, upperPower, vacuum, frame.seconds);
      }
    }
  }

  /** An exhaust plume: long and bright in the air, wide and pale in vacuum. */
  private drawPlume(
    g: Graphics,
    engine: Engine,
    power: number,
    vacuum: number,
    time: number,
  ): void {
    const u = this.unit;
    const x = engine.x * u;
    const y = -engine.y * u;
    const flicker = 0.93 + 0.07 * Math.sin(time * 38 + engine.x * 3);
    const width = Math.max(3, engine.w * u) * (1 + vacuum * 1.5);
    const length =
      Math.max(26, ROCKET_HEIGHT_PX * 0.3 + engine.w * u * 3) *
      power *
      flicker *
      (1 - vacuum * 0.25);
    const outer = mixColor(0xff8a2a, 0x9cc9ff, vacuum);
    const middle = mixColor(0xffd166, 0xd6ecff, vacuum);
    /** A rounded plume outline: `swell` widens the middle, `reach` is its length. */
    const outline = (halfWidth: number, swell: number, reach: number) => {
      const STEPS = 10;
      const left: number[] = [];
      const right: number[] = [];
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        const half = halfWidth * (1 + swell * Math.sin(Math.PI * t ** 0.7)) * Math.sqrt(1 - t * t);
        right.push(x + half, y + reach * t);
        left.unshift(x - half, y + reach * t);
      }
      return [...right, ...left];
    };
    g.poly(outline(width / 2, 0.5 + vacuum * 1.3, length)).fill({
      color: outer,
      alpha: 0.5 - vacuum * 0.26,
    });
    g.poly(outline(width * 0.34, 0.25 + vacuum * 0.5, length * 0.66)).fill({
      color: middle,
      alpha: 0.85 - vacuum * 0.3,
    });
    g.poly(outline(width * 0.18, 0, length * 0.34)).fill({ color: 0xffffff, alpha: 0.95 });
  }

  private emitParticles(frame: SceneFrame, dt: number, scroll: number): void {
    if (dt <= 0 || !this.rocket.visible) return;
    const { since, telemetry } = frame;
    const random = this.random;
    const cx = W / 2;
    const spawn = (count: number, make: () => Particle) => {
      // A fractional count becomes a chance, so slow emitters still emit.
      const whole = Math.floor(count) + (random() < count % 1 ? 1 : 0);
      for (let i = 0; i < whole && this.particles.length < 260; i++) this.particles.push(make());
    };

    // Cold vapour venting from the tanks while the rocket waits.
    if (since.liftoff === undefined && since.scrub === undefined) {
      spawn(dt * 7, () => ({
        x: cx + (random() > 0.5 ? 1 : -1) * this.art.halfWidth * this.unit * 0.5,
        y: GROUND_Y - ROCKET_HEIGHT_PX * (0.25 + random() * 0.5),
        vx: 14 + random() * 22,
        vy: -4 - random() * 8,
        r: 3 + random() * 3,
        growth: 7,
        life: 0,
        maxLife: 1.6 + random(),
        color: 0xdcecff,
        alpha: 0.2,
        bornAtScroll: 0,
      }));
    }

    // Smoke rolling out of the flame trench at ignition and liftoff.
    const firing = since.ignition !== undefined && since.scrub === undefined;
    if (firing && telemetry.altitudeKm < 0.25) {
      const strength = since.liftoff === undefined ? 0.6 : 1;
      spawn(dt * 60 * strength, () => {
        const side = random() > 0.5 ? 1 : -1;
        return {
          x: cx + side * random() * 26,
          y: GROUND_Y - 4 + random() * 6,
          vx: side * (50 + random() * 150),
          vy: -8 - random() * 34,
          r: 6 + random() * 8,
          growth: 15 + random() * 13,
          life: 0,
          maxLife: 1.8 + random() * 1.6,
          color: mixColor(0xe8894f, 0xcfd8e6, random()),
          alpha: 0.34,
          bornAtScroll: scroll,
        };
      });
    }

    // A trail in the air while the first stage burns.
    if (telemetry.burning === 1 && telemetry.altitudeKm >= 0.05 && telemetry.altitudeKm < 45) {
      const tilt = this.rocket.rotation;
      const tailDistance = (this.totalHeight * this.unit) / 2 + ROCKET_HEIGHT_PX * 0.22;
      spawn(dt * 34, () => ({
        x: this.rocket.x - Math.sin(tilt) * tailDistance + (random() - 0.5) * 10,
        y: this.rocket.y + Math.cos(tilt) * tailDistance + (random() - 0.5) * 10,
        vx: -Math.sin(tilt) * (190 + random() * 80),
        vy: Math.cos(tilt) * (190 + random() * 80),
        r: 5 + random() * 5,
        growth: 22,
        life: 0,
        maxLife: 0.9 + random() * 0.6,
        color: 0xcfd8e6,
        alpha: 0.26 * (1 - telemetry.altitudeKm / 45),
        bornAtScroll: null,
      }));
    }
  }

  private drawParticles(dt: number, scroll: number): void {
    this.smoke.clear();
    const alive: Particle[] = [];
    for (const p of this.particles) {
      p.life += dt;
      if (p.life >= p.maxLife) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.4 * dt;
      p.r += p.growth * dt;
      const age = p.life / p.maxLife;
      // Smoke near the ground stays there while the camera climbs away.
      const y = p.bornAtScroll === null ? p.y : p.y + (scroll - p.bornAtScroll) * 0.4;
      if (y < H + 80) {
        this.smoke.circle(p.x, y, p.r).fill({ color: p.color, alpha: p.alpha * (1 - age) });
      }
      alive.push(p);
    }
    this.particles = alive;
  }

  private drawEffects(frame: SceneFrame): void {
    const g = this.effects;
    g.clear();
    const { since } = frame;
    const cx = this.rocket.x;
    const cy = this.rocket.y;

    // Breakup of an overloaded rocket: one fireball that swells and fades.
    const failed = since.structural_failure;
    if (failed !== undefined) {
      const smokeAlpha = 0.5 * (1 - clamp01(failed / 4.6));
      g.circle(cx, cy + failed * 16, 60 + 150 * easeOut(failed / 3)).fill({
        color: 0x3b4254,
        alpha: smokeAlpha,
      });
      const fire = 1 - clamp01(failed / 1.9);
      if (fire > 0) {
        g.circle(cx, cy, 30 + 150 * easeOut(failed / 0.9)).fill({
          color: 0xff8a2a,
          alpha: 0.75 * fire,
        });
        g.circle(cx, cy, 20 + 96 * easeOut(failed / 0.7)).fill({
          color: 0xffd166,
          alpha: 0.85 * fire,
        });
        g.circle(cx, cy, 10 + 50 * easeOut(failed / 0.5)).fill({
          color: 0xffffff,
          alpha: fire * fire,
        });
      }
      const fade = 1 - clamp01((failed - 2.2) / 2.2);
      for (const piece of this.debris) {
        const x = cx + Math.cos(piece.angle) * piece.speed * failed;
        const y = cy + Math.sin(piece.angle) * piece.speed * failed + 46 * failed * failed;
        const spin = piece.spin * failed;
        const s = piece.size;
        g.poly([
          x + Math.cos(spin) * s,
          y + Math.sin(spin) * s,
          x + Math.cos(spin + 2.2) * s * 0.7,
          y + Math.sin(spin + 2.2) * s * 0.7,
          x + Math.cos(spin + 4.1) * s,
          y + Math.sin(spin + 4.1) * s,
        ]).fill({ color: piece.color, alpha: fade });
      }
    }

    // Re-entry: the air glows in front of the falling vehicle.
    if (frame.phase === 'reentry') {
      const heat = smooth(frame.phaseProgress / 0.25);
      const broke = since.breakup;
      if (broke === undefined) {
        const tilt = this.rocket.rotation;
        const length = (this.totalHeight - this.art.separationY) * this.unit * this.rocket.scale.x;
        const noseX = cx + Math.sin(tilt) * length * 0.5;
        const noseY = cy - Math.cos(tilt) * length * 0.5;
        g.circle(noseX, noseY, 46).fill({ color: 0xff7a3c, alpha: 0.18 * heat });
        g.circle(noseX, noseY, 28).fill({ color: 0xffb36b, alpha: 0.3 * heat });
        g.circle(noseX, noseY, 13).fill({ color: 0xfff1cf, alpha: 0.55 * heat });
        g.circle(cx, cy, length * 0.75).fill({ color: 0xff7a3c, alpha: 0.1 * heat });
      } else {
        // Glowing fragments drift apart and fade.
        const fade = 1 - clamp01(broke / 3.4);
        for (let i = 0; i < 6; i++) {
          const piece = this.debris[i]!;
          const x = cx + Math.cos(piece.angle) * 26 * broke + 46 * broke;
          const y = cy + Math.sin(piece.angle) * 20 * broke + 38 * broke;
          g.poly([
            x,
            y,
            x - 60 - piece.size * 3,
            y - 46 - piece.size * 2,
            x - 52 - piece.size * 3,
            y - 54 - piece.size * 2,
          ]).fill({ color: 0xffb36b, alpha: 0.3 * fade });
          g.circle(x, y, 9 + piece.size * 0.5).fill({ color: 0xff7a3c, alpha: 0.35 * fade });
          g.circle(x, y, 3 + piece.size * 0.3).fill({ color: 0xfff1cf, alpha: fade });
        }
      }
    }
  }

  /** The radiation belts: a violet haze, stronger while the crew is exposed. */
  private drawHaze(frame: SceneFrame): void {
    const g = this.haze;
    g.clear();
    const altitudeKm = frame.telemetry.altitudeKm;
    const inner = smooth((altitudeKm - 700) / 1500) * (1 - smooth((altitudeKm - 6000) / 3000));
    const outer = smooth((altitudeKm - 11000) / 4000) * 0.75;
    const strength = Math.max(inner, outer) * (this.exposedCrew ? 1 : 0.55);
    if (strength > 0.01) {
      g.rect(0, 0, W, H).fill({ color: 0xa855f7, alpha: 0.13 * strength });
      // Drifting specks. Their positions depend only on time, so a pause freezes them.
      for (let i = 0; i < 46; i++) {
        const lane = (i * 97.3) % H;
        const speed = 60 + ((i * 37) % 90);
        const x = W - ((frame.seconds * speed + i * 211) % (W + 40));
        g.rect(x, lane, 9 + (i % 5) * 3, 1.6).fill({ color: 0xe9d5ff, alpha: 0.5 * strength });
      }
    }
    const alert = frame.since.radiation_alert;
    if (alert !== undefined) {
      g.rect(0, 0, W, H).fill({ color: 0xff3b5c, alpha: 0.16 * smooth(alert / 1.2) });
    }
  }
}

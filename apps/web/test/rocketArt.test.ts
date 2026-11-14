import { ROCKETS } from '@rocket-odyssey/game-core';
import { describe, expect, it } from 'vitest';
import {
  buildCapsuleNose,
  buildStowedPayload,
  getRocketArt,
  type Shape,
} from '../src/art/rocketArt.ts';

function bounds(shapes: Shape[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const shape of shapes) {
    if (shape.kind === 'ellipse') {
      minX = Math.min(minX, shape.cx - shape.rx);
      maxX = Math.max(maxX, shape.cx + shape.rx);
      minY = Math.min(minY, shape.cy - shape.ry);
      maxY = Math.max(maxY, shape.cy + shape.ry);
    } else {
      for (let i = 0; i < shape.pts.length; i += 2) {
        minX = Math.min(minX, shape.pts[i]!);
        maxX = Math.max(maxX, shape.pts[i]!);
        minY = Math.min(minY, shape.pts[i + 1]!);
        maxY = Math.max(maxY, shape.pts[i + 1]!);
      }
    }
  }
  return { minX, maxX, minY, maxY };
}

describe('rocket drawings', () => {
  it.each(ROCKETS)('draws $shortName inside its own box', (rocket) => {
    const art = getRocketArt(rocket.id);
    const all = [
      ...art.lower,
      ...art.upperBack,
      ...art.upperFront,
      ...(art.fairing?.left ?? []),
      ...(art.fairing?.right ?? []),
    ];
    expect(all.length).toBeGreaterThan(5);
    for (const shape of all) {
      const values = shape.kind === 'poly' ? shape.pts : [shape.cx, shape.cy, shape.rx, shape.ry];
      expect(values.every(Number.isFinite)).toBe(true);
      if (shape.kind === 'poly') expect(shape.pts.length % 2).toBe(0);
    }
    const box = bounds(all);
    expect(box.minY).toBeGreaterThanOrEqual(-0.01);
    expect(box.maxY).toBeLessThanOrEqual(art.height + 0.01);
    expect(box.minX).toBeGreaterThanOrEqual(-art.halfWidth - 0.01);
    expect(box.maxX).toBeLessThanOrEqual(art.halfWidth + 0.01);
    // The drawing is symmetric enough to be centred.
    expect(box.minX).toBeCloseTo(-box.maxX, 0);
  });

  it.each(ROCKETS)('gives $shortName engines and a staging plane', (rocket) => {
    const art = getRocketArt(rocket.id);
    expect(art.enginesLower.length).toBeGreaterThan(0);
    expect(art.enginesUpper.length).toBeGreaterThan(0);
    expect(art.separationY).toBeGreaterThan(0);
    expect(art.separationY).toBeLessThan(art.height);
    expect(art.noseBaseY).toBeGreaterThan(art.separationY);
    // A vehicle with a fairing has one in the catalog too, and the other way round.
    expect(art.fairing !== null).toBe(rocket.payloadBay === 'fairing');
  });

  it('builds a capsule and a stowed payload that sit on their base', () => {
    const capsule = buildCapsuleNose(3.7);
    expect(bounds([...capsule.capsule, ...capsule.tower]).minY).toBeCloseTo(0, 6);
    expect(bounds(capsule.tower).maxY).toBeCloseTo(capsule.height, 6);

    const payload = buildStowedPayload(5.2, 10);
    expect(bounds(payload).minY).toBeCloseTo(0, 6);
    expect(bounds(payload).maxY).toBeLessThanOrEqual(10);
  });
});

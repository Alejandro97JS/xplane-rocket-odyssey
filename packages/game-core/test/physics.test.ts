import { describe, expect, it } from 'vitest';
import {
  circularSpeedMs,
  computeDeltaV,
  ellipticalAltitudeKm,
  ellipticalAngleDeg,
  ellipticalSpeedMs,
  G0,
  getOrbit,
  getRocket,
  halfPeriodS,
  ROCKETS,
} from '../src/index.ts';

describe('computeDeltaV', () => {
  it('applies the rocket equation to each stage', () => {
    const rocket = getRocket('falcon9');
    const [stage1, stage2] = rocket.stages;
    const payload = 1_800;
    const liftoff = payload + rocket.dryMassKg + rocket.propellantMassKg;
    const afterStage1Burn = liftoff - stage1.propellantMassKg;
    const stage2Start = afterStage1Burn - stage1.dryMassKg;
    const stage2End = stage2Start - stage2.propellantMassKg;

    const budget = computeDeltaV(rocket, payload);

    expect(budget.liftoffMassKg).toBe(liftoff);
    expect(budget.stages[0].deltaVMs).toBeCloseTo(
      stage1.ispS * G0 * Math.log(liftoff / afterStage1Burn),
      6,
    );
    expect(budget.stages[1].deltaVMs).toBeCloseTo(
      stage2.ispS * G0 * Math.log(stage2Start / stage2End),
      6,
    );
    expect(budget.totalMs).toBeCloseTo(budget.stages[0].deltaVMs + budget.stages[1].deltaVMs, 6);
    // The second stage ends with only its own structure and the payload.
    expect(stage2End).toBe(payload + stage2.dryMassKg);
  });

  it('gives less delta-v for a heavier payload', () => {
    const rocket = getRocket('soyuz');
    const light = computeDeltaV(rocket, 450).totalMs;
    const heavy = computeDeltaV(rocket, 7_200).totalMs;
    expect(heavy).toBeLessThan(light);
  });

  it.each(ROCKETS)('lets $name reach low orbit with its maximum payload', (rocket) => {
    const budget = computeDeltaV(rocket, rocket.maxLeoPayloadKg);
    expect(budget.totalMs).toBeGreaterThanOrEqual(getOrbit('leo').requiredDeltaVMs);
  });

  it('shows why one equation for the whole launcher is not enough', () => {
    // The use case writes the equation once for the whole launcher. With the
    // numbers of its own table that keeps even an empty Electron, Soyuz or
    // Falcon 9 below the 9,300 m/s of low orbit, so no level could be won.
    for (const id of ['electron', 'soyuz', 'falcon9'] as const) {
      const rocket = getRocket(id);
      const singleStage =
        rocket.ispS *
        G0 *
        Math.log((rocket.dryMassKg + rocket.propellantMassKg) / rocket.dryMassKg);
      expect(singleStage).toBeLessThan(getOrbit('leo').requiredDeltaVMs);
    }
  });
});

describe('orbital mechanics helpers', () => {
  it('computes circular speeds', () => {
    expect(circularSpeedMs(400)).toBeCloseTo(7_673, -1);
    expect(circularSpeedMs(35_786)).toBeCloseTo(3_075, -1);
  });

  it('computes speeds on a transfer orbit', () => {
    // Geostationary transfer orbit from a 200 km parking orbit.
    expect(ellipticalSpeedMs(200, 200, 35_786)).toBeCloseTo(10_240, -2);
    expect(ellipticalSpeedMs(35_786, 200, 35_786)).toBeCloseTo(1_600, -2);
    // A circular orbit is the special case with equal extremes.
    expect(ellipticalSpeedMs(400, 400, 400)).toBeCloseTo(circularSpeedMs(400), 6);
  });

  it('follows the orbit equation from perigee to apogee', () => {
    // Geostationary transfer orbit from a 200 km parking orbit.
    expect(ellipticalAltitudeKm(0, 200, 35_786)).toBeCloseTo(200, 6);
    expect(ellipticalAltitudeKm(180, 200, 35_786)).toBeCloseTo(35_786, 6);
    // A quarter of a lap after the perigee: 2 · 6,571 · 42,157 / 48,728 km from the centre.
    expect(ellipticalAltitudeKm(90, 200, 35_786)).toBeCloseTo(4_999, 0);
    // The path is level at both ends: one degree changes the altitude by
    // less than a thousandth of the climb.
    expect(ellipticalAltitudeKm(1, 200, 35_786) - 200).toBeLessThan(35.586);
    expect(35_786 - ellipticalAltitudeKm(179, 200, 35_786)).toBeLessThan(35.586);
    // A circular orbit is the special case with equal extremes.
    expect(ellipticalAltitudeKm(77, 400, 400)).toBeCloseTo(400, 6);
  });

  it('finds the angle at which a climb reaches an altitude', () => {
    expect(ellipticalAngleDeg(200, 200, 35_786)).toBeCloseTo(0, 6);
    expect(ellipticalAngleDeg(35_786, 200, 35_786)).toBeCloseTo(180, 6);
    for (const angle of [10, 73, 90, 150]) {
      const altitude = ellipticalAltitudeKm(angle, 200, 35_786);
      expect(ellipticalAngleDeg(altitude, 200, 35_786)).toBeCloseTo(angle, 6);
    }
    // Altitudes outside the orbit give its nearest end.
    expect(ellipticalAngleDeg(100, 200, 35_786)).toBe(0);
    expect(ellipticalAngleDeg(50_000, 200, 35_786)).toBe(180);
    expect(ellipticalAngleDeg(400, 400, 400)).toBe(0);
  });

  it('computes the coast time to apogee', () => {
    // About five and a quarter hours up to geostationary altitude.
    expect(halfPeriodS(200, 35_786) / 3600).toBeCloseTo(5.26, 1);
    // A low orbit takes about 92 minutes per lap.
    expect((2 * halfPeriodS(400, 400)) / 60).toBeCloseTo(92.4, 0);
  });
});

import { describe, expect, it } from 'vitest';
import {
  circularSpeedMs,
  computeDeltaV,
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

  it('computes the coast time to apogee', () => {
    // About five and a quarter hours up to geostationary altitude.
    expect(halfPeriodS(200, 35_786) / 3600).toBeCloseTo(5.26, 1);
    // A low orbit takes about 92 minutes per lap.
    expect((2 * halfPeriodS(400, 400)) / 60).toBeCloseTo(92.4, 0);
  });
});

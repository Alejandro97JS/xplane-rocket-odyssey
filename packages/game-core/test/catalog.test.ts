import { describe, expect, it } from 'vitest';
import {
  getLevel,
  getOrbit,
  getPayload,
  getRocket,
  LEVELS,
  LEVEL_IDS,
  ORBITS,
  ORBIT_IDS,
  PAYLOADS,
  PAYLOAD_IDS,
  ROCKETS,
  ROCKET_IDS,
} from '../src/index.ts';

const M = 1_000_000;

describe('catalog', () => {
  it('has one entry per identifier, in the same order', () => {
    expect(LEVELS.map((l) => l.id)).toEqual([...LEVEL_IDS]);
    expect(PAYLOADS.map((p) => p.id)).toEqual([...PAYLOAD_IDS]);
    expect(ORBITS.map((o) => o.id)).toEqual([...ORBIT_IDS]);
    expect(ROCKETS.map((r) => r.id)).toEqual([...ROCKET_IDS]);
  });

  it('matches the payload table of the use case', () => {
    const table = PAYLOADS.map((p) => [p.id, p.massKg, p.costUsd / M]);
    expect(table).toEqual([
      ['cubesat', 130, 18],
      ['earth_observation', 450, 27],
      ['sar_radar', 400, 40],
      ['telecom', 1_800, 75],
      ['observatory', 1_500, 150],
      ['capsule_suborbital', 1_400, 65],
      ['capsule_classic', 7_200, 130],
      ['capsule_modern', 12_500, 220],
      ['capsule_shielded', 21_000, 350],
      ['station_core', 4_200, 80],
      ['station_lab', 8_500, 160],
      ['station_habitat', 10_000, 190],
    ]);
  });

  it('matches the orbit table of the use case', () => {
    const table = ORBITS.map((o) => [o.id, o.requiredDeltaVMs]);
    expect(table).toEqual([
      ['leo', 9_300],
      ['sso', 9_800],
      ['meo', 11_200],
      ['geo', 12_000],
      ['heo', 11_500],
    ]);
  });

  it('matches the launcher table of the use case', () => {
    const table = ROCKETS.map((r) => [
      r.id,
      r.costUsd / M,
      r.dryMassKg,
      r.propellantMassKg,
      r.ispS,
      r.maxLeoPayloadKg,
    ]);
    expect(table).toEqual([
      ['electron', 8.5, 1_200, 11_300, 320, 300],
      ['soyuz', 50, 22_000, 285_000, 315, 7_500],
      ['falcon9', 70, 26_200, 518_400, 311, 22_800],
      ['ariane6', 85, 41_000, 455_000, 350, 10_350],
      ['starship', 100, 375_000, 4_900_000, 360, 150_000],
      ['ariane5', 180, 45_000, 700_000, 370, 20_000],
      ['saturn5', 1_200, 130_000, 2_840_000, 380, 140_000],
      ['shuttle', 1_500, 278_000, 1_760_000, 410, 24_400],
    ]);
  });

  it('matches the level budgets of the use case', () => {
    expect(LEVELS.map((l) => [l.number, l.maxBudgetUsd / M])).toEqual([
      [1, 35],
      [2, 85],
      [3, 190],
      [4, 300],
      [5, 520],
    ]);
  });

  it.each(ROCKETS)('splits $name into stages that add up to the table', (rocket) => {
    const [stage1, stage2] = rocket.stages;
    expect(stage1.dryMassKg + stage2.dryMassKg).toBe(rocket.dryMassKg);
    expect(stage1.propellantMassKg + stage2.propellantMassKg).toBe(rocket.propellantMassKg);
    const weightedIsp =
      (stage1.ispS * stage1.propellantMassKg + stage2.ispS * stage2.propellantMassKg) /
      rocket.propellantMassKg;
    expect(Math.abs(weightedIsp - rocket.ispS)).toBeLessThan(1);
  });

  it('splits the delta-v of high orbits into burns that add up to the table', () => {
    for (const orbit of ORBITS) {
      const plan = orbit.flightPlan;
      const total =
        plan.insertionDeltaVMs +
        (plan.transfer
          ? plan.transfer.injectionDeltaVMs + plan.transfer.circularizationDeltaVMs
          : 0);
      expect(total).toBe(orbit.requiredDeltaVMs);
    }
  });

  it('marks every orbit above low orbit as a radiation hazard', () => {
    expect(ORBITS.filter((o) => o.radiationHazard).map((o) => o.id)).toEqual([
      'meo',
      'geo',
      'heo',
    ]);
  });

  it('shields only the heavy capsule', () => {
    expect(PAYLOADS.filter((p) => p.radiationShielded).map((p) => p.id)).toEqual([
      'capsule_shielded',
    ]);
    expect(PAYLOADS.filter((p) => p.crew > 0).map((p) => [p.id, p.crew])).toEqual([
      ['capsule_suborbital', 1],
      ['capsule_classic', 3],
      ['capsule_modern', 4],
      ['capsule_shielded', 4],
    ]);
  });

  it('looks entries up by identifier', () => {
    expect(getLevel('human_horizon').number).toBe(4);
    expect(getPayload('telecom').massKg).toBe(1_800);
    expect(getOrbit('geo').requiredDeltaVMs).toBe(12_000);
    expect(getRocket('falcon9').shortName).toBe('Falcon 9');
  });
});

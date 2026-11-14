import { describe, expect, it } from 'vitest';
import {
  computeScore,
  evaluateMission,
  HINTS,
  LEVELS,
  ORBITS,
  PAYLOADS,
  ROCKETS,
  type CompleteDesign,
  type FailureCode,
  type LevelId,
  type OrbitId,
  type PayloadId,
  type RocketId,
} from '../src/index.ts';

function design(payloadIds: PayloadId[], orbitId: OrbitId, rocketId: RocketId): CompleteDesign {
  return { payloadIds, orbitId, rocketId };
}

interface Case {
  name: string;
  level: LevelId;
  payloads: PayloadId[];
  orbit: OrbitId;
  rocket: RocketId;
  expected: FailureCode | null;
}

/** The paths the use case lists as valid, where its own budgets allow them. */
const SUCCESS_CASES: Case[] = [
  { name: 'L1 CubeSat on Electron to LEO', level: 'first_space_data', payloads: ['cubesat'], orbit: 'leo', rocket: 'electron', expected: null },
  { name: 'L2 optical pack on Soyuz to SSO', level: 'environmental_surveillance', payloads: ['earth_observation'], orbit: 'sso', rocket: 'soyuz', expected: null },
  { name: 'L2 optical pack on Soyuz to LEO', level: 'environmental_surveillance', payloads: ['earth_observation'], orbit: 'leo', rocket: 'soyuz', expected: null },
  { name: 'L3 telecom on Falcon 9 to GEO', level: 'connecting_the_continent', payloads: ['telecom'], orbit: 'geo', rocket: 'falcon9', expected: null },
  { name: 'L3 telecom on Ariane 6 to GEO', level: 'connecting_the_continent', payloads: ['telecom'], orbit: 'geo', rocket: 'ariane6', expected: null },
  { name: 'L3 telecom on Falcon 9 to HEO', level: 'connecting_the_continent', payloads: ['telecom'], orbit: 'heo', rocket: 'falcon9', expected: null },
  { name: 'L3 telecom on Ariane 6 to HEO', level: 'connecting_the_continent', payloads: ['telecom'], orbit: 'heo', rocket: 'ariane6', expected: null },
  { name: 'L4 test capsule on Soyuz to LEO', level: 'human_horizon', payloads: ['capsule_suborbital'], orbit: 'leo', rocket: 'soyuz', expected: null },
  { name: 'L4 classic capsule on Soyuz to LEO', level: 'human_horizon', payloads: ['capsule_classic'], orbit: 'leo', rocket: 'soyuz', expected: null },
  { name: 'L4 classic capsule on Falcon 9 to LEO', level: 'human_horizon', payloads: ['capsule_classic'], orbit: 'leo', rocket: 'falcon9', expected: null },
  { name: 'L4 commercial capsule on Falcon 9 to LEO', level: 'human_horizon', payloads: ['capsule_modern'], orbit: 'leo', rocket: 'falcon9', expected: null },
  { name: 'L5 core, lab and test capsule on Falcon 9', level: 'orbital_outpost', payloads: ['capsule_suborbital', 'station_core', 'station_lab'], orbit: 'leo', rocket: 'falcon9', expected: null },
  { name: 'L5 core, habitat and classic capsule on Falcon 9', level: 'orbital_outpost', payloads: ['capsule_classic', 'station_core', 'station_habitat'], orbit: 'leo', rocket: 'falcon9', expected: null },
  { name: 'L5 core, lab and test capsule on Ariane 5', level: 'orbital_outpost', payloads: ['capsule_suborbital', 'station_core', 'station_lab'], orbit: 'leo', rocket: 'ariane5', expected: null },
  { name: 'L5 core, lab and classic capsule on Starship', level: 'orbital_outpost', payloads: ['capsule_classic', 'station_core', 'station_lab'], orbit: 'leo', rocket: 'starship', expected: null },
];

/** One case, at least, for every way a mission can fail. */
const FAILURE_CASES: Case[] = [
  // Budget
  { name: 'L1 CubeSat on Soyuz costs too much', level: 'first_space_data', payloads: ['cubesat'], orbit: 'leo', rocket: 'soyuz', expected: 'budget_exceeded' },
  { name: 'L2 radar on Soyuz is 5M over budget', level: 'environmental_surveillance', payloads: ['sar_radar'], orbit: 'sso', rocket: 'soyuz', expected: 'budget_exceeded' },
  { name: 'L2 optical pack on Falcon 9 is over budget', level: 'environmental_surveillance', payloads: ['earth_observation'], orbit: 'sso', rocket: 'falcon9', expected: 'budget_exceeded' },
  { name: 'L4 shielded capsule cannot be afforded', level: 'human_horizon', payloads: ['capsule_shielded'], orbit: 'meo', rocket: 'starship', expected: 'budget_exceeded' },
  // Payload mass
  { name: 'L2 optical pack is too heavy for Electron', level: 'environmental_surveillance', payloads: ['earth_observation'], orbit: 'sso', rocket: 'electron', expected: 'payload_overweight' },
  { name: 'L4 commercial capsule is too heavy for Soyuz', level: 'human_horizon', payloads: ['capsule_modern'], orbit: 'leo', rocket: 'soyuz', expected: 'payload_overweight' },
  { name: 'L5 station is too heavy for Ariane 6', level: 'orbital_outpost', payloads: ['capsule_suborbital', 'station_core', 'station_lab'], orbit: 'leo', rocket: 'ariane6', expected: 'payload_overweight' },
  // Delta-v
  { name: 'L3 Soyuz cannot take the telecom satellite to GEO', level: 'connecting_the_continent', payloads: ['telecom'], orbit: 'geo', rocket: 'soyuz', expected: 'delta_v_shortage' },
  { name: 'L3 Soyuz cannot take the telecom satellite to HEO', level: 'connecting_the_continent', payloads: ['telecom'], orbit: 'heo', rocket: 'soyuz', expected: 'delta_v_shortage' },
  { name: 'L1 Electron cannot take the CubeSat to MEO', level: 'first_space_data', payloads: ['cubesat'], orbit: 'meo', rocket: 'electron', expected: 'delta_v_shortage' },
  { name: 'L4 Soyuz cannot take the classic capsule to SSO', level: 'human_horizon', payloads: ['capsule_classic'], orbit: 'sso', rocket: 'soyuz', expected: 'delta_v_shortage' },
  // Radiation
  { name: 'L4 classic capsule in GEO', level: 'human_horizon', payloads: ['capsule_classic'], orbit: 'geo', rocket: 'falcon9', expected: 'radiation' },
  { name: 'L4 test capsule in MEO', level: 'human_horizon', payloads: ['capsule_suborbital'], orbit: 'meo', rocket: 'falcon9', expected: 'radiation' },
  { name: 'L4 test capsule in HEO', level: 'human_horizon', payloads: ['capsule_suborbital'], orbit: 'heo', rocket: 'soyuz', expected: 'radiation' },
  // Objective
  { name: 'L1 right satellite, wrong orbit', level: 'first_space_data', payloads: ['cubesat'], orbit: 'sso', rocket: 'electron', expected: 'objective_unfulfilled' },
  { name: 'L3 telecom satellite in LEO', level: 'connecting_the_continent', payloads: ['telecom'], orbit: 'leo', rocket: 'soyuz', expected: 'objective_unfulfilled' },
  { name: 'L3 wrong satellite in GEO', level: 'connecting_the_continent', payloads: ['earth_observation'], orbit: 'geo', rocket: 'falcon9', expected: 'objective_unfulfilled' },
  { name: 'L4 no capsule', level: 'human_horizon', payloads: ['station_core'], orbit: 'leo', rocket: 'soyuz', expected: 'objective_unfulfilled' },
  { name: 'L5 station without a capsule', level: 'orbital_outpost', payloads: ['station_core', 'station_lab'], orbit: 'leo', rocket: 'falcon9', expected: 'objective_unfulfilled' },
  { name: 'L5 station without a core', level: 'orbital_outpost', payloads: ['capsule_suborbital', 'station_lab'], orbit: 'leo', rocket: 'falcon9', expected: 'objective_unfulfilled' },
];

describe('evaluateMission', () => {
  it.each(SUCCESS_CASES)('succeeds: $name', (c) => {
    const evaluation = evaluateMission(c.level, design(c.payloads, c.orbit, c.rocket));
    expect(evaluation.checks.filter((check) => !check.passed).map((check) => check.id)).toEqual([]);
    expect(evaluation.failure).toBeNull();
  });

  it.each(FAILURE_CASES)('fails: $name', (c) => {
    const evaluation = evaluateMission(c.level, design(c.payloads, c.orbit, c.rocket));
    expect(evaluation.failure).toBe(c.expected);
  });

  it('always runs the five checks in flight order', () => {
    const evaluation = evaluateMission('first_space_data', design(['cubesat'], 'leo', 'electron'));
    expect(evaluation.checks.map((check) => check.id)).toEqual([
      'budget',
      'payload_mass',
      'delta_v',
      'radiation',
      'objective',
    ]);
  });

  it('reports every failed check, and the first one decides the failure', () => {
    // Over budget, too heavy, short of delta-v, crew in the belts, no objective.
    const evaluation = evaluateMission(
      'first_space_data',
      design(['capsule_modern'], 'geo', 'soyuz'),
    );
    expect(evaluation.checks.filter((check) => !check.passed).map((check) => check.id)).toEqual([
      'budget',
      'payload_mass',
      'delta_v',
      'radiation',
      'objective',
    ]);
    expect(evaluation.failure).toBe('budget_exceeded');
  });

  it('accepts a mission that costs exactly the budget', () => {
    // Observatory 150M + test capsule 65M + Ariane 6 85M = 300M, the level 4 budget.
    const evaluation = evaluateMission(
      'human_horizon',
      design(['observatory', 'capsule_suborbital'], 'leo', 'ariane6'),
    );
    expect(evaluation.budget.overUsd).toBe(0);
    expect(evaluation.checks[0]?.passed).toBe(true);
  });

  it('compares the payload mass with the capacity of the rocket', () => {
    const fits = evaluateMission('human_horizon', design(['capsule_classic'], 'leo', 'soyuz'));
    expect(fits.mass).toEqual({ payloadKg: 7_200, capacityKg: 7_500, overKg: -300 });
    expect(fits.checks[1]?.passed).toBe(true);

    const tooHeavy = evaluateMission('human_horizon', design(['capsule_modern'], 'leo', 'soyuz'));
    expect(tooHeavy.mass).toEqual({ payloadKg: 12_500, capacityKg: 7_500, overKg: 5_000 });
    expect(tooHeavy.checks[1]?.passed).toBe(false);
  });

  it('lets a shielded capsule fly through the radiation belts', () => {
    const evaluation = evaluateMission(
      'human_horizon',
      design(['capsule_shielded'], 'meo', 'starship'),
    );
    const radiation = evaluation.checks.find((check) => check.id === 'radiation');
    expect(radiation?.passed).toBe(true);
    expect(evaluation.radiation.exposedCrew).toBe(0);
  });

  it('counts the exposed crew', () => {
    const evaluation = evaluateMission('human_horizon', design(['capsule_classic'], 'geo', 'falcon9'));
    expect(evaluation.radiation.exposedCrew).toBe(3);
  });

  it('gives the hints of the use case, word for word', () => {
    const hints = (level: LevelId, payloads: PayloadId[], orbit: OrbitId, rocket: RocketId) =>
      evaluateMission(level, design(payloads, orbit, rocket)).checks.find((check) => !check.passed)
        ?.hints;

    expect(hints('first_space_data', ['cubesat'], 'leo', 'soyuz')).toEqual([
      "You've exceeded the agency's budget! Review the rocket cost or lighten the payload by choosing more economical components.",
    ]);
    expect(hints('environmental_surveillance', ['earth_observation'], 'sso', 'electron')).toEqual([
      'The chosen rocket lacks enough max payload capacity to lift all the weight you put in the bay. You need a heavier rocket or fewer instruments.',
    ]);
    expect(hints('connecting_the_continent', ['telecom'], 'geo', 'soyuz')).toEqual([
      'The engine ran out of fuel before reaching the required orbital velocity. Try a lower orbit or a rocket with higher specific impulse (Isp) or more fuel.',
    ]);
    expect(hints('human_horizon', ['capsule_classic'], 'geo', 'falcon9')).toEqual([
      'Medical alert! You sent a standard capsule to a medium orbit passing through the Van Allen radiation belts without proper shielding. Use the shielded capsule or keep the mission in LEO.',
    ]);
    expect(hints('human_horizon', ['station_core'], 'leo', 'soyuz')).toEqual([
      "The mission flew successfully, but you didn't install the correct hardware for the contract objective (e.g., missing scientific instruments or manned modules).",
    ]);
    // The right hardware in an orbit that does not serve the contract.
    expect(hints('first_space_data', ['cubesat'], 'sso', 'electron')).toEqual([
      HINTS.objective_orbit,
    ]);
    // Wrong hardware and wrong orbit: both hints.
    expect(hints('connecting_the_continent', ['cubesat'], 'leo', 'falcon9')).toEqual([
      HINTS.objective_hardware,
      HINTS.objective_orbit,
    ]);
  });

  it('is deterministic', () => {
    const d = design(['telecom'], 'geo', 'falcon9');
    expect(evaluateMission('connecting_the_continent', d)).toEqual(
      evaluateMission('connecting_the_continent', d),
    );
  });
});

describe('levels', () => {
  /** Every design with up to four payloads: 793 payload sets, 5 orbits, 8 rockets. */
  function* everyDesign(): Generator<CompleteDesign> {
    const ids = PAYLOADS.map((p) => p.id);
    const sets: PayloadId[][] = [];
    const build = (start: number, current: PayloadId[]) => {
      if (current.length > 0) sets.push(current);
      if (current.length === 4) return;
      for (let i = start; i < ids.length; i++) build(i + 1, [...current, ids[i]!]);
    };
    build(0, []);
    for (const payloadIds of sets) {
      for (const orbit of ORBITS) {
        for (const rocket of ROCKETS) {
          yield { payloadIds, orbitId: orbit.id, rocketId: rocket.id };
        }
      }
    }
  }

  it.each(LEVELS)('level $number can be won, and with three stars', (level) => {
    let wins = 0;
    let bestStars = 0;
    for (const d of everyDesign()) {
      const evaluation = evaluateMission(level.id, d);
      const score = computeScore(evaluation);
      if (score) {
        wins++;
        bestStars = Math.max(bestStars, score.stars);
      }
    }
    expect(wins).toBeGreaterThan(0);
    expect(bestStars).toBe(3);
  });

  it('level 1 has exactly one winning design', () => {
    const wins = [...everyDesign()].filter(
      (d) => evaluateMission('first_space_data', d).failure === null,
    );
    expect(wins).toEqual([{ payloadIds: ['cubesat'], orbitId: 'leo', rocketId: 'electron' }]);
  });

  it('level 3 can be won with different rockets and orbits', () => {
    const wins = [...everyDesign()].filter(
      (d) =>
        d.payloadIds.length === 1 &&
        evaluateMission('connecting_the_continent', d).failure === null,
    );
    expect(new Set(wins.map((d) => d.rocketId))).toEqual(
      new Set(['falcon9', 'ariane6', 'starship']),
    );
    expect(new Set(wins.map((d) => d.orbitId))).toEqual(new Set(['geo', 'heo']));
  });
});

describe('computeScore', () => {
  it('gives no score to a failed mission', () => {
    const evaluation = evaluateMission('first_space_data', design(['cubesat'], 'leo', 'soyuz'));
    expect(computeScore(evaluation)).toBeNull();
  });

  it('adds up to the total and stays within 100', () => {
    const evaluation = evaluateMission('first_space_data', design(['cubesat'], 'leo', 'electron'));
    const score = computeScore(evaluation)!;
    expect(score.parts.reduce((sum, part) => sum + part.points, 0)).toBe(score.total);
    expect(score.total).toBeLessThanOrEqual(100);
    expect(score.total).toBeGreaterThanOrEqual(60);
    for (const part of score.parts) {
      expect(part.points).toBeGreaterThanOrEqual(0);
      expect(part.points).toBeLessThanOrEqual(part.maxPoints);
    }
  });

  it('rewards a cheaper rocket and penalises a thin delta-v reserve', () => {
    const score = (rocket: RocketId, payloads: PayloadId[]) =>
      computeScore(evaluateMission('human_horizon', design(payloads, 'leo', rocket)))!;
    const part = (s: ReturnType<typeof score>, id: string) =>
      s.parts.find((p) => p.id === id)!.points;

    const soyuz = score('soyuz', ['capsule_classic']);
    const falcon = score('falcon9', ['capsule_classic']);
    // Soyuz is cheaper, so it saves more budget...
    expect(part(soyuz, 'budget')).toBeGreaterThanOrEqual(part(falcon, 'budget'));
    // ...but it reaches orbit with almost no propellant to spare.
    expect(part(soyuz, 'margin')).toBeLessThan(part(falcon, 'margin'));
  });
});

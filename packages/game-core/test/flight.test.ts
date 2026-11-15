import { describe, expect, it } from 'vitest';
import {
  simulate,
  type CompleteDesign,
  type FlightEnding,
  type FlightEventId,
  type FlightPhaseId,
  type LevelId,
  type SimulationResult,
} from '../src/index.ts';

interface Scenario {
  name: string;
  level: LevelId;
  design: CompleteDesign;
  ending: FlightEnding;
}

const SCENARIOS: Scenario[] = [
  {
    name: 'success in low orbit',
    level: 'first_space_data',
    design: { payloadIds: ['cubesat'], orbitId: 'leo', rocketId: 'electron' },
    ending: 'success',
  },
  {
    name: 'success in geostationary orbit',
    level: 'connecting_the_continent',
    design: { payloadIds: ['telecom'], orbitId: 'geo', rocketId: 'falcon9' },
    ending: 'success',
  },
  {
    name: 'success in a high elliptical orbit',
    level: 'connecting_the_continent',
    design: { payloadIds: ['telecom'], orbitId: 'heo', rocketId: 'ariane6' },
    ending: 'success',
  },
  {
    name: 'scrubbed for budget',
    level: 'first_space_data',
    design: { payloadIds: ['cubesat'], orbitId: 'leo', rocketId: 'soyuz' },
    ending: 'scrubbed',
  },
  {
    name: 'breakup of an overloaded rocket',
    level: 'environmental_surveillance',
    design: { payloadIds: ['earth_observation'], orbitId: 'sso', rocketId: 'electron' },
    ending: 'breakup',
  },
  {
    name: 're-entry after running dry before orbit',
    level: 'human_horizon',
    design: { payloadIds: ['capsule_classic'], orbitId: 'sso', rocketId: 'soyuz' },
    ending: 'reentry',
  },
  {
    name: 'stranded during the transfer burn',
    level: 'human_horizon',
    design: { payloadIds: ['capsule_classic'], orbitId: 'meo', rocketId: 'soyuz' },
    ending: 'stranded',
  },
  {
    name: 'stranded during the circularisation burn',
    level: 'connecting_the_continent',
    design: { payloadIds: ['telecom'], orbitId: 'geo', rocketId: 'soyuz' },
    ending: 'stranded',
  },
  {
    name: 'crew exposed to radiation',
    level: 'human_horizon',
    design: { payloadIds: ['capsule_classic'], orbitId: 'geo', rocketId: 'falcon9' },
    ending: 'radiation',
  },
  {
    name: 'objective missed',
    level: 'first_space_data',
    design: { payloadIds: ['cubesat'], orbitId: 'sso', rocketId: 'electron' },
    ending: 'objective_missed',
  },
];

const run = (s: Scenario): SimulationResult => simulate(s.level, s.design);
const eventIds = (result: SimulationResult): FlightEventId[] =>
  result.flight.events.map((event) => event.id);

describe('simulate', () => {
  it.each(SCENARIOS)('ends as expected: $name', (scenario) => {
    const result = run(scenario);
    expect(result.flight.ending).toBe(scenario.ending);
    expect(result.outcome).toBe(scenario.ending === 'success' ? 'success' : 'failure');
    expect(result.failure === null).toBe(scenario.ending === 'success');
    expect(result.score === null).toBe(scenario.ending !== 'success');
  });

  it.each(SCENARIOS)('builds a consistent timeline: $name', (scenario) => {
    const { flight } = run(scenario);

    // Phases cover the flight from start to end without gaps or overlaps.
    expect(flight.phases[0]?.tStart).toBe(flight.tStart);
    expect(flight.phases.at(-1)?.tEnd).toBeCloseTo(flight.tEnd, 6);
    for (let i = 1; i < flight.phases.length; i++) {
      expect(flight.phases[i]!.tStart).toBeCloseTo(flight.phases[i - 1]!.tEnd, 6);
      expect(flight.phases[i]!.tEnd).toBeGreaterThan(flight.phases[i]!.tStart);
    }

    // Events are in time order and inside the flight.
    for (let i = 0; i < flight.events.length; i++) {
      const event = flight.events[i]!;
      expect(event.t).toBeGreaterThanOrEqual(flight.tStart);
      expect(event.t).toBeLessThanOrEqual(flight.tEnd);
      expect(event.title).not.toBe('');
      expect(event.detail).not.toBe('');
      if (i > 0) expect(event.t).toBeGreaterThanOrEqual(flight.events[i - 1]!.t);
    }

    // Telemetry is in time order, covers the flight and stays physical.
    expect(flight.telemetry[0]?.t).toBe(flight.tStart);
    expect(flight.telemetry.at(-1)?.t).toBeCloseTo(flight.tEnd, 6);
    for (let i = 0; i < flight.telemetry.length; i++) {
      const sample = flight.telemetry[i]!;
      if (i > 0) expect(sample.t).toBeGreaterThanOrEqual(flight.telemetry[i - 1]!.t);
      expect(Number.isFinite(sample.altitudeKm)).toBe(true);
      expect(Number.isFinite(sample.velocityMs)).toBe(true);
      expect(Number.isFinite(sample.downrangeDeg)).toBe(true);
      expect(sample.altitudeKm).toBeGreaterThanOrEqual(0);
      expect(sample.velocityMs).toBeGreaterThanOrEqual(0);
      for (const fuel of sample.fuel) {
        expect(fuel).toBeGreaterThanOrEqual(0);
        expect(fuel).toBeLessThanOrEqual(1);
      }
    }
  });

  it.each(SCENARIOS)('never refills a tank: $name', (scenario) => {
    const { telemetry } = run(scenario).flight;
    for (let i = 1; i < telemetry.length; i++) {
      expect(telemetry[i]!.fuel[0]).toBeLessThanOrEqual(telemetry[i - 1]!.fuel[0] + 1e-9);
      expect(telemetry[i]!.fuel[1]).toBeLessThanOrEqual(telemetry[i - 1]!.fuel[1] + 1e-9);
    }
  });

  it.each(SCENARIOS)('is deterministic: $name', (scenario) => {
    expect(run(scenario)).toEqual(run(scenario));
  });

  it.each(SCENARIOS)('gives a result that survives JSON: $name', (scenario) => {
    const result = run(scenario);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it('never leaves the pad when the mission is over budget', () => {
    const result = run(SCENARIOS[3]!);
    expect(eventIds(result)).toEqual(['terminal_count', 'hold', 'scrub']);
    expect(result.flight.telemetry.every((s) => s.altitudeKm === 0 && s.velocityMs === 0)).toBe(
      true,
    );
    expect(result.flight.telemetry.every((s) => s.fuel[0] === 1 && s.fuel[1] === 1)).toBe(true);
  });

  it('breaks an overloaded rocket apart at Max-Q, before staging', () => {
    const result = run(SCENARIOS[4]!);
    expect(eventIds(result)).toEqual([
      'terminal_count',
      'ignition',
      'liftoff',
      'max_q',
      'structural_failure',
      'mission_lost',
    ]);
    expect(result.flight.tEnd).toBeLessThan(120);
  });

  it('flies a low orbit mission in one second stage burn', () => {
    const result = run(SCENARIOS[0]!);
    expect(eventIds(result)).toEqual([
      'terminal_count',
      'ignition',
      'liftoff',
      'max_q',
      'meco',
      'stage_separation',
      'second_stage_ignition',
      'fairing_separation',
      'orbit_insertion',
      'payload_deployed',
      'mission_success',
    ]);
    const last = result.flight.telemetry.at(-1)!;
    expect(last.altitudeKm).toBeCloseTo(400, 6);
    // Orbital speed at 400 km.
    expect(last.velocityMs).toBeCloseTo(7_673, -1);
    expect(last.fuel[0]).toBe(0);
    expect(last.fuel[1]).toBeGreaterThan(0);
  });

  it('flies a geostationary mission with a transfer and three burns', () => {
    const result = run(SCENARIOS[1]!);
    expect(result.flight.phases.map((p) => p.id)).toEqual([
      'countdown',
      'stage1_burn',
      'staging',
      'insertion_burn',
      'parking_coast',
      'transfer_burn',
      'transfer_coast',
      'circularization_burn',
      'orbit_operations',
    ]);
    const last = result.flight.telemetry.at(-1)!;
    expect(last.altitudeKm).toBeCloseTo(35_786, 6);
    expect(last.velocityMs).toBeCloseTo(3_075, -1);
  });

  it.each<[string, Scenario, FlightPhaseId]>([
    ['to geostationary altitude', SCENARIOS[1]!, 'transfer_coast'],
    ['to the top of a high elliptical orbit', SCENARIOS[2]!, 'transfer_coast'],
    ['of a vehicle stranded during the transfer burn', SCENARIOS[6]!, 'stranded'],
  ])('draws the climb to the apogee as a curve: %s', (_name, scenario, phaseId) => {
    const { flight } = run(scenario);
    const phase = flight.phases.find((p) => p.id === phaseId)!;
    // The sample at the start of the phase is the engine cutoff, at the perigee.
    const climb = flight.telemetry.filter((s) => s.t >= phase.tStart && s.t <= phase.tEnd);
    const perigee = climb[0]!;
    const apogee = climb.at(-1)!;

    // Half a lap, in steps short enough to be drawn as a curve.
    expect(apogee.downrangeDeg - perigee.downrangeDeg).toBeCloseTo(180, 6);
    for (let i = 1; i < climb.length; i++) {
      expect(climb[i]!.downrangeDeg - climb[i - 1]!.downrangeDeg).toBeLessThanOrEqual(5);
      expect(climb[i]!.altitudeKm).toBeGreaterThanOrEqual(climb[i - 1]!.altitudeKm);
    }
    // The path leaves the perigee level. A first step that is already far
    // up is drawn as a straight line that cuts across the curve.
    const firstStepKm = climb[1]!.altitudeKm - perigee.altitudeKm;
    expect(firstStepKm).toBeLessThan(0.01 * (apogee.altitudeKm - perigee.altitudeKm));
  });

  it('reports the radiation belts when the climb reaches them', () => {
    const { flight } = run(SCENARIOS[1]!);
    const belts = flight.events.find((e) => e.id === 'radiation_belts')!;
    const after = flight.telemetry.findIndex((s) => s.t >= belts.t);
    // The densest part of the inner belt is at 3,000 km.
    expect(flight.telemetry[after - 1]!.altitudeKm).toBeLessThanOrEqual(3_000);
    expect(flight.telemetry[after]!.altitudeKm).toBeGreaterThanOrEqual(3_000);
  });

  it('leaves a high elliptical orbit without circularising', () => {
    const result = run(SCENARIOS[2]!);
    expect(result.flight.phases.map((p) => p.id)).not.toContain('circularization_burn');
    expect(eventIds(result)).toContain('orbit_insertion');
  });

  it('empties the second stage when the rocket is short of delta-v', () => {
    for (const scenario of [SCENARIOS[5]!, SCENARIOS[6]!, SCENARIOS[7]!]) {
      const result = run(scenario);
      expect(eventIds(result)).toContain('propellant_depleted');
      expect(result.flight.telemetry.at(-1)!.fuel[1]).toBeCloseTo(0, 6);
    }
  });

  it('falls back to the ground when it never reaches orbital speed', () => {
    const result = run(SCENARIOS[5]!);
    expect(eventIds(result).slice(-4)).toEqual([
      'propellant_depleted',
      'reentry',
      'breakup',
      'mission_lost',
    ]);
    expect(result.flight.telemetry.at(-1)!.altitudeKm).toBeLessThan(100);
    // A crew is on board: the text must say what happens to it.
    expect(result.flight.events.at(-1)?.detail).toContain('The crew is safe');
  });

  it('warns about the radiation belts on the way up, then aborts', () => {
    const result = run(SCENARIOS[8]!);
    const belts = result.flight.events.find((e) => e.id === 'radiation_belts');
    expect(belts?.tone).toBe('warning');
    expect(eventIds(result).at(-1)).toBe('radiation_alert');
    // The rocket itself reached the orbit.
    expect(eventIds(result)).toContain('orbit_insertion');
  });

  it('crosses the belts without alarm when there is no crew', () => {
    const result = run(SCENARIOS[1]!);
    expect(result.flight.events.find((e) => e.id === 'radiation_belts')?.tone).toBe('info');
  });

  it('explains every outcome with a headline, a summary and reasons', () => {
    for (const scenario of SCENARIOS) {
      const { report, outcome } = run(scenario);
      expect(report.headline).not.toBe('');
      expect(report.summary).not.toBe('');
      expect(report.explanation.length).toBeGreaterThan(0);
      expect(report.hints.length > 0).toBe(outcome === 'failure');
    }
  });

  it('tells the two delta-v failures apart', () => {
    expect(run(SCENARIOS[5]!).report.headline).toBe('Failed to reach orbit: out of propellant');
    expect(run(SCENARIOS[7]!).report.headline).toBe('Stranded short of the target orbit');
  });
});

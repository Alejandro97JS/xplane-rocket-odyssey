import { simulate, type CompleteDesign, type LevelId } from '@rocket-odyssey/game-core';
import { describe, expect, it } from 'vitest';
import {
  createPlayback,
  eventsUpTo,
  frameAt,
  missionTimeAt,
  phaseAt,
  playbackTimeAt,
  telemetryAt,
} from '../src/launch/playback.ts';

const FLIGHTS: [string, LevelId, CompleteDesign][] = [
  [
    'low orbit',
    'first_space_data',
    { payloadIds: ['cubesat'], orbitId: 'leo', rocketId: 'electron' },
  ],
  [
    'geostationary orbit',
    'connecting_the_continent',
    { payloadIds: ['telecom'], orbitId: 'geo', rocketId: 'falcon9' },
  ],
  ['scrub', 'first_space_data', { payloadIds: ['cubesat'], orbitId: 'leo', rocketId: 'soyuz' }],
  [
    'breakup',
    'environmental_surveillance',
    { payloadIds: ['earth_observation'], orbitId: 'sso', rocketId: 'electron' },
  ],
  [
    're-entry',
    'human_horizon',
    { payloadIds: ['capsule_classic'], orbitId: 'sso', rocketId: 'soyuz' },
  ],
];

describe('playback', () => {
  it.each(FLIGHTS)('shows the whole flight in under a minute: %s', (_name, level, design) => {
    const { flight } = simulate(level, design);
    const playback = createPlayback(flight);

    expect(playback.duration).toBeGreaterThan(4);
    expect(playback.duration).toBeLessThan(60);
    expect(missionTimeAt(playback, 0)).toBe(flight.tStart);
    expect(missionTimeAt(playback, playback.duration)).toBeCloseTo(flight.tEnd, 6);

    // Segments follow each other in both clocks.
    for (let i = 1; i < playback.segments.length; i++) {
      const previous = playback.segments[i - 1]!;
      const segment = playback.segments[i]!;
      expect(segment.start).toBeCloseTo(previous.end, 9);
      expect(segment.tStart).toBeCloseTo(previous.tEnd, 9);
      expect(segment.end).toBeGreaterThan(segment.start);
    }
  });

  it.each(FLIGHTS)('never runs the mission clock backwards: %s', (_name, level, design) => {
    const playback = createPlayback(simulate(level, design).flight);
    let last = -Infinity;
    for (let seconds = 0; seconds <= playback.duration; seconds += 0.05) {
      const t = missionTimeAt(playback, seconds);
      expect(t).toBeGreaterThanOrEqual(last);
      last = t;
    }
  });

  it.each(FLIGHTS)('maps between the two clocks both ways: %s', (_name, level, design) => {
    const playback = createPlayback(simulate(level, design).flight);
    for (let seconds = 0.1; seconds < playback.duration; seconds += 0.7) {
      expect(playbackTimeAt(playback, missionTimeAt(playback, seconds))).toBeCloseTo(seconds, 6);
    }
  });

  it('shows the liftoff slowly', () => {
    const playback = createPlayback(
      simulate(...(FLIGHTS[0]!.slice(1) as [LevelId, CompleteDesign])).flight,
    );
    const liftoff = playbackTimeAt(playback, 0);
    // Eight seconds of flight take three seconds on screen.
    expect(playbackTimeAt(playback, 8) - liftoff).toBeCloseTo(3, 6);
  });

  it('shows every event, in order, by the end', () => {
    const { flight } = simulate(...(FLIGHTS[1]!.slice(1) as [LevelId, CompleteDesign]));
    const playback = createPlayback(flight);
    expect(eventsUpTo(flight, flight.tStart - 1)).toEqual([]);
    expect(eventsUpTo(flight, missionTimeAt(playback, playback.duration))).toEqual(flight.events);

    const end = frameAt(playback, playback.duration);
    for (const event of flight.events) {
      expect(end.since[event.id]).toBeGreaterThanOrEqual(0);
    }
    const start = frameAt(playback, 0);
    expect(Object.keys(start.since)).toEqual(['terminal_count']);
  });

  it('interpolates telemetry between samples', () => {
    const { flight } = simulate(...(FLIGHTS[0]!.slice(1) as [LevelId, CompleteDesign]));
    const a = flight.telemetry[10]!;
    const b = flight.telemetry[11]!;
    const middle = telemetryAt(flight, (a.t + b.t) / 2);
    expect(middle.altitudeKm).toBeCloseTo((a.altitudeKm + b.altitudeKm) / 2, 9);
    expect(middle.velocityMs).toBeCloseTo((a.velocityMs + b.velocityMs) / 2, 9);

    expect(telemetryAt(flight, -999)).toBe(flight.telemetry[0]);
    expect(telemetryAt(flight, 1e9)).toBe(flight.telemetry.at(-1));
  });

  it('keeps the engines off until ignition', () => {
    const { flight } = simulate(...(FLIGHTS[0]!.slice(1) as [LevelId, CompleteDesign]));
    expect(telemetryAt(flight, -6).burning).toBe(0);
    expect(telemetryAt(flight, -1).burning).toBe(1);
  });

  it('names the phase at any time', () => {
    const { flight } = simulate(...(FLIGHTS[0]!.slice(1) as [LevelId, CompleteDesign]));
    expect(phaseAt(flight, -5)?.id).toBe('countdown');
    expect(phaseAt(flight, 10)?.id).toBe('stage1_burn');
    expect(phaseAt(flight, 1e9)?.id).toBe('orbit_operations');
  });
});

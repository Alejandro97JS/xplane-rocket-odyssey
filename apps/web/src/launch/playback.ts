import type {
  Flight,
  FlightEvent,
  FlightEventId,
  FlightPhase,
  FlightPhaseId,
  TelemetrySample,
} from '@rocket-odyssey/game-core';

/**
 * Maps the flight computed by game-core onto screen time. A real flight lasts
 * from ten minutes to several hours; the playback shows it in under a minute
 * by giving each phase a fixed time on screen. Nothing here decides the
 * outcome: it only chooses how fast to show what has already been computed.
 */

/** Seconds on screen for each phase of the flight. */
const PHASE_SECONDS: Record<FlightPhaseId, number> = {
  countdown: 5,
  scrub: 5,
  stage1_burn: 9,
  staging: 2.5,
  insertion_burn: 9,
  parking_coast: 3,
  transfer_burn: 4,
  transfer_coast: 6,
  circularization_burn: 4,
  orbit_operations: 6.5,
  breakup: 5,
  ballistic: 4,
  reentry: 5.5,
  stranded: 5,
};

/** The first seconds of the climb are shown slowly, so the liftoff can be seen. */
const LIFTOFF_MISSION_SECONDS = 8;
const LIFTOFF_SCREEN_SECONDS = 3;
const FULL_COUNTDOWN_MISSION_SECONDS = 10;
const NOMINAL_STAGE1_MISSION_SECONDS = 150;

/** A stretch of the flight shown at constant speed. */
export interface PlaybackSegment {
  /** Mission time, in seconds. */
  tStart: number;
  tEnd: number;
  /** Screen time, in seconds from the start of the playback. */
  start: number;
  end: number;
}

export interface Playback {
  flight: Flight;
  segments: PlaybackSegment[];
  /** Total screen time, in seconds. */
  duration: number;
}

export function createPlayback(flight: Flight): Playback {
  const segments: PlaybackSegment[] = [];
  let cursor = 0;
  const add = (tStart: number, tEnd: number, seconds: number) => {
    if (tEnd <= tStart) return;
    segments.push({ tStart, tEnd, start: cursor, end: cursor + seconds });
    cursor += seconds;
  };

  for (const phase of flight.phases) {
    const length = phase.tEnd - phase.tStart;
    if (phase.id === 'countdown') {
      // A countdown cut short by a hold takes less time on screen.
      add(
        phase.tStart,
        phase.tEnd,
        PHASE_SECONDS.countdown * (length / FULL_COUNTDOWN_MISSION_SECONDS),
      );
    } else if (phase.id === 'stage1_burn') {
      const liftoffEnd = Math.min(phase.tEnd, phase.tStart + LIFTOFF_MISSION_SECONDS);
      add(phase.tStart, liftoffEnd, LIFTOFF_SCREEN_SECONDS);
      // A first stage that fails early is not stretched to the full time.
      const share = Math.min(1, Math.max(0.4, length / NOMINAL_STAGE1_MISSION_SECONDS));
      add(liftoffEnd, phase.tEnd, PHASE_SECONDS.stage1_burn * share);
    } else {
      add(phase.tStart, phase.tEnd, PHASE_SECONDS[phase.id]);
    }
  }
  return { flight, segments, duration: cursor };
}

/** Mission time shown at a given moment of the playback. */
export function missionTimeAt(playback: Playback, seconds: number): number {
  const { segments } = playback;
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (!first || !last) return 0;
  if (seconds <= first.start) return first.tStart;
  if (seconds >= last.end) return last.tEnd;
  for (const segment of segments) {
    if (seconds <= segment.end) {
      const fraction = (seconds - segment.start) / (segment.end - segment.start);
      return segment.tStart + (segment.tEnd - segment.tStart) * fraction;
    }
  }
  return last.tEnd;
}

/** Moment of the playback at which a mission time is shown. */
export function playbackTimeAt(playback: Playback, missionTime: number): number {
  const { segments } = playback;
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (!first || !last) return 0;
  if (missionTime <= first.tStart) return first.start;
  if (missionTime >= last.tEnd) return last.end;
  for (const segment of segments) {
    if (missionTime <= segment.tEnd) {
      const fraction = (missionTime - segment.tStart) / (segment.tEnd - segment.tStart);
      return segment.start + (segment.end - segment.start) * fraction;
    }
  }
  return last.end;
}

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;

/** Telemetry at any mission time, interpolated between the computed samples. */
export function telemetryAt(flight: Flight, t: number): TelemetrySample {
  const samples = flight.telemetry;
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (!first || !last) {
    return { t, altitudeKm: 0, velocityMs: 0, downrangeDeg: 0, fuel: [1, 1], burning: 0 };
  }
  if (t <= first.t) return first;
  if (t >= last.t) return last;

  // Binary search for the pair of samples around t.
  let low = 0;
  let high = samples.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (samples[middle]!.t <= t) low = middle;
    else high = middle;
  }
  const a = samples[low]!;
  const b = samples[high]!;
  const f = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
  return {
    t,
    altitudeKm: lerp(a.altitudeKm, b.altitudeKm, f),
    velocityMs: lerp(a.velocityMs, b.velocityMs, f),
    downrangeDeg: lerp(a.downrangeDeg, b.downrangeDeg, f),
    fuel: [lerp(a.fuel[0], b.fuel[0], f), lerp(a.fuel[1], b.fuel[1], f)],
    // The engines of the later sample are the ones firing between the two.
    burning: b.burning,
  };
}

export function phaseAt(flight: Flight, t: number): FlightPhase | null {
  for (const phase of flight.phases) {
    if (t < phase.tEnd) return phase;
  }
  return flight.phases[flight.phases.length - 1] ?? null;
}

/** Events that have already happened at mission time `t`, in order. */
export function eventsUpTo(flight: Flight, t: number): FlightEvent[] {
  return flight.events.filter((event) => event.t <= t);
}

/**
 * Everything the animation needs to draw one frame. It depends only on the
 * playback time, so the animation can be paused, restarted or skipped.
 */
export interface SceneFrame {
  /** Screen time, in seconds. */
  seconds: number;
  /** Mission time, in seconds. */
  t: number;
  telemetry: TelemetrySample;
  phase: FlightPhaseId | null;
  /** Fraction of the current phase already shown, from 0 to 1. */
  phaseProgress: number;
  /**
   * Screen seconds since each event happened. Events that have not happened
   * yet are missing.
   */
  since: Partial<Record<FlightEventId, number>>;
}

export function frameAt(playback: Playback, seconds: number): SceneFrame {
  const clamped = Math.min(playback.duration, Math.max(0, seconds));
  const t = missionTimeAt(playback, clamped);
  const phase = phaseAt(playback.flight, t);
  const since: Partial<Record<FlightEventId, number>> = {};
  for (const event of playback.flight.events) {
    const at = playbackTimeAt(playback, event.t);
    if (at <= clamped) since[event.id] = clamped - at;
  }
  return {
    seconds: clamped,
    t,
    telemetry: telemetryAt(playback.flight, t),
    phase: phase?.id ?? null,
    phaseProgress: phase
      ? Math.min(1, Math.max(0, (t - phase.tStart) / (phase.tEnd - phase.tStart)))
      : 1,
    since,
  };
}

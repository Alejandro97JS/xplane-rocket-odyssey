import {
  formatAltitude,
  formatDuration,
  formatList,
  formatMass,
  formatPercent,
  formatSpeed,
  formatUsd,
  lowerFirst,
} from './format.ts';
import { circularSpeedMs, ellipticalSpeedMs, G0, halfPeriodS } from './physics.ts';
import type { Evaluation } from './rules.ts';

export type EventTone = 'info' | 'success' | 'warning' | 'danger';

export type FlightEventId =
  | 'terminal_count'
  | 'hold'
  | 'scrub'
  | 'ignition'
  | 'liftoff'
  | 'max_q'
  | 'structural_failure'
  | 'meco'
  | 'stage_separation'
  | 'second_stage_ignition'
  | 'fairing_separation'
  | 'propellant_depleted'
  | 'parking_orbit'
  | 'transfer_burn'
  | 'transfer_orbit'
  | 'radiation_belts'
  | 'apogee'
  | 'circularization_burn'
  | 'orbit_insertion'
  | 'payload_deployed'
  | 'reentry'
  | 'breakup'
  | 'stranded'
  | 'radiation_alert'
  | 'objective_missed'
  | 'mission_success'
  | 'mission_lost';

/** Something that happens at one moment of the flight. */
export interface FlightEvent {
  readonly id: FlightEventId;
  /** Mission time in seconds. Negative before liftoff. */
  readonly t: number;
  readonly title: string;
  readonly detail: string;
  readonly tone: EventTone;
}

export type FlightPhaseId =
  | 'countdown'
  | 'scrub'
  | 'stage1_burn'
  | 'staging'
  | 'insertion_burn'
  | 'parking_coast'
  | 'transfer_burn'
  | 'transfer_coast'
  | 'circularization_burn'
  | 'orbit_operations'
  | 'breakup'
  | 'ballistic'
  | 'reentry'
  | 'stranded';

/** A stretch of the flight. Phases follow each other without gaps. */
export interface FlightPhase {
  readonly id: FlightPhaseId;
  readonly label: string;
  readonly tStart: number;
  readonly tEnd: number;
}

export interface TelemetrySample {
  readonly t: number;
  readonly altitudeKm: number;
  readonly velocityMs: number;
  /** Angle travelled around the Earth since liftoff, in degrees. */
  readonly downrangeDeg: number;
  /** Propellant left in each stage, from 1 (full) to 0 (empty). */
  readonly fuel: readonly [number, number];
  /** Stage whose engines are firing, or 0 when coasting. */
  readonly burning: 0 | 1 | 2;
}

export type FlightEnding =
  | 'scrubbed'
  | 'breakup'
  | 'reentry'
  | 'stranded'
  | 'radiation'
  | 'objective_missed'
  | 'success';

/** The whole flight, computed before anything is animated. */
export interface Flight {
  readonly events: readonly FlightEvent[];
  readonly phases: readonly FlightPhase[];
  /** Samples in time order. Values between samples are interpolated linearly. */
  readonly telemetry: readonly TelemetrySample[];
  readonly tStart: number;
  readonly tEnd: number;
  readonly ending: FlightEnding;
}

const COUNTDOWN_START_S = -10;
/** Altitude where the air becomes thick enough to destroy a falling vehicle. */
const REENTRY_ALTITUDE_KM = 100;
/** Altitude of the densest part of the inner Van Allen belt. */
const INNER_BELT_ALTITUDE_KM = 3_000;

/**
 * Builds the timeline of a flight from the evaluation of its design. The
 * first failed check decides how the flight ends; everything before that
 * point is flown as planned.
 */
export function buildFlight(evaluation: Evaluation): Flight {
  const { rocket, orbit, level, payloads, totals, failure } = evaluation;
  const [stage1, stage2] = rocket.stages;
  const plan = orbit.flightPlan;

  const events: FlightEvent[] = [];
  const phases: FlightPhase[] = [];
  const telemetry: TelemetrySample[] = [];

  const event = (id: FlightEventId, t: number, tone: EventTone, title: string, detail: string) =>
    events.push({ id, t, tone, title, detail });
  const phase = (id: FlightPhaseId, label: string, tStart: number, tEnd: number) =>
    phases.push({ id, label, tStart, tEnd });

  // Mutable flight state, advanced phase by phase.
  let altitudeKm = 0;
  let velocityMs = 0;
  let downrangeDeg = 0;
  let fuel1 = 1;
  let fuel2 = 1;
  const sample = (t: number, burning: 0 | 1 | 2) =>
    telemetry.push({ t, altitudeKm, velocityMs, downrangeDeg, fuel: [fuel1, fuel2], burning });

  const finish = (tEnd: number, ending: FlightEnding): Flight => ({
    events,
    phases,
    telemetry,
    tStart: COUNTDOWN_START_S,
    tEnd,
    ending,
  });

  const payloadNames = formatList(payloads.map((p) => lowerFirst(p.shortName)));
  const crewOnly = payloads.every((p) => p.crew > 0);
  const crewed = totals.crew > 0;
  const strandedOutcome = crewed
    ? 'The capsule fires its own engines to come home. The crew is safe, but the mission has failed.'
    : `The ${payloadNames} cannot do the job from there.`;

  // --- Countdown -----------------------------------------------------------
  sample(COUNTDOWN_START_S, 0);
  event(
    'terminal_count',
    COUNTDOWN_START_S,
    'info',
    'Terminal count',
    `All stations report go. ${rocket.shortName} switches to internal power.`,
  );

  if (failure === 'budget_exceeded') {
    phase('countdown', 'Countdown', COUNTDOWN_START_S, -6);
    phase('scrub', 'Launch scrubbed', -6, 2);
    event(
      'hold',
      -6,
      'warning',
      'Hold! Hold! Hold!',
      `The flight readiness review stops the clock: the mission costs ${formatUsd(evaluation.budget.totalUsd)}, which is ${formatUsd(evaluation.budget.overUsd)} over the ${formatUsd(evaluation.budget.maxUsd)} budget.`,
    );
    event(
      'scrub',
      -2,
      'danger',
      'Launch scrubbed',
      'The agency does not release the funds. The rocket stays on the pad and its propellant is drained.',
    );
    sample(2, 0);
    return finish(2, 'scrubbed');
  }

  phase('countdown', 'Countdown', COUNTDOWN_START_S, 0);
  event(
    'ignition',
    -3,
    'info',
    'Engine ignition',
    'The first stage engines light up and build thrust while the clamps hold the rocket down.',
  );
  event(
    'liftoff',
    0,
    'info',
    'Liftoff',
    `${rocket.shortName} leaves the pad with ${formatMass(totals.payloadMassKg)} of payload. The whole vehicle weighs ${formatMass(evaluation.deltaV.budget.liftoffMassKg)}, most of it propellant.`,
  );
  sample(0, 1);

  // --- Ascent model ----------------------------------------------------------
  // Position and speed during the climb follow the delta-v delivered so far.
  // Part of that delta-v is lost fighting gravity and air, so the speed stays
  // below it and matches the orbital speed exactly at insertion.
  const insertionDeltaV = plan.insertionDeltaVMs;
  const insertionAltitudeKm = plan.insertionAltitudeKm;
  const insertionSpeedMs = circularSpeedMs(insertionAltitudeKm);
  const losses = insertionDeltaV - insertionSpeedMs;
  const ascentTo = (deliveredMs: number) => {
    const p = Math.min(1, deliveredMs / insertionDeltaV);
    altitudeKm = insertionAltitudeKm * Math.sin((Math.PI * p) / 2) ** 2;
    velocityMs = p * (insertionDeltaV - 2 * losses) + losses * p * p;
    downrangeDeg = 18 * p * p;
  };

  // --- First stage -----------------------------------------------------------
  const exhaust1 = stage1.ispS * G0;
  const flow1 = stage1.propellantMassKg / stage1.burnTimeS;
  const liftoffMassKg = evaluation.deltaV.budget.liftoffMassKg;
  const deliveredByStage1 = (t: number) =>
    exhaust1 * Math.log(liftoffMassKg / (liftoffMassKg - flow1 * t));

  const maxQ = Math.min(85, Math.max(50, 0.42 * stage1.burnTimeS));
  const overweight = failure === 'payload_overweight';
  const stage1End = overweight ? maxQ + 4 : stage1.burnTimeS;
  const STAGE1_STEPS = 40;
  for (let i = 1; i <= STAGE1_STEPS; i++) {
    const t = (stage1End * i) / STAGE1_STEPS;
    ascentTo(deliveredByStage1(t));
    fuel1 = 1 - t / stage1.burnTimeS;
    sample(t, 1);
  }

  if (overweight) {
    phase('stage1_burn', 'First stage burn', 0, stage1End);
    event(
      'max_q',
      maxQ,
      'warning',
      'Max-Q',
      'Maximum aerodynamic pressure, the moment of highest stress on the vehicle. The overloaded structure starts to buckle.',
    );
    event(
      'structural_failure',
      stage1End,
      'danger',
      'Structural failure',
      `The payload section is rated for ${formatMass(evaluation.mass.capacityKg)} and carries ${formatMass(evaluation.mass.payloadKg)}. It gives way and the vehicle breaks apart.`,
    );
    const breakupEnd = stage1End + 14;
    phase('breakup', 'Vehicle breakup', stage1End, breakupEnd);
    const altitudeAtFailure = altitudeKm;
    const speedAtFailure = velocityMs;
    for (let i = 1; i <= 7; i++) {
      const x = i / 7;
      altitudeKm = altitudeAtFailure * (1 + 0.25 * x - 0.6 * x * x);
      velocityMs = speedAtFailure * (1 - 0.7 * x);
      sample(stage1End + 14 * x, 0);
    }
    event(
      'mission_lost',
      breakupEnd - 2,
      'danger',
      'Mission lost',
      crewed
        ? 'The launch escape system pulls the capsule clear and the crew lands safely under parachutes. The rocket and the mission are lost.'
        : 'The debris falls into the ocean inside the safety zone. Nothing reaches orbit.',
    );
    return finish(breakupEnd, 'breakup');
  }

  phase('stage1_burn', 'First stage burn', 0, stage1End);
  event(
    'max_q',
    maxQ,
    'info',
    'Max-Q',
    'Maximum aerodynamic pressure, the moment of highest stress on the vehicle. The structure holds.',
  );
  const stage1DeltaV = evaluation.deltaV.budget.stages[0].deltaVMs;
  event(
    'meco',
    stage1End,
    'info',
    'Main engine cutoff',
    `The ${lowerFirst(stage1.name)} is empty. It added ${formatSpeed(stage1DeltaV)} of delta-v.`,
  );

  // --- Staging -----------------------------------------------------------------
  const separation = stage1End + 3;
  const stage2Ignition = stage1End + 8;
  phase('staging', 'Stage separation', stage1End, stage2Ignition);
  fuel1 = 0;
  sample(separation, 0);
  event(
    'stage_separation',
    separation,
    'info',
    'Stage separation',
    `The empty ${lowerFirst(stage1.name)} drops away, so the rocket no longer carries its ${formatMass(stage1.dryMassKg)} of dead weight.`,
  );
  sample(stage2Ignition, 2);
  event(
    'second_stage_ignition',
    stage2Ignition,
    'info',
    'Second stage ignition',
    `The ${lowerFirst(stage2.name)} lights its engine in near vacuum.`,
  );

  // --- Second stage ------------------------------------------------------------
  const exhaust2 = stage2.ispS * G0;
  const flow2 = stage2.propellantMassKg / stage2.burnTimeS;
  let massKg = liftoffMassKg - stage1.propellantMassKg - stage1.dryMassKg;
  let propellantKg = stage2.propellantMassKg;
  let deliveredMs = stage1DeltaV;
  let clock = stage2Ignition;

  /**
   * Fires the second stage until the delta-v delivered since liftoff reaches
   * `targetMs` or the propellant runs out. `place` sets altitude, speed and
   * downrange angle for a given fraction of the burn.
   */
  const burn = (targetMs: number, place: (fraction: number, deliveredNowMs: number) => void) => {
    const neededMs = Math.max(0, targetMs - deliveredMs);
    const availableMs = exhaust2 * Math.log(massKg / (massKg - propellantKg));
    const burnMs = Math.min(neededMs, availableMs);
    const duration = (massKg / flow2) * (1 - Math.exp(-burnMs / exhaust2));
    const tStart = clock;
    const startMs = deliveredMs;
    const STEPS = 24;
    for (let i = 1; i <= STEPS; i++) {
      const elapsed = (duration * i) / STEPS;
      const nowMs = startMs + exhaust2 * Math.log(massKg / (massKg - flow2 * elapsed));
      fuel2 = Math.max(0, (propellantKg - flow2 * elapsed) / stage2.propellantMassKg);
      place(neededMs === 0 ? 1 : (nowMs - startMs) / neededMs, nowMs);
      sample(tStart + elapsed, 2);
    }
    massKg -= flow2 * duration;
    propellantKg = Math.max(0, propellantKg - flow2 * duration);
    deliveredMs = startMs + burnMs;
    clock = tStart + duration;
    return {
      tStart,
      tEnd: clock,
      complete: availableMs >= neededMs,
      fraction: neededMs === 0 ? 1 : burnMs / neededMs,
      shortMs: neededMs - burnMs,
    };
  };

  /** Lets time pass with the engines off. `place` gets the fraction of the coast. */
  const coast = (duration: number, steps: number, place: (fraction: number) => void) => {
    const tStart = clock;
    for (let i = 1; i <= steps; i++) {
      place(i / steps);
      sample(tStart + (duration * i) / steps, 0);
    }
    clock = tStart + duration;
    return { tStart, tEnd: clock };
  };

  const insertion = burn(insertionDeltaV, (_fraction, nowMs) => ascentTo(nowMs));
  phase('insertion_burn', 'Second stage burn', insertion.tStart, insertion.tEnd);

  const noseEventTime = insertion.tStart + Math.min(25, (insertion.tEnd - insertion.tStart) / 3);
  if (rocket.payloadBay === 'fairing') {
    if (crewOnly) {
      event(
        'fairing_separation',
        noseEventTime,
        'info',
        'Escape tower jettisoned',
        'Above the atmosphere the launch escape tower is no longer needed and is dropped to save weight.',
      );
    } else {
      event(
        'fairing_separation',
        noseEventTime,
        'info',
        'Fairing separation',
        'Above the atmosphere the nose fairing no longer has air to protect the payload from, so it is dropped to save weight.',
      );
    }
  }

  if (!insertion.complete) {
    event(
      'propellant_depleted',
      insertion.tEnd,
      'danger',
      'Propellant depleted',
      `The ${lowerFirst(stage2.name)} runs dry at ${formatSpeed(velocityMs)}, with ${formatSpeed(insertion.shortMs)} of delta-v still missing to stay in orbit.`,
    );

    // Ballistic arc: the vehicle keeps climbing for a while, then falls back.
    const last = telemetry[telemetry.length - 1];
    const previous = telemetry[telemetry.length - 2];
    const climbRateKmS =
      last && previous && last.t > previous.t
        ? Math.max(0, (last.altitudeKm - previous.altitudeKm) / (last.t - previous.t))
        : 0;
    // Close to orbital speed the vehicle falls "around" the Earth, so it
    // comes down more slowly.
    const fallKmS2 = 0.0095 * Math.max(0.15, 1 - (velocityMs / insertionSpeedMs) ** 2);
    const burnoutAltitudeKm = altitudeKm;
    const burnoutSpeedMs = velocityMs;
    const timeToApogee = climbRateKmS / fallKmS2;
    const apogeeKm = burnoutAltitudeKm + climbRateKmS ** 2 / (2 * fallKmS2);
    const reentryAltitudeKm = Math.min(apogeeKm, REENTRY_ALTITUDE_KM);
    const timeToReentry = Math.min(
      1_800,
      Math.max(30, timeToApogee + Math.sqrt((2 * (apogeeKm - reentryAltitudeKm)) / fallKmS2)),
    );
    const startAngle = downrangeDeg;
    const ballistic = coast(timeToReentry, 16, (x) => {
      const elapsed = timeToReentry * x;
      const arc = burnoutAltitudeKm + climbRateKmS * elapsed - 0.5 * fallKmS2 * elapsed ** 2;
      altitudeKm = Math.max(reentryAltitudeKm, arc);
      if (x === 1) altitudeKm = reentryAltitudeKm;
      velocityMs = burnoutSpeedMs * (1 - 0.05 * Math.sin(Math.PI * x));
      downrangeDeg = startAngle + (burnoutSpeedMs / 7_800) * 0.066 * elapsed;
    });
    phase('ballistic', 'Ballistic coast', ballistic.tStart, ballistic.tEnd);
    event(
      'reentry',
      ballistic.tEnd,
      'danger',
      'Re-entry',
      `Too slow to stay in orbit, the vehicle falls back into the atmosphere at ${formatSpeed(velocityMs)}.`,
    );
    const reentryAngle = downrangeDeg;
    const reentry = coast(90, 9, (x) => {
      altitudeKm = reentryAltitudeKm + (30 - reentryAltitudeKm) * x;
      velocityMs = burnoutSpeedMs * (1 - 0.75 * x);
      downrangeDeg = reentryAngle + 3 * x;
    });
    phase('reentry', 'Re-entry', reentry.tStart, reentry.tEnd);
    event(
      'breakup',
      reentry.tStart + 40,
      'danger',
      'Breakup',
      crewed
        ? 'The capsule separates and turns its heat shield forward. Behind it, friction with the air breaks the empty stage apart.'
        : 'Friction with the air heats the vehicle until it breaks apart and burns up.',
    );
    event(
      'mission_lost',
      reentry.tEnd - 5,
      'danger',
      'Mission lost',
      crewed
        ? 'The capsule lands under parachutes, far from the planned zone. The crew is safe, but the mission never reached orbit.'
        : `The ${payloadNames} never reached orbit.`,
    );
    return finish(reentry.tEnd, 'reentry');
  }

  const propellantLeft = () => formatPercent(propellantKg / stage2.propellantMassKg);

  if (plan.transfer) {
    const transfer = plan.transfer;
    event(
      'parking_orbit',
      insertion.tEnd,
      'info',
      'Parking orbit',
      `Engine cutoff. The vehicle is in a temporary orbit at ${formatAltitude(insertionAltitudeKm)}, coasting to the point where it will raise it. ${propellantLeft()} of the second stage propellant is left.`,
    );

    // Coast for part of a lap in the parking orbit.
    const parkingLap = 0.3;
    const parkingStartAngle = downrangeDeg;
    const parking = coast(
      2 * halfPeriodS(insertionAltitudeKm, insertionAltitudeKm) * parkingLap,
      10,
      (x) => {
        downrangeDeg = parkingStartAngle + 360 * parkingLap * x;
      },
    );
    phase('parking_coast', 'Parking orbit', parking.tStart, parking.tEnd);

    // Injection burn: stretches the orbit up to the target altitude.
    const perigeeSpeedMs = ellipticalSpeedMs(
      insertionAltitudeKm,
      insertionAltitudeKm,
      transfer.apogeeAltitudeKm,
    );
    event(
      'transfer_burn',
      clock,
      'info',
      'Transfer burn',
      `The second stage restarts to stretch the orbit up to ${formatAltitude(transfer.apogeeAltitudeKm)}.`,
    );
    const burnStartAngle = downrangeDeg;
    const injection = burn(insertionDeltaV + transfer.injectionDeltaVMs, (fraction) => {
      velocityMs = insertionSpeedMs + (perigeeSpeedMs - insertionSpeedMs) * fraction;
      altitudeKm = insertionAltitudeKm * (1 + 0.08 * fraction);
      downrangeDeg = burnStartAngle + 14 * fraction;
    });
    phase('transfer_burn', 'Transfer burn', injection.tStart, injection.tEnd);

    if (!injection.complete) {
      const reachedApogeeKm =
        insertionAltitudeKm +
        (transfer.apogeeAltitudeKm - insertionAltitudeKm) * injection.fraction ** 1.6;
      event(
        'propellant_depleted',
        injection.tEnd,
        'danger',
        'Propellant depleted',
        `The ${lowerFirst(stage2.name)} runs dry in the middle of the transfer burn, ${formatSpeed(injection.shortMs)} of delta-v before its end.`,
      );
      const startAltitudeKm = altitudeKm;
      const startAngle = downrangeDeg;
      const drift = coast(1_500, 12, (x) => {
        altitudeKm = startAltitudeKm + (reachedApogeeKm - startAltitudeKm) * (1 - (1 - x) ** 1.7);
        velocityMs = ellipticalSpeedMs(altitudeKm, insertionAltitudeKm, reachedApogeeKm);
        downrangeDeg = startAngle + 90 * x;
      });
      phase('stranded', 'Stranded', drift.tStart, drift.tEnd);
      event(
        'stranded',
        drift.tEnd - 60,
        'danger',
        'Stranded in a low orbit',
        `The orbit only stretches up to about ${formatAltitude(roundAltitude(reachedApogeeKm))}, far below the ${formatAltitude(transfer.apogeeAltitudeKm)} of the target. ${strandedOutcome}`,
      );
      return finish(drift.tEnd, 'stranded');
    }

    event(
      'transfer_orbit',
      injection.tEnd,
      'info',
      'Transfer orbit',
      `Engine cutoff. The vehicle now coasts uphill to ${formatAltitude(transfer.apogeeAltitudeKm)}, trading speed for height. The climb takes ${formatDuration(halfPeriodS(insertionAltitudeKm, transfer.apogeeAltitudeKm))}.`,
    );

    // Coast from perigee to apogee: fast at the bottom, slow at the top.
    const CLIMB_EXPONENT = 1.7;
    const climbSpan = transfer.apogeeAltitudeKm - insertionAltitudeKm;
    const transferStartAngle = downrangeDeg;
    const transferCoast = coast(
      halfPeriodS(insertionAltitudeKm, transfer.apogeeAltitudeKm),
      40,
      (x) => {
        altitudeKm = insertionAltitudeKm + climbSpan * (1 - (1 - x) ** CLIMB_EXPONENT);
        velocityMs = ellipticalSpeedMs(altitudeKm, insertionAltitudeKm, transfer.apogeeAltitudeKm);
        downrangeDeg = transferStartAngle + 180 * (1 - (1 - x) ** 2.4);
      },
    );
    phase('transfer_coast', 'Coast to apogee', transferCoast.tStart, transferCoast.tEnd);

    const beltFraction =
      1 -
      (1 - (INNER_BELT_ALTITUDE_KM - insertionAltitudeKm) / climbSpan) ** (1 / CLIMB_EXPONENT);
    const beltTime =
      transferCoast.tStart + (transferCoast.tEnd - transferCoast.tStart) * beltFraction;
    if (evaluation.radiation.exposedCrew > 0) {
      event(
        'radiation_belts',
        beltTime,
        'warning',
        'Radiation alarm',
        'The capsule enters the Van Allen belts without shielding. The dose rate inside the cabin rises fast.',
      );
    } else if (totals.crew > 0) {
      event(
        'radiation_belts',
        beltTime,
        'info',
        'Radiation belts',
        'The capsule crosses the Van Allen belts. Its heavy shielding keeps the dose of the crew within limits.',
      );
    } else {
      event(
        'radiation_belts',
        beltTime,
        'info',
        'Radiation belts',
        'The vehicle crosses the Van Allen belts. The electronics of the payload are hardened against the radiation.',
      );
    }

    event(
      'apogee',
      transferCoast.tEnd,
      'info',
      'Apogee',
      `Highest point of the transfer orbit: ${formatAltitude(transfer.apogeeAltitudeKm)}. Speed has dropped to ${formatSpeed(velocityMs)}.`,
    );

    if (transfer.circularizationDeltaVMs > 0) {
      const apogeeSpeedMs = velocityMs;
      const finalSpeedMs = circularSpeedMs(transfer.apogeeAltitudeKm);
      event(
        'circularization_burn',
        clock + 1,
        'info',
        'Circularisation burn',
        'The engine fires once more to turn the oval transfer orbit into a circle.',
      );
      const circStartAngle = downrangeDeg;
      const circularization = burn(orbit.requiredDeltaVMs, (fraction) => {
        velocityMs = apogeeSpeedMs + (finalSpeedMs - apogeeSpeedMs) * fraction;
        downrangeDeg = circStartAngle + 6 * fraction;
      });
      phase(
        'circularization_burn',
        'Circularisation burn',
        circularization.tStart,
        circularization.tEnd,
      );

      if (!circularization.complete) {
        const reachedPerigeeKm =
          insertionAltitudeKm + climbSpan * circularization.fraction ** 1.6;
        event(
          'propellant_depleted',
          circularization.tEnd,
          'danger',
          'Propellant depleted',
          `The ${lowerFirst(stage2.name)} runs dry ${formatSpeed(circularization.shortMs)} of delta-v before the orbit is circular.`,
        );
        const startAngle = downrangeDeg;
        const drift = coast(1_200, 8, (x) => {
          downrangeDeg = startAngle + 10 * x;
        });
        phase('stranded', 'Stranded', drift.tStart, drift.tEnd);
        event(
          'stranded',
          drift.tEnd - 60,
          'danger',
          'Stranded in the transfer orbit',
          `The vehicle is left in an oval orbit that drops back to about ${formatAltitude(roundAltitude(reachedPerigeeKm))} on every lap. ${strandedOutcome}`,
        );
        return finish(drift.tEnd, 'stranded');
      }

      event(
        'orbit_insertion',
        circularization.tEnd,
        'success',
        'Orbit insertion',
        `Engine cutoff. ${orbit.shortName} reached: ${formatAltitude(transfer.apogeeAltitudeKm)} at ${formatSpeed(velocityMs)}. ${propellantLeft()} of the second stage propellant is left.`,
      );
    } else {
      event(
        'orbit_insertion',
        clock + 1,
        'success',
        'Target orbit confirmed',
        `The vehicle is in its ${lowerFirst(orbit.shortName)}: ${formatAltitude(transfer.apogeeAltitudeKm)} at the top and ${formatAltitude(insertionAltitudeKm)} at the bottom. ${propellantLeft()} of the second stage propellant is left.`,
      );
    }
  } else {
    event(
      'orbit_insertion',
      insertion.tEnd,
      'success',
      'Orbit insertion',
      `Engine cutoff. ${orbit.shortName} reached: ${formatAltitude(insertionAltitudeKm)} at ${formatSpeed(velocityMs)}. ${propellantLeft()} of the second stage propellant is left.`,
    );
  }

  // --- In orbit ------------------------------------------------------------------
  const operationsStartAngle = downrangeDeg;
  const operations = coast(300, 6, (x) => {
    downrangeDeg = operationsStartAngle + (plan.transfer ? 4 : 20) * x;
  });
  phase('orbit_operations', 'Orbit operations', operations.tStart, operations.tEnd);

  const deployTime = operations.tStart + 90;
  if (crewOnly) {
    event(
      'payload_deployed',
      deployTime,
      'info',
      'Capsule separation',
      `The ${payloadNames} flies free of the second stage. The crew reports all systems nominal.`,
    );
  } else if (rocket.payloadBay === 'internal') {
    event(
      'payload_deployed',
      deployTime,
      'info',
      'Payload deployed',
      `The cargo bay opens and releases the ${payloadNames}.`,
    );
  } else {
    event(
      'payload_deployed',
      deployTime,
      'info',
      'Payload deployed',
      `The ${payloadNames} separates from the second stage and flies free.`,
    );
  }

  const verdictTime = operations.tStart + 240;
  if (failure === 'radiation') {
    event(
      'radiation_alert',
      verdictTime,
      'danger',
      'Medical alert',
      `The crew of ${evaluation.radiation.exposedCrew} has absorbed a dangerous radiation dose in the Van Allen belts. Mission control orders an emergency return.`,
    );
    return finish(operations.tEnd, 'radiation');
  }
  if (failure === 'objective_unfulfilled') {
    event(
      'objective_missed',
      verdictTime,
      'danger',
      'Objective not met',
      'The flight was flawless, but the mission does not deliver what the contract asks for.',
    );
    return finish(operations.tEnd, 'objective_missed');
  }
  event('mission_success', verdictTime, 'success', 'Mission accomplished', level.epilogue);
  return finish(operations.tEnd, 'success');
}

/** Rounds an estimated altitude so it does not look more exact than it is. */
function roundAltitude(km: number): number {
  if (km >= 10_000) return Math.round(km / 1_000) * 1_000;
  if (km >= 1_000) return Math.round(km / 100) * 100;
  return Math.round(km / 10) * 10;
}

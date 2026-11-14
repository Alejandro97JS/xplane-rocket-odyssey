import type { RocketSpec } from './catalog/rockets.ts';

/** Standard gravity used by the rocket equation, in m/s². */
export const G0 = 9.81;
/** Gravitational parameter of the Earth, in km³/s². */
export const EARTH_MU = 398_600;
export const EARTH_RADIUS_KM = 6_371;

export interface StageDeltaV {
  readonly name: string;
  /** Mass of the whole vehicle when the stage ignites. */
  readonly startMassKg: number;
  /** Mass of the whole vehicle when the stage is empty, before it is dropped. */
  readonly endMassKg: number;
  readonly deltaVMs: number;
}

export interface DeltaVBudget {
  readonly liftoffMassKg: number;
  readonly stages: readonly [StageDeltaV, StageDeltaV];
  readonly totalMs: number;
}

/**
 * Tsiolkovsky rocket equation, applied to each stage in turn:
 *
 *   delta-v = Isp * g0 * ln(mass at ignition / mass at burnout)
 *
 * When the first stage is empty it is dropped, so the second stage starts
 * from a lighter vehicle. Applying the equation once to the whole launcher,
 * as if it kept its empty first stage to the end, underestimates every real
 * launcher so much that none of them would reach orbit.
 */
export function computeDeltaV(rocket: RocketSpec, payloadMassKg: number): DeltaVBudget {
  const liftoffMassKg = payloadMassKg + rocket.dryMassKg + rocket.propellantMassKg;
  let massKg = liftoffMassKg;
  const stages = rocket.stages.map((stage): StageDeltaV => {
    const startMassKg = massKg;
    const endMassKg = startMassKg - stage.propellantMassKg;
    massKg = endMassKg - stage.dryMassKg;
    return {
      name: stage.name,
      startMassKg,
      endMassKg,
      deltaVMs: stage.ispS * G0 * Math.log(startMassKg / endMassKg),
    };
  }) as [StageDeltaV, StageDeltaV];
  return { liftoffMassKg, stages, totalMs: stages[0].deltaVMs + stages[1].deltaVMs };
}

/** Speed of a circular orbit at the given altitude, in m/s. */
export function circularSpeedMs(altitudeKm: number): number {
  return Math.sqrt(EARTH_MU / (EARTH_RADIUS_KM + altitudeKm)) * 1000;
}

/** Vis-viva equation: speed at `altitudeKm` on an orbit with the given extremes, in m/s. */
export function ellipticalSpeedMs(
  altitudeKm: number,
  perigeeAltitudeKm: number,
  apogeeAltitudeKm: number,
): number {
  const r = EARTH_RADIUS_KM + altitudeKm;
  const semiMajorAxisKm = EARTH_RADIUS_KM + (perigeeAltitudeKm + apogeeAltitudeKm) / 2;
  return Math.sqrt(EARTH_MU * (2 / r - 1 / semiMajorAxisKm)) * 1000;
}

/** Time to go from perigee to apogee: half the orbital period, in seconds. */
export function halfPeriodS(perigeeAltitudeKm: number, apogeeAltitudeKm: number): number {
  const semiMajorAxisKm = EARTH_RADIUS_KM + (perigeeAltitudeKm + apogeeAltitudeKm) / 2;
  return Math.PI * Math.sqrt(semiMajorAxisKm ** 3 / EARTH_MU);
}

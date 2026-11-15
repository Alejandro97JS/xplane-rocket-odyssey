import { getLevel, type HardwareRequirement, type LevelSpec } from './catalog/levels.ts';
import { getOrbit, type OrbitSpec } from './catalog/orbits.ts';
import { getPayload, type PayloadSpec } from './catalog/payloads.ts';
import { getRocket, type RocketSpec } from './catalog/rockets.ts';
import { computeTotals, type CompleteDesign, type DesignTotals } from './design.ts';
import { agree, formatList, formatMass, formatSpeed, formatUsd, lowerFirst } from './format.ts';
import { HINTS } from './hints.ts';
import type { LevelId } from './ids.ts';
import { computeDeltaV, type DeltaVBudget } from './physics.ts';

/** Why a mission fails. Listed in the order the problems show up in a flight. */
export const FAILURE_CODES = [
  'budget_exceeded',
  'payload_overweight',
  'delta_v_shortage',
  'radiation',
  'objective_unfulfilled',
] as const;
export type FailureCode = (typeof FAILURE_CODES)[number];

export type CheckId = 'budget' | 'payload_mass' | 'delta_v' | 'radiation' | 'objective';

/** One rule of the launch, applied to a design. */
export interface Check {
  readonly id: CheckId;
  /** The failure this check causes when it does not pass. */
  readonly failureCode: FailureCode;
  readonly title: string;
  readonly passed: boolean;
  /** One or two sentences with the numbers behind the result. */
  readonly detail: string;
  /** Hints for the player. Empty when the check passes. */
  readonly hints: readonly string[];
}

export interface Evaluation {
  /** The contract, or null in free exploration. */
  readonly level: LevelSpec | null;
  readonly design: CompleteDesign;
  readonly rocket: RocketSpec;
  readonly orbit: OrbitSpec;
  readonly payloads: readonly PayloadSpec[];
  readonly totals: DesignTotals;
  /** Null in free exploration, which has no budget. */
  readonly budget: {
    readonly maxUsd: number;
    readonly totalUsd: number;
    /** Positive when the mission costs more than the budget. */
    readonly overUsd: number;
  } | null;
  readonly mass: {
    readonly payloadKg: number;
    readonly capacityKg: number;
    /** Positive when the payload is heavier than the rocket is rated for. */
    readonly overKg: number;
  };
  readonly deltaV: {
    readonly budget: DeltaVBudget;
    readonly requiredMs: number;
    /** Generated minus required. Negative when the rocket falls short. */
    readonly marginMs: number;
  };
  readonly radiation: {
    /** Capsules whose crew is not protected in the chosen orbit. */
    readonly exposedCapsules: readonly PayloadSpec[];
    readonly exposedCrew: number;
  };
  /** Null in free exploration, which has no contract objective. */
  readonly objective: {
    readonly missingHardware: readonly HardwareRequirement[];
    readonly orbitAccepted: boolean;
  } | null;
  /**
   * The checks that apply, in flight order: all five for a contract. Free
   * exploration has no budget and no objective, so only the three of physics.
   */
  readonly checks: readonly Check[];
  /** The first check that fails, which decides how the flight ends. */
  readonly failure: FailureCode | null;
}

/**
 * Applies the deterministic launch rules to a design. The same design always
 * gives the same evaluation.
 *
 * `levelId` is the contract, or null in free exploration. Without a contract
 * the cost of the design is never a problem and there is no objective to
 * meet: only the payload mass, the delta-v and the radiation are checked.
 */
export function evaluateMission(levelId: LevelId | null, design: CompleteDesign): Evaluation {
  const level = levelId === null ? null : getLevel(levelId);
  const rocket = getRocket(design.rocketId);
  const orbit = getOrbit(design.orbitId);
  const payloads = design.payloadIds.map(getPayload);
  const totals = computeTotals(design);

  const budget =
    level === null
      ? null
      : {
          maxUsd: level.maxBudgetUsd,
          totalUsd: totals.totalCostUsd,
          overUsd: totals.totalCostUsd - level.maxBudgetUsd,
        };
  const mass = {
    payloadKg: totals.payloadMassKg,
    capacityKg: rocket.maxLeoPayloadKg,
    overKg: totals.payloadMassKg - rocket.maxLeoPayloadKg,
  };
  const deltaVBudget = computeDeltaV(rocket, totals.payloadMassKg);
  const deltaV = {
    budget: deltaVBudget,
    requiredMs: orbit.requiredDeltaVMs,
    marginMs: deltaVBudget.totalMs - orbit.requiredDeltaVMs,
  };
  const exposedCapsules = orbit.radiationHazard
    ? payloads.filter((p) => p.crew > 0 && !p.radiationShielded)
    : [];
  const radiation = {
    exposedCapsules,
    exposedCrew: exposedCapsules.reduce((sum, p) => sum + p.crew, 0),
  };
  const objective =
    level === null
      ? null
      : {
          missingHardware: level.objective.hardware.filter(
            (requirement) => !requirement.anyOf.some((id) => design.payloadIds.includes(id)),
          ),
          orbitAccepted: level.objective.orbits.includes(orbit.id),
        };

  const checks: Check[] = [
    ...(budget === null ? [] : [budgetCheck(budget)]),
    massCheck(mass, rocket),
    deltaVCheck(deltaV, rocket, orbit),
    radiationCheck(radiation, totals, orbit, payloads),
    ...(level === null || objective === null ? [] : [objectiveCheck(objective, level, orbit)]),
  ];

  return {
    level,
    design,
    rocket,
    orbit,
    payloads,
    totals,
    budget,
    mass,
    deltaV,
    radiation,
    objective,
    checks,
    failure: checks.find((check) => !check.passed)?.failureCode ?? null,
  };
}

function budgetCheck(budget: NonNullable<Evaluation['budget']>): Check {
  const passed = budget.overUsd <= 0;
  return {
    id: 'budget',
    failureCode: 'budget_exceeded',
    title: 'Budget',
    passed,
    detail: passed
      ? `The mission costs ${formatUsd(budget.totalUsd)} of the ${formatUsd(budget.maxUsd)} budget. ${formatUsd(-budget.overUsd)} is left.`
      : `The mission costs ${formatUsd(budget.totalUsd)}, which is ${formatUsd(budget.overUsd)} over the ${formatUsd(budget.maxUsd)} budget.`,
    hints: passed ? [] : [HINTS.budget_exceeded],
  };
}

function massCheck(mass: Evaluation['mass'], rocket: RocketSpec): Check {
  const passed = mass.overKg <= 0;
  return {
    id: 'payload_mass',
    failureCode: 'payload_overweight',
    title: 'Payload mass',
    passed,
    detail: passed
      ? `The payload weighs ${formatMass(mass.payloadKg)}. ${rocket.shortName} is rated for ${formatMass(mass.capacityKg)}.`
      : `The payload weighs ${formatMass(mass.payloadKg)}, but ${rocket.shortName} is rated for ${formatMass(mass.capacityKg)}: ${formatMass(mass.overKg)} too much.`,
    hints: passed ? [] : [HINTS.payload_overweight],
  };
}

function deltaVCheck(deltaV: Evaluation['deltaV'], rocket: RocketSpec, orbit: OrbitSpec): Check {
  const passed = deltaV.marginMs >= 0;
  const generated = formatSpeed(deltaV.budget.totalMs);
  const required = formatSpeed(deltaV.requiredMs);
  return {
    id: 'delta_v',
    failureCode: 'delta_v_shortage',
    title: 'Delta-v',
    passed,
    detail: passed
      ? `With this payload ${rocket.shortName} generates ${generated}. ${orbit.shortName} needs ${required}, so ${formatSpeed(deltaV.marginMs)} is left in reserve.`
      : `With this payload ${rocket.shortName} generates ${generated}. ${orbit.shortName} needs ${required}: ${formatSpeed(-deltaV.marginMs)} short.`,
    hints: passed ? [] : [HINTS.delta_v_shortage],
  };
}

function radiationCheck(
  radiation: Evaluation['radiation'],
  totals: DesignTotals,
  orbit: OrbitSpec,
  payloads: readonly PayloadSpec[],
): Check {
  const passed = radiation.exposedCapsules.length === 0;
  let detail: string;
  if (!passed) {
    const capsules = formatList(radiation.exposedCapsules.map((p) => lowerFirst(p.shortName)));
    const has = agree(radiation.exposedCapsules.length, 'has', 'have');
    detail = `${orbit.shortName} is exposed to the Van Allen radiation belts and the ${capsules} ${has} no shielding.`;
  } else if (totals.crew === 0) {
    detail = 'No crew on board, and the electronics of the payload are hardened against radiation.';
  } else if (!orbit.radiationHazard) {
    detail = `${orbit.shortName} stays below the Van Allen radiation belts, so the crew is safe.`;
  } else {
    const shielded = payloads.find((p) => p.radiationShielded);
    detail = `${orbit.shortName} is exposed to the Van Allen radiation belts, but the ${lowerFirst(shielded?.shortName ?? 'capsule')} protects its crew.`;
  }
  return {
    id: 'radiation',
    failureCode: 'radiation',
    title: 'Crew radiation',
    passed,
    detail,
    hints: passed ? [] : [HINTS.radiation],
  };
}

function objectiveCheck(
  objective: NonNullable<Evaluation['objective']>,
  level: LevelSpec,
  orbit: OrbitSpec,
): Check {
  const hardwareOk = objective.missingHardware.length === 0;
  const passed = hardwareOk && objective.orbitAccepted;
  const sentences: string[] = [];
  const hints: string[] = [];
  if (!hardwareOk) {
    const missing = formatList(objective.missingHardware.map((r) => r.label));
    sentences.push(`The contract needs ${missing}, and the payload does not include it.`);
    hints.push(HINTS.objective_hardware);
  }
  if (!objective.orbitAccepted) {
    sentences.push(
      `${orbit.shortName} does not serve this contract. ${level.objective.orbitReason}`,
    );
    hints.push(HINTS.objective_orbit);
  }
  return {
    id: 'objective',
    failureCode: 'objective_unfulfilled',
    title: 'Contract objective',
    passed,
    detail: passed
      ? `The payload and the ${lowerFirst(orbit.shortName)} give the client what the contract asks for.`
      : sentences.join(' '),
    hints,
  };
}

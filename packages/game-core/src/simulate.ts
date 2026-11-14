import type { CompleteDesign } from './design.ts';
import { buildFlight, type Flight } from './flight.ts';
import type { LevelId } from './ids.ts';
import { buildReport, type MissionReport } from './report.ts';
import { evaluateMission, type Evaluation, type FailureCode } from './rules.ts';
import { computeScore, type Score } from './score.ts';

export interface SimulationResult {
  readonly outcome: 'success' | 'failure';
  /** The cause of the failure, or null after a success. */
  readonly failure: FailureCode | null;
  /** The rules applied to the design, with the numbers behind each one. */
  readonly evaluation: Evaluation;
  /** Events, phases and telemetry for the canvas and the event log. */
  readonly flight: Flight;
  /** The written explanation. */
  readonly report: MissionReport;
  /** Null after a failure, and always in free exploration. */
  readonly score: Score | null;
}

/**
 * Computes a whole launch before anything is animated. It is deterministic:
 * the same level and design always give the same result.
 *
 * `levelId` is the contract, or null for a flight in free exploration.
 */
export function simulate(levelId: LevelId | null, design: CompleteDesign): SimulationResult {
  const evaluation = evaluateMission(levelId, design);
  const flight = buildFlight(evaluation);
  return {
    outcome: evaluation.failure === null ? 'success' : 'failure',
    failure: evaluation.failure,
    evaluation,
    flight,
    report: buildReport(evaluation, flight),
    score: computeScore(evaluation),
  };
}

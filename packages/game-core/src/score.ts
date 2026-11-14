import type { Evaluation } from './rules.ts';

export interface ScorePart {
  readonly id: 'objective' | 'budget' | 'margin';
  readonly label: string;
  readonly points: number;
  readonly maxPoints: number;
  readonly detail: string;
}

export interface Score {
  /** 0 to 100. */
  readonly total: number;
  /** 1 to 3. */
  readonly stars: 1 | 2 | 3;
  readonly parts: readonly ScorePart[];
}

const OBJECTIVE_POINTS = 60;
const BUDGET_POINTS = 25;
const MARGIN_POINTS = 15;
/** Share of the budget left unspent that earns every budget point. */
const FULL_BUDGET_SAVING = 0.3;
/** Delta-v reserve, as a share of the required delta-v, that earns every margin point. */
const FULL_DELTA_V_RESERVE = 0.1;
const THREE_STARS = 80;
const TWO_STARS = 65;

/**
 * Scores a successful mission. The two bonuses pull in opposite directions:
 * a cheaper rocket saves budget but leaves less delta-v in reserve.
 * A failed mission has no score.
 */
export function computeScore(evaluation: Evaluation): Score | null {
  if (evaluation.failure !== null) return null;

  const saved = -evaluation.budget.overUsd / evaluation.budget.maxUsd;
  const budgetPoints = Math.round(BUDGET_POINTS * clamp01(saved / FULL_BUDGET_SAVING));

  const reserve = evaluation.deltaV.marginMs / evaluation.deltaV.requiredMs;
  const marginPoints = Math.round(MARGIN_POINTS * clamp01(reserve / FULL_DELTA_V_RESERVE));

  const total = OBJECTIVE_POINTS + budgetPoints + marginPoints;
  return {
    total,
    stars: total >= THREE_STARS ? 3 : total >= TWO_STARS ? 2 : 1,
    parts: [
      {
        id: 'objective',
        label: 'Contract fulfilled',
        points: OBJECTIVE_POINTS,
        maxPoints: OBJECTIVE_POINTS,
        detail: 'The client got what the contract asked for.',
      },
      {
        id: 'budget',
        label: 'Budget saved',
        points: budgetPoints,
        maxPoints: BUDGET_POINTS,
        detail: `${Math.round(saved * 100)}% of the budget left unspent. 30% or more earns every point.`,
      },
      {
        id: 'margin',
        label: 'Propellant reserve',
        points: marginPoints,
        maxPoints: MARGIN_POINTS,
        detail: `${Math.round(reserve * 100)}% more delta-v than the orbit needs. 10% or more earns every point.`,
      },
    ],
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

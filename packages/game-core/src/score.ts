import { getLevel } from './catalog/levels.ts';
import { ORBITS } from './catalog/orbits.ts';
import { PAYLOADS } from './catalog/payloads.ts';
import { ROCKETS } from './catalog/rockets.ts';
import type { CompleteDesign } from './design.ts';
import { formatPercent, formatUsd } from './format.ts';
import type { LevelId, PayloadId } from './ids.ts';
import { evaluateMission, type Evaluation } from './rules.ts';

export interface ScorePart {
  readonly id: 'objective' | 'budget' | 'margin';
  readonly label: string;
  /** With one decimal. A part that falls short of its maximum never shows the maximum. */
  readonly points: number;
  readonly maxPoints: number;
  readonly detail: string;
}

export interface Score {
  /**
   * 0 to 100: the sum of the parts, rounded to the nearest integer. Only the
   * optimal design of the level reaches 100; any other design gets 99 at most.
   */
  readonly total: number;
  /** 1 to 3. */
  readonly stars: 1 | 2 | 3;
  /** True when this is the optimal design of the level. */
  readonly optimal: boolean;
  readonly parts: readonly ScorePart[];
}

/**
 * The best design of a level: of all the designs that fulfil the contract, the
 * cheapest one. Between designs of the same cost, the one with the most
 * delta-v left over.
 */
export interface OptimalDesign {
  readonly design: CompleteDesign;
  readonly totalUsd: number;
  /** Delta-v left over, as a share of the delta-v the orbit needs. */
  readonly reserve: number;
}

const OBJECTIVE_POINTS = 60;
const BUDGET_POINTS = 25;
const MARGIN_POINTS = 15;
const THREE_STARS = 80;
const TWO_STARS = 65;

/**
 * Scores a successful mission against the optimal design of its level. The
 * optimal design earns every point, 100 in total. Any other design falls short
 * of it in money saved or in delta-v reserve, so its total is rounded to the
 * nearest integer but kept at 99 or less. A failed mission has no score.
 *
 * A flight in free exploration has no score either: with no contract and no
 * budget there is no optimal design to measure it against.
 */
export function computeScore(evaluation: Evaluation): Score | null {
  const { level, budget } = evaluation;
  if (evaluation.failure !== null || level === null || budget === null) return null;

  // The search covers every design, this one included, so it always finds one.
  const best = findOptimalDesign(level.id);
  if (best === null) throw new Error(`No optimal design for level ${level.id}`);

  const maxUsd = budget.maxUsd;
  const saved = maxUsd - budget.totalUsd;
  const bestSaved = maxUsd - best.totalUsd;
  const budgetPoints = pointsAgainstBest(BUDGET_POINTS, saved, bestSaved);

  const reserve = reserveOf(evaluation);
  const marginPoints = pointsAgainstBest(MARGIN_POINTS, reserve, best.reserve);

  const optimal = budgetPoints === BUDGET_POINTS && marginPoints === MARGIN_POINTS;
  const total = roundTotal(OBJECTIVE_POINTS + budgetPoints + marginPoints, optimal);

  const savedSentence = `${formatUsd(saved)} of the budget left unspent.`;
  // One decimal, so a reserve just below the best one does not read the same.
  const reserveSentence = `${formatPercent(reserve, 1)} more delta-v than the orbit needs.`;
  const bestReserve = formatPercent(best.reserve, 1);
  let marginDetail: string;
  if (optimal) {
    marginDetail = `${reserveSentence} No other design at this cost keeps as much.`;
  } else if (reserve >= best.reserve) {
    marginDetail = `${reserveSentence} The best design keeps ${bestReserve}, so this earns every point.`;
  } else {
    marginDetail = `${reserveSentence} The best design keeps ${bestReserve}.`;
  }

  return {
    total,
    stars: total >= THREE_STARS ? 3 : total >= TWO_STARS ? 2 : 1,
    optimal,
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
        points: toTenths(budgetPoints, BUDGET_POINTS),
        maxPoints: BUDGET_POINTS,
        detail:
          saved >= bestSaved
            ? `${savedSentence} No design that fulfils this contract costs less.`
            : `${savedSentence} The cheapest design that fulfils this contract leaves ${formatUsd(bestSaved)}.`,
      },
      {
        id: 'margin',
        label: 'Propellant reserve',
        points: toTenths(marginPoints, MARGIN_POINTS),
        maxPoints: MARGIN_POINTS,
        detail: marginDetail,
      },
    ],
  };
}

/**
 * The total shown to the player: the exact sum of the parts rounded to the
 * nearest integer. Only the optimal design shows 100, so any other design
 * stays at 99 even from 99.5 up.
 */
export function roundTotal(exactTotal: number, optimal: boolean): number {
  return optimal ? 100 : Math.min(99, Math.round(exactTotal));
}

/**
 * Every point when `value` matches or beats the optimal design. Below it, the
 * points are proportional to how close it comes, without rounding.
 */
function pointsAgainstBest(maxPoints: number, value: number, best: number): number {
  if (value >= best) return maxPoints;
  if (best <= 0) return 0;
  return (maxPoints * Math.max(0, value)) / best;
}

/** Rounds to one decimal, but a part short of its maximum never shows the maximum. */
function toTenths(points: number, maxPoints: number): number {
  if (points >= maxPoints) return maxPoints;
  return Math.min(Math.round(points * 10) / 10, maxPoints - 0.1);
}

function reserveOf(evaluation: Evaluation): number {
  return evaluation.deltaV.marginMs / evaluation.deltaV.requiredMs;
}

function isBetter(candidate: OptimalDesign, current: OptimalDesign): boolean {
  if (candidate.totalUsd !== current.totalUsd) return candidate.totalUsd < current.totalUsd;
  return candidate.reserve > current.reserve;
}

const optimalByLevel = new Map<LevelId, OptimalDesign | null>();

/**
 * The optimal design of a level, or null when no design fulfils its contract.
 * It is found by trying every set of payloads with every orbit and rocket, and
 * kept after the first call.
 */
export function findOptimalDesign(levelId: LevelId): OptimalDesign | null {
  if (!optimalByLevel.has(levelId)) optimalByLevel.set(levelId, searchOptimalDesign(levelId));
  return optimalByLevel.get(levelId) ?? null;
}

function searchOptimalDesign(levelId: LevelId): OptimalDesign | null {
  const maxUsd = getLevel(levelId).maxBudgetUsd;
  const cheapestRocketUsd = Math.min(...ROCKETS.map((r) => r.costUsd));
  let best: OptimalDesign | null = null;

  // Payload sets are built in catalog order, so every set is tried once. Adding
  // a payload only adds cost, so a set that leaves no money for the cheapest
  // rocket is not extended.
  const visit = (start: number, payloadIds: readonly PayloadId[], payloadUsd: number) => {
    if (payloadIds.length > 0) {
      for (const rocket of ROCKETS) {
        if (payloadUsd + rocket.costUsd > maxUsd) continue;
        for (const orbit of ORBITS) {
          const evaluation = evaluateMission(levelId, {
            payloadIds: [...payloadIds],
            orbitId: orbit.id,
            rocketId: rocket.id,
          });
          if (evaluation.failure !== null) continue;
          const candidate: OptimalDesign = {
            design: evaluation.design,
            totalUsd: evaluation.totals.totalCostUsd,
            reserve: reserveOf(evaluation),
          };
          if (best === null || isBetter(candidate, best)) best = candidate;
        }
      }
    }
    for (let i = start; i < PAYLOADS.length; i++) {
      const payload = PAYLOADS[i]!;
      const usd = payloadUsd + payload.costUsd;
      if (usd + cheapestRocketUsd > maxUsd) continue;
      visit(i + 1, [...payloadIds, payload.id], usd);
    }
  };

  visit(0, [], 0);
  return best;
}

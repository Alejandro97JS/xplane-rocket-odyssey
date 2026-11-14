import { z } from 'zod';
import { getLevel } from './catalog/levels.ts';
import {
  CompleteDesignSchema,
  computeTotals,
  DesignSchema,
  EMPTY_DESIGN,
  isCompleteDesign,
  type DesignTotals,
} from './design.ts';
import { LEVEL_IDS, LevelIdSchema, type LevelId } from './ids.ts';

export const STATE_VERSION = 1;

const LevelRecordSchema = z.object({
  attempts: z.number().int().nonnegative(),
  completed: z.boolean(),
  /** Best score of the successful attempts, or null when there is none. */
  bestScore: z.number().int().min(0).max(100).nullable(),
});
export type LevelRecord = z.infer<typeof LevelRecordSchema>;

/**
 * The whole game state. It is plain JSON, so it can be saved, sent over the
 * network and validated when it comes back.
 */
export const GameStateSchema = z.object({
  version: z.literal(STATE_VERSION),
  /** The contract being planned, or null before the player chooses one. */
  levelId: LevelIdSchema.nullable(),
  design: DesignSchema,
  /**
   * Total cost for which the player has already dismissed the over-budget
   * warning. The warning shows again when the cost changes.
   */
  budgetWarningDismissedAtUsd: z.number().nullable(),
  /**
   * The last launch. The simulation is deterministic, so its result is
   * recomputed from these two values instead of being stored.
   */
  launch: z
    .object({
      levelId: LevelIdSchema,
      design: CompleteDesignSchema,
      /** Counts launches, so replaying the same design is still a new launch. */
      sequence: z.number().int().positive(),
    })
    .nullable(),
  records: z.partialRecord(LevelIdSchema, LevelRecordSchema),
});
export type GameState = z.infer<typeof GameStateSchema>;

export function createInitialState(): GameState {
  return {
    version: STATE_VERSION,
    levelId: null,
    design: EMPTY_DESIGN,
    budgetWarningDismissedAtUsd: null,
    launch: null,
    records: {},
  };
}

/** Validates a state that comes from outside: storage, the network, a test. */
export function parseGameState(input: unknown): GameState {
  return GameStateSchema.parse(input);
}

// --- Selectors -------------------------------------------------------------------

export interface BudgetStatus {
  readonly maxUsd: number;
  readonly spentUsd: number;
  /** Negative when the design costs more than the budget. */
  readonly remainingUsd: number;
  readonly over: boolean;
}

/** Budget of the current contract, or null before one is chosen. */
export function selectBudget(state: GameState): BudgetStatus | null {
  if (state.levelId === null) return null;
  const maxUsd = getLevel(state.levelId).maxBudgetUsd;
  const spentUsd = computeTotals(state.design).totalCostUsd;
  return { maxUsd, spentUsd, remainingUsd: maxUsd - spentUsd, over: spentUsd > maxUsd };
}

export function selectTotals(state: GameState): DesignTotals {
  return computeTotals(state.design);
}

/**
 * True when the over-budget warning must be shown before the player moves
 * forward: the design is over budget and the player has not dismissed the
 * warning for this exact cost.
 */
export function selectNeedsBudgetWarning(state: GameState): boolean {
  const budget = selectBudget(state);
  return budget !== null && budget.over && state.budgetWarningDismissedAtUsd !== budget.spentUsd;
}

export type ReadinessItemId = 'mission' | 'payload' | 'orbit' | 'rocket';

export interface Readiness {
  readonly items: readonly {
    readonly id: ReadinessItemId;
    readonly label: string;
    readonly done: boolean;
  }[];
  /** 0 to 1. */
  readonly progress: number;
  readonly ready: boolean;
}

/** What is still missing before the mission can be launched. */
export function selectReadiness(state: GameState): Readiness {
  const items = [
    { id: 'mission', label: 'Mission', done: state.levelId !== null },
    { id: 'payload', label: 'Payload', done: state.design.payloadIds.length > 0 },
    { id: 'orbit', label: 'Orbit', done: state.design.orbitId !== null },
    { id: 'rocket', label: 'Rocket', done: state.design.rocketId !== null },
  ] as const;
  const done = items.filter((item) => item.done).length;
  return {
    items,
    progress: done / items.length,
    ready: state.levelId !== null && isCompleteDesign(state.design),
  };
}

const NO_RECORD: LevelRecord = Object.freeze({ attempts: 0, completed: false, bestScore: null });

export function selectRecord(state: GameState, levelId: LevelId): LevelRecord {
  return state.records[levelId] ?? NO_RECORD;
}

export function selectCompletedCount(state: GameState): number {
  return LEVEL_IDS.filter((id) => state.records[id]?.completed).length;
}

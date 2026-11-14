import { z } from 'zod';
import { computeTotals, EMPTY_DESIGN, isCompleteDesign, sortPayloadIds } from './design.ts';
import { LevelIdSchema, OrbitIdSchema, PayloadIdSchema, RocketIdSchema } from './ids.ts';
import { evaluateMission } from './rules.ts';
import { computeScore } from './score.ts';
import { createInitialState, selectRecord, type GameState } from './state.ts';

/** Everything the player can do. Actions are plain JSON, like the state. */
export const ActionSchema = z.discriminatedUnion('type', [
  /** Choose the contract to plan. The design is kept. */
  z.object({ type: z.literal('level/select'), levelId: LevelIdSchema }),
  /** Start a contract from a clean design. */
  z.object({ type: z.literal('level/start'), levelId: LevelIdSchema }),
  z.object({ type: z.literal('payload/toggle'), payloadId: PayloadIdSchema }),
  z.object({ type: z.literal('orbit/select'), orbitId: OrbitIdSchema }),
  z.object({ type: z.literal('rocket/select'), rocketId: RocketIdSchema }),
  z.object({ type: z.literal('design/reset') }),
  /** The player has read the over-budget warning and wants to go on. */
  z.object({ type: z.literal('budget/dismissWarning') }),
  z.object({ type: z.literal('mission/launch') }),
  z.object({ type: z.literal('game/reset') }),
]);
export type Action = z.infer<typeof ActionSchema>;

/** Validates an action that comes from outside: the UI, the network, a test. */
export function parseAction(input: unknown): Action {
  return ActionSchema.parse(input);
}

/**
 * The only way the game state changes. It is a pure function: it never
 * modifies `state` and always returns the same result for the same input.
 */
export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'level/select':
      if (state.levelId === action.levelId) return state;
      return { ...state, levelId: action.levelId };

    case 'level/start':
      return {
        ...state,
        levelId: action.levelId,
        design: EMPTY_DESIGN,
        budgetWarningDismissedAtUsd: null,
      };

    case 'payload/toggle': {
      const selected = state.design.payloadIds.includes(action.payloadId);
      const payloadIds = selected
        ? state.design.payloadIds.filter((id) => id !== action.payloadId)
        : sortPayloadIds([...state.design.payloadIds, action.payloadId]);
      return { ...state, design: { ...state.design, payloadIds } };
    }

    case 'orbit/select':
      if (state.design.orbitId === action.orbitId) return state;
      return { ...state, design: { ...state.design, orbitId: action.orbitId } };

    case 'rocket/select':
      if (state.design.rocketId === action.rocketId) return state;
      return { ...state, design: { ...state.design, rocketId: action.rocketId } };

    case 'design/reset':
      return { ...state, design: EMPTY_DESIGN, budgetWarningDismissedAtUsd: null };

    case 'budget/dismissWarning':
      return {
        ...state,
        budgetWarningDismissedAtUsd: computeTotals(state.design).totalCostUsd,
      };

    case 'mission/launch': {
      // A launch needs a contract and a complete design. Anything else is ignored.
      if (state.levelId === null || !isCompleteDesign(state.design)) return state;
      const evaluation = evaluateMission(state.levelId, state.design);
      const score = computeScore(evaluation);
      const record = selectRecord(state, state.levelId);
      return {
        ...state,
        launch: {
          levelId: state.levelId,
          design: state.design,
          sequence: (state.launch?.sequence ?? 0) + 1,
        },
        records: {
          ...state.records,
          [state.levelId]: {
            attempts: record.attempts + 1,
            completed: record.completed || score !== null,
            bestScore:
              score === null
                ? record.bestScore
                : Math.max(record.bestScore ?? 0, score.total),
          },
        },
      };
    }

    case 'game/reset':
      return createInitialState();
  }
}

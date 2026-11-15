import { z } from 'zod';
import { computeTotals, EMPTY_DESIGN, isCompleteDesign, sortPayloadIds } from './design.ts';
import {
  LevelIdSchema,
  OrbitIdSchema,
  PayloadIdSchema,
  PlayModeSchema,
  RocketIdSchema,
} from './ids.ts';
import { evaluateMission } from './rules.ts';
import { computeScore } from './score.ts';
import {
  createInitialState,
  selectIsFreeExploration,
  selectRecord,
  type GameState,
} from './state.ts';

/** Everything the player can do. Actions are plain JSON, like the state. */
export const ActionSchema = z.discriminatedUnion('type', [
  /**
   * Play contracts or explore freely. The design and the chosen contract are
   * kept, so the player can try a design without a budget and come back.
   */
  z.object({ type: z.literal('mode/select'), mode: PlayModeSchema }),
  /** Choose the contract to plan. The design is kept. Leaves free exploration. */
  z.object({ type: z.literal('level/select'), levelId: LevelIdSchema }),
  /** Start a contract from a clean design. Leaves free exploration. */
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
    case 'mode/select':
      if (state.mode === action.mode) return state;
      return { ...state, mode: action.mode };

    case 'level/select':
      if (state.mode === 'contract' && state.levelId === action.levelId) return state;
      return {
        ...state,
        mode: 'contract',
        levelId: action.levelId,
        // A warning read against the budget of another contract does not count for this one.
        budgetWarningDismissedAtUsd:
          state.levelId === action.levelId ? state.budgetWarningDismissedAtUsd : null,
      };

    case 'level/start':
      return {
        ...state,
        mode: 'contract',
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
      // A launch needs a complete design, and a contract or free exploration.
      // Anything else is ignored.
      if (!isCompleteDesign(state.design)) return state;
      const sequence = (state.launch?.sequence ?? 0) + 1;

      // Free exploration has no contract, so the flight counts for no record.
      if (selectIsFreeExploration(state)) {
        return { ...state, launch: { levelId: null, design: state.design, sequence } };
      }

      if (state.levelId === null) return state;
      const evaluation = evaluateMission(state.levelId, state.design);
      const score = computeScore(evaluation);
      const record = selectRecord(state, state.levelId);
      return {
        ...state,
        launch: {
          levelId: state.levelId,
          design: state.design,
          sequence,
        },
        records: {
          ...state.records,
          [state.levelId]: {
            attempts: record.attempts + 1,
            completed: record.completed || score !== null,
            bestScore:
              score === null ? record.bestScore : Math.max(record.bestScore ?? 0, score.total),
          },
        },
      };
    }

    case 'game/reset':
      return createInitialState();
  }
}

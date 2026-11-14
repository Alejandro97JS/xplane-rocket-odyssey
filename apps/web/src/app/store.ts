import {
  createInitialState,
  parseAction,
  reduce,
  simulate,
  type Action,
  type GameState,
  type SimulationResult,
} from '@rocket-odyssey/game-core';
import { useMemo } from 'react';
import { create } from 'zustand';

interface GameStore {
  state: GameState;
  dispatch: (action: Action) => void;
}

/**
 * A thin binding over the game-core reducer. It holds no rules of its own:
 * every change goes through `reduce`, and actions are validated on the way in.
 */
export const useGameStore = create<GameStore>((set) => ({
  state: createInitialState(),
  dispatch: (action) => set((store) => ({ state: reduce(store.state, parseAction(action)) })),
}));

/**
 * Reads a value derived from the game state. The component subscribes to the
 * whole state and derives the value while rendering, so selectors are free to
 * return new objects. The state is small and changes only on player actions.
 */
export function useGame<T>(selector: (state: GameState) => T): T {
  const state = useGameStore((store) => store.state);
  return selector(state);
}

export function useDispatch(): GameStore['dispatch'] {
  return useGameStore((store) => store.dispatch);
}

/**
 * Result of the last launch, or null before the first one. The simulation is
 * deterministic, so it is recomputed from the launch stored in the state.
 */
export function useLaunchResult(): SimulationResult | null {
  const launch = useGame((state) => state.launch);
  return useMemo(() => (launch ? simulate(launch.levelId, launch.design) : null), [launch]);
}

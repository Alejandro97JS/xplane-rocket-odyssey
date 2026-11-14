import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  parseAction,
  parseGameState,
  reduce,
  selectBudget,
  selectCompletedCount,
  selectNeedsBudgetWarning,
  selectReadiness,
  selectRecord,
  selectTotals,
  type Action,
  type GameState,
} from '../src/index.ts';

function play(actions: Action[], from: GameState = createInitialState()): GameState {
  return actions.reduce(reduce, from);
}

const LEVEL_1_WIN: Action[] = [
  { type: 'level/select', levelId: 'first_space_data' },
  { type: 'payload/toggle', payloadId: 'cubesat' },
  { type: 'orbit/select', orbitId: 'leo' },
  { type: 'rocket/select', rocketId: 'electron' },
];

describe('reduce', () => {
  it('starts with nothing chosen', () => {
    const state = createInitialState();
    expect(state.levelId).toBeNull();
    expect(state.design).toEqual({ payloadIds: [], orbitId: null, rocketId: null });
    expect(state.launch).toBeNull();
    expect(selectBudget(state)).toBeNull();
  });

  it('never modifies the state it receives', () => {
    const state = play(LEVEL_1_WIN);
    const frozen = JSON.stringify(state);
    reduce(state, { type: 'payload/toggle', payloadId: 'telecom' });
    reduce(state, { type: 'mission/launch' });
    reduce(state, { type: 'game/reset' });
    expect(JSON.stringify(state)).toBe(frozen);
  });

  it('toggles payloads and keeps them in catalog order', () => {
    let state = play([
      { type: 'payload/toggle', payloadId: 'station_core' },
      { type: 'payload/toggle', payloadId: 'cubesat' },
      { type: 'payload/toggle', payloadId: 'capsule_classic' },
    ]);
    expect(state.design.payloadIds).toEqual(['cubesat', 'capsule_classic', 'station_core']);

    state = reduce(state, { type: 'payload/toggle', payloadId: 'capsule_classic' });
    expect(state.design.payloadIds).toEqual(['cubesat', 'station_core']);
  });

  it('adds up mass, cost and crew', () => {
    const state = play([
      { type: 'payload/toggle', payloadId: 'capsule_classic' },
      { type: 'payload/toggle', payloadId: 'station_core' },
      { type: 'rocket/select', rocketId: 'falcon9' },
    ]);
    expect(selectTotals(state)).toEqual({
      payloadMassKg: 11_400,
      payloadCostUsd: 210_000_000,
      rocketCostUsd: 70_000_000,
      totalCostUsd: 280_000_000,
      crew: 3,
    });
  });

  it('keeps the design when the contract changes', () => {
    const state = play([...LEVEL_1_WIN, { type: 'level/select', levelId: 'human_horizon' }]);
    expect(state.levelId).toBe('human_horizon');
    expect(state.design.payloadIds).toEqual(['cubesat']);
    expect(state.design.rocketId).toBe('electron');
  });

  it('starts a contract from a clean design', () => {
    const state = play([...LEVEL_1_WIN, { type: 'level/start', levelId: 'human_horizon' }]);
    expect(state.levelId).toBe('human_horizon');
    expect(state.design).toEqual({ payloadIds: [], orbitId: null, rocketId: null });
  });

  it('tracks the budget of the contract', () => {
    const state = play(LEVEL_1_WIN);
    expect(selectBudget(state)).toEqual({
      maxUsd: 35_000_000,
      spentUsd: 26_500_000,
      remainingUsd: 8_500_000,
      over: false,
    });

    const over = reduce(state, { type: 'rocket/select', rocketId: 'soyuz' });
    expect(selectBudget(over)).toMatchObject({ remainingUsd: -33_000_000, over: true });
  });

  it('warns about the budget until the player dismisses it, and again when the cost changes', () => {
    let state = play(LEVEL_1_WIN);
    expect(selectNeedsBudgetWarning(state)).toBe(false);

    state = reduce(state, { type: 'rocket/select', rocketId: 'soyuz' });
    expect(selectNeedsBudgetWarning(state)).toBe(true);

    state = reduce(state, { type: 'budget/dismissWarning' });
    expect(selectNeedsBudgetWarning(state)).toBe(false);

    // A different cost, still over budget: the warning comes back.
    state = reduce(state, { type: 'rocket/select', rocketId: 'falcon9' });
    expect(selectNeedsBudgetWarning(state)).toBe(true);
  });

  it('reports what is missing before a launch', () => {
    const empty = selectReadiness(createInitialState());
    expect(empty.ready).toBe(false);
    expect(empty.progress).toBe(0);

    const half = selectReadiness(play(LEVEL_1_WIN.slice(0, 2)));
    expect(half.progress).toBe(0.5);
    expect(half.items.filter((item) => !item.done).map((item) => item.id)).toEqual([
      'orbit',
      'rocket',
    ]);

    const ready = selectReadiness(play(LEVEL_1_WIN));
    expect(ready).toMatchObject({ ready: true, progress: 1 });
  });

  it('ignores a launch while the design is incomplete', () => {
    const state = play(LEVEL_1_WIN.slice(0, 3));
    expect(reduce(state, { type: 'mission/launch' })).toBe(state);
    expect(reduce(createInitialState(), { type: 'mission/launch' }).launch).toBeNull();
  });

  it('records a successful launch', () => {
    const state = play([...LEVEL_1_WIN, { type: 'mission/launch' }]);
    expect(state.launch).toEqual({
      levelId: 'first_space_data',
      design: { payloadIds: ['cubesat'], orbitId: 'leo', rocketId: 'electron' },
      sequence: 1,
    });
    expect(selectRecord(state, 'first_space_data')).toEqual({
      attempts: 1,
      completed: true,
      bestScore: 100,
    });
    expect(selectCompletedCount(state)).toBe(1);
  });

  it('records a failed launch without completing the level', () => {
    const state = play([
      ...LEVEL_1_WIN,
      { type: 'orbit/select', orbitId: 'geo' },
      { type: 'mission/launch' },
    ]);
    expect(selectRecord(state, 'first_space_data')).toEqual({
      attempts: 1,
      completed: false,
      bestScore: null,
    });
    expect(selectCompletedCount(state)).toBe(0);
  });

  it('keeps the best score and counts every attempt', () => {
    const state = play([
      { type: 'level/select', levelId: 'connecting_the_continent' },
      { type: 'payload/toggle', payloadId: 'telecom' },
      { type: 'orbit/select', orbitId: 'geo' },
      { type: 'rocket/select', rocketId: 'falcon9' },
      { type: 'mission/launch' },
      { type: 'rocket/select', rocketId: 'starship' },
      { type: 'mission/launch' },
      { type: 'rocket/select', rocketId: 'soyuz' },
      { type: 'mission/launch' },
    ]);
    expect(selectRecord(state, 'connecting_the_continent')).toEqual({
      attempts: 3,
      completed: true,
      bestScore: 97,
    });
    expect(state.launch?.sequence).toBe(3);
  });

  it('resets the design or the whole game', () => {
    const launched = play([...LEVEL_1_WIN, { type: 'mission/launch' }]);

    const cleared = reduce(launched, { type: 'design/reset' });
    expect(cleared.design).toEqual({ payloadIds: [], orbitId: null, rocketId: null });
    expect(cleared.levelId).toBe('first_space_data');
    expect(cleared.records).toEqual(launched.records);

    expect(reduce(launched, { type: 'game/reset' })).toEqual(createInitialState());
  });
});

describe('serialization', () => {
  it('round-trips the state through JSON', () => {
    const state = play([...LEVEL_1_WIN, { type: 'mission/launch' }]);
    expect(parseGameState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(parseGameState(JSON.parse(JSON.stringify(createInitialState())))).toEqual(
      createInitialState(),
    );
  });

  it('rejects a state that is not valid', () => {
    const state = createInitialState();
    // Version 1 had no play mode.
    expect(() => parseGameState({ ...state, version: 1 })).toThrow();
    expect(() => parseGameState({ ...state, mode: 'sandbox' })).toThrow();
    expect(() => parseGameState({ ...state, levelId: 'moon_base' })).toThrow();
    expect(() =>
      parseGameState({ ...state, design: { ...state.design, payloadIds: ['cubesat', 'cubesat'] } }),
    ).toThrow();
    expect(() => parseGameState(null)).toThrow();
  });

  it('validates actions', () => {
    expect(parseAction({ type: 'orbit/select', orbitId: 'geo' })).toEqual({
      type: 'orbit/select',
      orbitId: 'geo',
    });
    expect(() => parseAction({ type: 'orbit/select', orbitId: 'moon' })).toThrow();
    expect(() => parseAction({ type: 'cheat/win' })).toThrow();
  });
});

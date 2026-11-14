import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  evaluateMission,
  FREE_EXPLORATION,
  parseAction,
  parseGameState,
  reduce,
  selectBudget,
  selectHasMission,
  selectIsFreeExploration,
  selectNeedsBudgetWarning,
  selectReadiness,
  simulate,
  type Action,
  type CompleteDesign,
  type GameState,
  type OrbitId,
  type PayloadId,
  type RocketId,
} from '../src/index.ts';

function play(actions: Action[], from: GameState = createInitialState()): GameState {
  return actions.reduce(reduce, from);
}

function design(payloadIds: PayloadId[], orbitId: OrbitId, rocketId: RocketId): CompleteDesign {
  return { payloadIds, orbitId, rocketId };
}

const EXPLORE: Action = { type: 'mode/select', mode: 'free_exploration' };

/** A whole station with a shielded crew on the most expensive rocket: almost $2 billion. */
const GRAND_DESIGN = design(
  ['capsule_shielded', 'station_core', 'station_lab', 'station_habitat'],
  'leo',
  'saturn5',
);

const GRAND_ACTIONS: Action[] = [
  EXPLORE,
  ...GRAND_DESIGN.payloadIds.map((payloadId): Action => ({ type: 'payload/toggle', payloadId })),
  { type: 'orbit/select', orbitId: GRAND_DESIGN.orbitId },
  { type: 'rocket/select', rocketId: GRAND_DESIGN.rocketId },
];

describe('free exploration: state', () => {
  it('starts in contract mode', () => {
    const state = createInitialState();
    expect(state.mode).toBe('contract');
    expect(selectIsFreeExploration(state)).toBe(false);
    expect(selectHasMission(state)).toBe(false);
  });

  it('counts as choosing the mission, so the other steps can be planned', () => {
    const state = play([EXPLORE]);
    expect(selectIsFreeExploration(state)).toBe(true);
    expect(selectHasMission(state)).toBe(true);
    const readiness = selectReadiness(state);
    expect(readiness.items.find((item) => item.id === 'mission')?.done).toBe(true);
    expect(readiness.progress).toBe(0.25);
    expect(readiness.ready).toBe(false);

    expect(selectReadiness(play(GRAND_ACTIONS))).toMatchObject({ ready: true, progress: 1 });
  });

  it('has no budget, so it never warns about the cost', () => {
    const state = play(GRAND_ACTIONS);
    expect(selectBudget(state)).toBeNull();
    expect(selectNeedsBudgetWarning(state)).toBe(false);
  });

  it('keeps the design and the contract when the player switches mode', () => {
    const planned = play([
      { type: 'level/select', levelId: 'first_space_data' },
      { type: 'payload/toggle', payloadId: 'telecom' },
      { type: 'rocket/select', rocketId: 'falcon9' },
    ]);
    expect(selectBudget(planned)?.over).toBe(true);

    // The same design, without a budget.
    const exploring = reduce(planned, EXPLORE);
    expect(exploring.design).toEqual(planned.design);
    expect(exploring.levelId).toBe('first_space_data');
    expect(selectBudget(exploring)).toBeNull();

    // Back to the contract, where the budget applies again.
    const back = reduce(exploring, { type: 'mode/select', mode: 'contract' });
    expect(back.levelId).toBe('first_space_data');
    expect(selectBudget(back)?.over).toBe(true);
  });

  it('is left when the player chooses a contract', () => {
    const state = play([EXPLORE, { type: 'level/select', levelId: 'human_horizon' }]);
    expect(state.mode).toBe('contract');
    expect(state.levelId).toBe('human_horizon');

    // Choosing the contract that was already chosen also leaves free exploration.
    const again = play([EXPLORE], state);
    expect(reduce(again, { type: 'level/select', levelId: 'human_horizon' }).mode).toBe('contract');
    expect(play([EXPLORE, { type: 'level/start', levelId: 'orbital_outpost' }], state).mode).toBe(
      'contract',
    );
  });

  it('returns the same state when nothing changes', () => {
    const state = play([EXPLORE]);
    expect(reduce(state, EXPLORE)).toBe(state);
  });

  it('launches without a contract and leaves the records of the contracts alone', () => {
    const contract = play([
      { type: 'level/select', levelId: 'first_space_data' },
      { type: 'payload/toggle', payloadId: 'cubesat' },
      { type: 'orbit/select', orbitId: 'leo' },
      { type: 'rocket/select', rocketId: 'electron' },
      { type: 'mission/launch' },
    ]);
    const state = play([EXPLORE, { type: 'mission/launch' }], contract);
    expect(state.launch).toEqual({
      levelId: null,
      design: { payloadIds: ['cubesat'], orbitId: 'leo', rocketId: 'electron' },
      sequence: 2,
    });
    expect(state.records).toEqual(contract.records);
  });

  it('ignores a launch while the design is incomplete', () => {
    const state = play(GRAND_ACTIONS.slice(0, -1));
    expect(reduce(state, { type: 'mission/launch' })).toBe(state);
  });

  it('survives JSON and validates the mode', () => {
    const state = play([...GRAND_ACTIONS, { type: 'mission/launch' }]);
    expect(parseGameState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(parseAction(EXPLORE)).toEqual(EXPLORE);
    expect(() => parseAction({ type: 'mode/select', mode: 'god_mode' })).toThrow();
  });
});

describe('free exploration: the flight', () => {
  it('checks only the rules of physics', () => {
    const evaluation = evaluateMission(null, GRAND_DESIGN);
    expect(evaluation.level).toBeNull();
    expect(evaluation.budget).toBeNull();
    expect(evaluation.objective).toBeNull();
    expect(evaluation.checks.map((check) => check.id)).toEqual([
      'payload_mass',
      'delta_v',
      'radiation',
    ]);
  });

  it('flies a design of any cost', () => {
    const result = simulate(null, GRAND_DESIGN);
    expect(result.evaluation.totals.totalCostUsd).toBe(1_980_000_000);
    expect(result.outcome).toBe('success');
    expect(result.flight.ending).toBe('success');
    expect(result.flight.events.some((event) => event.id === 'scrub')).toBe(false);

    // The same design is scrubbed in the most generous contract.
    expect(simulate('orbital_outpost', GRAND_DESIGN).failure).toBe('budget_exceeded');
  });

  it('applies the same physics as a contract', () => {
    const free = evaluateMission(null, GRAND_DESIGN);
    const contract = evaluateMission('orbital_outpost', GRAND_DESIGN);
    expect(free.mass).toEqual(contract.mass);
    expect(free.deltaV).toEqual(contract.deltaV);
    expect(free.radiation).toEqual(contract.radiation);
  });

  it.each<[string, CompleteDesign, string]>([
    ['too heavy', design(['telecom'], 'leo', 'electron'), 'payload_overweight'],
    ['short of delta-v', design(['telecom'], 'geo', 'soyuz'), 'delta_v_shortage'],
    ['unshielded crew', design(['capsule_classic'], 'geo', 'falcon9'), 'radiation'],
  ])('still fails a design that physics does not allow: %s', (_name, d, failure) => {
    const result = simulate(null, d);
    expect(result.failure).toBe(failure);
    expect(result.score).toBeNull();
    expect(result.report.hints.length).toBeGreaterThan(0);
  });

  it('gives no score, even to a flawless flight', () => {
    expect(simulate(null, design(['cubesat'], 'leo', 'electron')).score).toBeNull();
  });

  it('explains the result without a budget or a contract', () => {
    const { report, flight } = simulate(null, GRAND_DESIGN);
    expect(report.headline).toBe('Mission accomplished');
    expect(report.summary.endsWith(FREE_EXPLORATION.epilogue)).toBe(true);
    expect(report.explanation[0]).toContain('$1,980M');
    expect(report.explanation[0]).toContain('no budget limit');
    expect(report.explanation.some((line) => line.startsWith('Objective'))).toBe(false);
    // A crew is on board, so the explanation says why it was safe.
    expect(report.explanation.at(-1)).toMatch(/^Crew: /);
    expect(flight.events.at(-1)).toMatchObject({
      id: 'mission_success',
      detail: FREE_EXPLORATION.epilogue,
    });
  });

  it('is deterministic and survives JSON', () => {
    const result = simulate(null, GRAND_DESIGN);
    expect(simulate(null, GRAND_DESIGN)).toEqual(result);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});

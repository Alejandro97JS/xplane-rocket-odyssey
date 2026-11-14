import { selectReadiness, type GameState } from '@rocket-odyssey/game-core';

export type StepId = 'mission' | 'payload' | 'orbit' | 'rocket' | 'summary';

export interface Step {
  id: StepId;
  number: number;
  label: string;
  path: string;
}

/** The five planning steps of the mockups, in order. */
export const STEPS: readonly Step[] = [
  { id: 'mission', number: 1, label: 'Mission', path: '/plan/mission' },
  { id: 'payload', number: 2, label: 'Equipment & Payload', path: '/plan/payload' },
  { id: 'orbit', number: 3, label: 'Orbit', path: '/plan/orbit' },
  { id: 'rocket', number: 4, label: 'Rocket', path: '/plan/rocket' },
  { id: 'summary', number: 5, label: 'Summary', path: '/plan/summary' },
];

export function getStep(id: StepId): Step {
  return STEPS.find((step) => step.id === id)!;
}

export function getAdjacentSteps(id: StepId): { previous: Step | null; next: Step | null } {
  const index = STEPS.findIndex((step) => step.id === id);
  return { previous: STEPS[index - 1] ?? null, next: STEPS[index + 1] ?? null };
}

/** Whether the choice of a step has been made. The summary is done when everything else is. */
export function isStepDone(state: GameState, id: StepId): boolean {
  const readiness = selectReadiness(state);
  if (id === 'summary') return readiness.ready;
  return readiness.items.find((item) => item.id === id)?.done ?? false;
}

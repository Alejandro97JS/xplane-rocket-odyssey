/**
 * Free exploration: no client, no contract and no budget. The player may load
 * any payload on any rocket and send it to any orbit, whatever it costs. The
 * rules of physics still apply: the rocket must lift the payload, reach the
 * orbit and keep any crew safe.
 *
 * These are the texts the game shows for it, in the places where a contract
 * shows its own.
 */
export const FREE_EXPLORATION = {
  title: 'Free exploration',
  /** One line, like the goal of a contract. */
  goal: 'Fly any payload on any rocket, to any orbit. Physics is the only judge.',
  /** The briefing, like the statement of a contract. */
  statement:
    'No client, no contract and no budget limit: choose anything you want, whatever it costs. The flight still obeys physics. The rocket has to lift the payload, reach the orbit and keep any crew safe.',
  /** Why the flight is not scored. */
  noScore: 'Free exploration flights are not scored. Fly a contract to earn a score.',
  /** What happens after a successful flight. */
  epilogue: 'With no contract and no budget, physics was the only judge, and this design passed.',
} as const;

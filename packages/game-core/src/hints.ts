/**
 * Hints shown after a failed mission. The first five are the texts of
 * `ai/standards/use_case_1_launch.md`, section 5. The last one covers a case
 * the use case implies but does not word: the right hardware in an orbit that
 * does not serve the contract.
 */
export const HINTS = {
  budget_exceeded:
    "You've exceeded the agency's budget! Review the rocket cost or lighten the payload by choosing more economical components.",
  payload_overweight:
    'The chosen rocket lacks enough max payload capacity to lift all the weight you put in the bay. You need a heavier rocket or fewer instruments.',
  delta_v_shortage:
    'The engine ran out of fuel before reaching the required orbital velocity. Try a lower orbit or a rocket with higher specific impulse (Isp) or more fuel.',
  radiation:
    'Medical alert! You sent a standard capsule to a medium orbit passing through the Van Allen radiation belts without proper shielding. Use the shielded capsule or keep the mission in LEO.',
  objective_hardware:
    "The mission flew successfully, but you didn't install the correct hardware for the contract objective (e.g., missing scientific instruments or manned modules).",
  objective_orbit:
    'The mission flew successfully, but the orbit you chose does not serve the contract objective. Read the mission statement again and pick an orbit that fits what the client needs.',
} as const;

export type HintId = keyof typeof HINTS;

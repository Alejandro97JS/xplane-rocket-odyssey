import { FREE_EXPLORATION } from './exploration.ts';
import type { Flight } from './flight.ts';
import {
  agree,
  crewOf,
  formatList,
  formatMass,
  formatPercent,
  formatSpeed,
  formatUsd,
  lowerFirst,
} from './format.ts';
import type { Evaluation } from './rules.ts';

/** The written explanation of a flight, built from the same data as the animation. */
export interface MissionReport {
  readonly headline: string;
  /** One sentence that says what happened. */
  readonly summary: string;
  /** Why it happened, for a player without an aerospace background. */
  readonly explanation: readonly string[];
  /** What to try next. Empty after a success. */
  readonly hints: readonly string[];
}

export function buildReport(evaluation: Evaluation, flight: Flight): MissionReport {
  const { rocket, orbit, payloads, totals, budget, mass, deltaV, failure } = evaluation;
  const payloadNames = formatList(payloads.map((p) => lowerFirst(p.shortName)));
  const [stage1, stage2] = deltaV.budget.stages;
  const stageSentence = `Its ${lowerFirst(stage1.name)} adds ${formatSpeed(stage1.deltaVMs)} and its ${lowerFirst(stage2.name)} adds ${formatSpeed(stage2.deltaVMs)}.`;
  const hints = evaluation.checks.find((check) => !check.passed)?.hints ?? [];

  switch (failure) {
    case 'budget_exceeded':
      // Only a contract has a budget, so only a contract can go over it.
      if (budget === null) throw new Error('A design without a budget cannot exceed it');
      return {
        headline: 'Launch scrubbed: over budget',
        summary: `The countdown was stopped before ignition because the mission costs more than the ${formatUsd(budget.maxUsd)} the client can pay.`,
        explanation: [
          `The payload costs ${formatUsd(totals.payloadCostUsd)} and the rocket ${formatUsd(totals.rocketCostUsd)}. Together that is ${formatUsd(budget.totalUsd)}, which is ${formatUsd(budget.overUsd)} over the budget.`,
          'Money is a resource like mass or propellant: every instrument and every bit of rocket performance has a price. An agency cannot launch what it cannot pay for, so the flight readiness review stopped the clock.',
        ],
        hints,
      };

    case 'payload_overweight':
      return {
        headline: 'Vehicle lost at Max-Q: payload too heavy',
        summary: `${rocket.shortName} broke apart about a minute after liftoff, at the moment of highest stress on its structure.`,
        explanation: [
          `Every launcher is certified for a maximum payload. ${rocket.shortName} is rated for ${formatMass(mass.capacityKg)} and you loaded ${formatMass(mass.payloadKg)}, which is ${formatPercent(mass.payloadKg / mass.capacityKg)} of its capacity.`,
          'As a rocket speeds up through the lower atmosphere, the air pushes harder and harder against it. The peak is called Max-Q. The part that holds the payload could not take those forces with so much weight on top.',
        ],
        hints,
      };

    case 'delta_v_shortage': {
      const short = formatSpeed(-deltaV.marginMs);
      const base = [
        `Reaching an orbit is mostly a matter of speed. The total change of speed a mission needs is called delta-v, and ${lowerFirst(orbit.shortName)} needs ${formatSpeed(deltaV.requiredMs)}.`,
        `With ${formatMass(mass.payloadKg)} on top, ${rocket.shortName} can only generate ${formatSpeed(deltaV.budget.totalMs)}. ${stageSentence} That leaves it ${short} short.`,
        'A heavier payload leaves less delta-v, because the same propellant has to push more mass. A higher orbit asks for more delta-v.',
      ];
      if (flight.ending === 'stranded') {
        return {
          headline: 'Stranded short of the target orbit',
          summary: `${rocket.shortName} reached space but ran out of propellant before it could raise its orbit all the way to ${lowerFirst(orbit.shortName)}.`,
          explanation: base,
          hints,
        };
      }
      return {
        headline: 'Failed to reach orbit: out of propellant',
        summary: `${rocket.shortName} ran out of propellant before reaching orbital speed, fell back into the atmosphere and burned up.`,
        explanation: base,
        hints,
      };
    }

    case 'radiation': {
      const { exposedCapsules, exposedCrew } = evaluation.radiation;
      const capsules = formatList(exposedCapsules.map((p) => lowerFirst(p.shortName)));
      const count = exposedCapsules.length;
      return {
        headline: 'Crew exposed to radiation',
        summary: `The launch was flawless, but ${crewOf(exposedCrew)} absorbed a dangerous radiation dose and the mission had to be aborted.`,
        explanation: [
          'The Earth is surrounded by the Van Allen belts: two rings of fast particles trapped by its magnetic field, starting about 1,000 km up. Low orbits stay below them.',
          `To reach ${lowerFirst(orbit.shortName)} a spacecraft has to fly through the belts. The ${capsules} ${agree(count, 'has', 'have')} life support but no radiation shielding, so ${agree(count, 'its crew was', 'their crews were')} exposed.`,
          `The rocket itself was not the problem: it had ${formatSpeed(deltaV.marginMs)} of delta-v in reserve.`,
        ],
        hints,
      };
    }

    case 'objective_unfulfilled': {
      // Only a contract has an objective, so only a contract can miss it.
      const { objective, level } = evaluation;
      if (objective === null || level === null) {
        throw new Error('A design without a contract cannot miss its objective');
      }
      const explanation = [
        `The rocket did its job: it placed the ${payloadNames} in ${lowerFirst(orbit.shortName)} with ${formatSpeed(deltaV.marginMs)} of delta-v in reserve. But a mission only succeeds if it delivers what the client is paying for.`,
      ];
      if (objective.missingHardware.length > 0) {
        const missing = formatList(objective.missingHardware.map((r) => r.label));
        explanation.push(`The contract needs ${missing}, and the payload does not include it.`);
      }
      if (!objective.orbitAccepted) {
        explanation.push(
          `${orbit.shortName} does not serve this contract. ${level.objective.orbitReason}`,
        );
      }
      return {
        headline: 'Contract not fulfilled',
        summary:
          'The flight was a success, but the mission does not do what the contract asks for.',
        explanation,
        hints,
      };
    }

    case null: {
      const { level } = evaluation;
      const explanation = [
        budget === null
          ? `Cost: the mission cost ${formatUsd(totals.totalCostUsd)}. Free exploration has no budget limit, so the cost did not matter this time.`
          : `Budget: the mission cost ${formatUsd(budget.totalUsd)} of the ${formatUsd(budget.maxUsd)} available.`,
        `Mass: the payload weighed ${formatMass(mass.payloadKg)}, within the ${formatMass(mass.capacityKg)} that ${rocket.shortName} is rated for.`,
        `Delta-v: ${lowerFirst(orbit.shortName)} needs ${formatSpeed(deltaV.requiredMs)} and the rocket generated ${formatSpeed(deltaV.budget.totalMs)}. ${stageSentence}`,
      ];
      if (level !== null) {
        explanation.push('Objective: the hardware and the orbit match what the client asked for.');
      } else if (totals.crew > 0) {
        const radiation = evaluation.checks.find((check) => check.id === 'radiation');
        if (radiation) explanation.push(`Crew: ${lowerFirst(radiation.detail)}`);
      }
      return {
        headline: 'Mission accomplished',
        summary: `${rocket.shortName} delivered the ${payloadNames} to ${lowerFirst(orbit.shortName)}. ${level?.epilogue ?? FREE_EXPLORATION.epilogue}`,
        explanation,
        hints: [],
      };
    }
  }
}

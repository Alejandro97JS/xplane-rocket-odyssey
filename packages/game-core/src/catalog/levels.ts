import type { LevelId, OrbitId, PayloadId } from '../ids.ts';

const M = 1_000_000;

/** A piece of hardware the contract needs. Any payload of `anyOf` satisfies it. */
export interface HardwareRequirement {
  readonly id: string;
  /** Completes the sentence "The contract needs ...". */
  readonly label: string;
  readonly anyOf: readonly PayloadId[];
}

export interface LevelSpec {
  readonly id: LevelId;
  readonly number: number;
  readonly title: string;
  /** Mission statement shown to the player, from the use case. */
  readonly statement: string;
  readonly maxBudgetUsd: number;
  /** One line that names the goal without giving the solution away. */
  readonly goal: string;
  readonly objective: {
    /** Every requirement must be met by the payload. */
    readonly hardware: readonly HardwareRequirement[];
    /** Orbits that serve the contract. */
    readonly orbits: readonly OrbitId[];
    /** Why the other orbits do not serve the contract. */
    readonly orbitReason: string;
  };
  /** What happens after a successful launch. */
  readonly epilogue: string;
}

const CREW_CAPSULES: readonly PayloadId[] = [
  'capsule_suborbital',
  'capsule_classic',
  'capsule_modern',
  'capsule_shielded',
];

/** Levels of `ai/standards/use_case_1_launch.md`, section 1. */
export const LEVELS: readonly LevelSpec[] = [
  {
    id: 'first_space_data',
    number: 1,
    title: 'First Space Data',
    statement:
      'A university wants to obtain its first atmospheric radiation and space weather measurements from space with a very tight budget.',
    maxBudgetUsd: 35 * M,
    goal: 'Put a small science instrument in low orbit for very little money.',
    objective: {
      hardware: [{ id: 'science', label: 'a scientific micro-satellite', anyOf: ['cubesat'] }],
      orbits: ['leo'],
      orbitReason:
        'The contract asks for a low orbit of 300 to 600 km, close enough to sample the upper atmosphere and to reach the small ground station of the university.',
    },
    epilogue:
      'The CubeSat unfolds its antennas and sends its first radiation readings to the university.',
  },
  {
    id: 'environmental_surveillance',
    number: 2,
    title: 'Continuous Environmental Surveillance',
    statement:
      'We need to monitor the advance of forest wildfires and the state of glaciers. The area is often cloud-covered, and we need frequent overhead passes.',
    maxBudgetUsd: 85 * M,
    goal: 'Watch wildfires and glaciers from an orbit that passes overhead often.',
    objective: {
      hardware: [
        {
          id: 'observation',
          label: 'an Earth observation instrument (optical or radar)',
          anyOf: ['earth_observation', 'sar_radar'],
        },
      ],
      orbits: ['sso', 'leo'],
      orbitReason:
        'Only a low orbit passes over the area often enough, and close enough to give sharp images. High orbits are too far from the ground.',
    },
    epilogue: 'The first images of the fire front reach the emergency services within hours.',
  },
  {
    id: 'connecting_the_continent',
    number: 3,
    title: 'Connecting the Continent',
    statement:
      'A telecom operator wants to provide high-speed internet coverage across an entire continent with zero signal interruptions.',
    maxBudgetUsd: 190 * M,
    goal: 'Keep a whole continent connected, without interruptions.',
    objective: {
      hardware: [
        { id: 'telecom', label: 'a telecommunications satellite', anyOf: ['telecom'] },
      ],
      orbits: ['geo', 'heo'],
      orbitReason:
        'A satellite in a low or medium orbit crosses the sky in minutes, so it cannot serve one continent without interruptions. Geostationary and high elliptical orbits keep it over the region for hours.',
    },
    epilogue: 'The satellite opens its antennas and the first homes come online the same week.',
  },
  {
    id: 'human_horizon',
    number: 4,
    title: 'Human Horizon',
    statement:
      'We want to prove our agency can send astronauts into space, keep them operating for several days, and bring them back safely.',
    maxBudgetUsd: 300 * M,
    goal: 'Fly astronauts to orbit and bring them home safely.',
    objective: {
      hardware: [
        {
          id: 'capsule',
          label: 'a crew capsule with integrated life support',
          anyOf: CREW_CAPSULES,
        },
      ],
      // Any orbit proves the capability. The radiation rule is what makes the
      // high orbits fail for capsules without shielding.
      orbits: ['leo', 'sso', 'meo', 'geo', 'heo'],
      orbitReason: '',
    },
    epilogue:
      'After several days of work in orbit the capsule fires its engines, re-enters and lands safely with its crew.',
  },
  {
    id: 'orbital_outpost',
    number: 5,
    title: 'Orbital Outpost',
    statement:
      'The agency seeks to establish a permanent presence in space where a crew can live and perform long-term microgravity experiments.',
    maxBudgetUsd: 520 * M,
    goal: 'Assemble a station where a crew can live and do research.',
    objective: {
      hardware: [
        { id: 'core', label: 'a docking and power module (core)', anyOf: ['station_core'] },
        {
          id: 'workspace',
          label: 'a laboratory or habitat module',
          anyOf: ['station_lab', 'station_habitat'],
        },
        { id: 'capsule', label: 'a crew capsule to carry the astronauts', anyOf: CREW_CAPSULES },
      ],
      orbits: ['leo'],
      orbitReason:
        'A station needs a stable low orbit of 350 to 500 km, where crews and supplies can reach it regularly and radiation is low.',
    },
    epilogue:
      'The modules dock together, the solar arrays unfold and the first crew floats into the new outpost.',
  },
];

const LEVEL_BY_ID = new Map<LevelId, LevelSpec>(LEVELS.map((l) => [l.id, l]));

export function getLevel(id: LevelId): LevelSpec {
  const level = LEVEL_BY_ID.get(id);
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}

/** The level after `id`, or null when `id` is the last one. */
export function getNextLevel(id: LevelId): LevelSpec | null {
  const index = LEVELS.findIndex((l) => l.id === id);
  return LEVELS[index + 1] ?? null;
}

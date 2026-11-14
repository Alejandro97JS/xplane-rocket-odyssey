import type { PayloadId } from '../ids.ts';

export type PayloadGroup = 'satellite' | 'crew' | 'station';

export interface PayloadSpec {
  readonly id: PayloadId;
  readonly name: string;
  /** Short name for tight places such as the summary and the event log. */
  readonly shortName: string;
  readonly massKg: number;
  readonly costUsd: number;
  /** Category shown on the card, from the payload table of the use case. */
  readonly category: string;
  /** Section of the payload screen the card belongs to. */
  readonly group: PayloadGroup;
  /** Number of astronauts on board. Zero for uncrewed hardware. */
  readonly crew: number;
  /** True when the crew is protected against the Van Allen belts. */
  readonly radiationShielded: boolean;
  /** One sentence for players without an aerospace background. */
  readonly description: string;
}

const M = 1_000_000;

/** Payload table of `ai/standards/use_case_1_launch.md`, section 2. */
export const PAYLOADS: readonly PayloadSpec[] = [
  {
    id: 'cubesat',
    name: 'Scientific Micro-Satellite (CubeSat)',
    shortName: 'Scientific CubeSat',
    massKg: 130,
    costUsd: 18 * M,
    category: 'Science / Atmosphere',
    group: 'satellite',
    crew: 0,
    radiationShielded: false,
    description:
      'A tiny, cheap satellite that measures radiation and space weather from low orbit.',
  },
  {
    id: 'earth_observation',
    name: 'Earth Observation Pack (Optical)',
    shortName: 'Optical observation pack',
    massKg: 450,
    costUsd: 27 * M,
    category: 'Observation',
    group: 'satellite',
    crew: 0,
    radiationShielded: false,
    description: 'High-resolution cameras that photograph the ground in daylight and clear skies.',
  },
  {
    id: 'sar_radar',
    name: 'All-Weather Radar Pack (SAR)',
    shortName: 'SAR radar pack',
    massKg: 400,
    costUsd: 40 * M,
    category: 'Observation',
    group: 'satellite',
    crew: 0,
    radiationShielded: false,
    description: 'An imaging radar that sees the ground through clouds, smoke and darkness.',
  },
  {
    id: 'telecom',
    name: 'Telecommunications Satellite',
    shortName: 'Telecom satellite',
    massKg: 1_800,
    costUsd: 75 * M,
    category: 'Telecommunications',
    group: 'satellite',
    crew: 0,
    radiationShielded: false,
    description: 'Relays internet and television signals across a whole region from high orbit.',
  },
  {
    id: 'observatory',
    name: 'Orbital Observatory (Telescope)',
    shortName: 'Orbital observatory',
    massKg: 1_500,
    costUsd: 150 * M,
    category: 'Advanced Science',
    group: 'satellite',
    crew: 0,
    radiationShielded: false,
    description: 'A space telescope that observes the universe above the blur of the atmosphere.',
  },
  {
    id: 'capsule_suborbital',
    name: 'Suborbital / Test Capsule (1 Astronaut)',
    shortName: 'Test capsule',
    massKg: 1_400,
    costUsd: 65 * M,
    category: 'Crewed (Basic)',
    group: 'crew',
    crew: 1,
    radiationShielded: false,
    description: 'A light one-seat capsule with basic life support. No radiation shielding.',
  },
  {
    id: 'capsule_classic',
    name: 'Classic Orbital Capsule (3 Astronauts)',
    shortName: 'Classic capsule',
    massKg: 7_200,
    costUsd: 130 * M,
    category: 'Crewed (Standard)',
    group: 'crew',
    crew: 3,
    radiationShielded: false,
    description: 'A proven three-seat capsule for stays in low orbit. No radiation shielding.',
  },
  {
    id: 'capsule_modern',
    name: 'Modern Commercial Capsule (4 Astronauts)',
    shortName: 'Commercial capsule',
    massKg: 12_500,
    costUsd: 220 * M,
    category: 'Crewed (Advanced)',
    group: 'crew',
    crew: 4,
    radiationShielded: false,
    description: 'A roomy, automated four-seat capsule for low orbit. No radiation shielding.',
  },
  {
    id: 'capsule_shielded',
    name: 'Heavy Shielded Capsule (4 Astronauts)',
    shortName: 'Shielded capsule',
    massKg: 21_000,
    costUsd: 350 * M,
    category: 'Crewed / High Orbit',
    group: 'crew',
    crew: 4,
    radiationShielded: true,
    description: 'A heavy capsule whose shielding protects the crew inside the radiation belts.',
  },
  {
    id: 'station_core',
    name: 'Docking & Power Module (Core)',
    shortName: 'Core module',
    massKg: 4_200,
    costUsd: 80 * M,
    category: 'Space Station',
    group: 'station',
    crew: 0,
    radiationShielded: false,
    description: 'The backbone of a station: docking ports, solar power and attitude control.',
  },
  {
    id: 'station_lab',
    name: 'Scientific Laboratory Module',
    shortName: 'Laboratory module',
    massKg: 8_500,
    costUsd: 160 * M,
    category: 'Space Station',
    group: 'station',
    crew: 0,
    radiationShielded: false,
    description: 'A pressurised laboratory for long microgravity experiments.',
  },
  {
    id: 'station_habitat',
    name: 'Habitat / Dormitories Module',
    shortName: 'Habitat module',
    massKg: 10_000,
    costUsd: 190 * M,
    category: 'Space Station',
    group: 'station',
    crew: 0,
    radiationShielded: false,
    description: 'Living quarters where a crew can sleep, eat and exercise for months.',
  },
];

const PAYLOAD_BY_ID = new Map<PayloadId, PayloadSpec>(PAYLOADS.map((p) => [p.id, p]));

export function getPayload(id: PayloadId): PayloadSpec {
  const payload = PAYLOAD_BY_ID.get(id);
  if (!payload) throw new Error(`Unknown payload: ${id}`);
  return payload;
}

export const PAYLOAD_GROUPS: readonly { id: PayloadGroup; title: string; description: string }[] = [
  {
    id: 'satellite',
    title: 'Satellites and science',
    description: 'Uncrewed spacecraft that observe, measure or communicate.',
  },
  {
    id: 'crew',
    title: 'Crew capsules',
    description: 'Vehicles with life support that carry astronauts and bring them home.',
  },
  {
    id: 'station',
    title: 'Space station modules',
    description: 'Building blocks of a permanent outpost in orbit.',
  },
];

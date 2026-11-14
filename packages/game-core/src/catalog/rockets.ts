import type { RocketId } from '../ids.ts';

/**
 * One stage of a launcher. Every launcher is modelled as two stages: the part
 * that is dropped on the way up (boosters and first stage together) and the
 * part that carries the payload into orbit.
 */
export interface RocketStage {
  /** A singular name, so it fits in sentences such as "The ... is empty". */
  readonly name: string;
  readonly dryMassKg: number;
  readonly propellantMassKg: number;
  /** Specific impulse of this stage, in seconds. */
  readonly ispS: number;
  /** Time the stage takes to burn all its propellant, in seconds. */
  readonly burnTimeS: number;
}

export type CapacityLabel = 'Small' | 'Medium' | 'Large' | 'Super heavy';

export interface RocketSpec {
  readonly id: RocketId;
  readonly name: string;
  readonly shortName: string;
  readonly operator: string;
  readonly costUsd: number;
  /** Structure of the whole launcher, without propellant or payload. */
  readonly dryMassKg: number;
  readonly propellantMassKg: number;
  /** Specific impulse averaged over the propellant of both stages. */
  readonly ispS: number;
  /** Heaviest payload the structure is rated to carry. */
  readonly maxLeoPayloadKg: number;
  readonly capacityLabel: CapacityLabel;
  readonly heightM: number;
  /** Where the payload rides: under a nose fairing that is dropped, or inside the vehicle. */
  readonly payloadBay: 'fairing' | 'internal';
  readonly description: string;
  readonly stages: readonly [RocketStage, RocketStage];
}

const M = 1_000_000;

/**
 * Launcher table of `ai/standards/use_case_1_launch.md`, section 4.
 *
 * The table gives totals for the whole launcher. The split into two stages is
 * our calibration: the dry masses and propellant masses of the stages add up
 * to the totals of the table, and the propellant-weighted average of the stage
 * specific impulses equals the specific impulse of the table. The reasons are
 * recorded in `ai/self_documentation/use_case_1_launch_rules.md`.
 */
export const ROCKETS: readonly RocketSpec[] = [
  {
    id: 'electron',
    name: 'Rocket Lab Electron',
    shortName: 'Electron',
    operator: 'Rocket Lab',
    costUsd: 8.5 * M,
    dryMassKg: 1_200,
    propellantMassKg: 11_300,
    ispS: 320,
    maxLeoPayloadKg: 300,
    capacityLabel: 'Small',
    heightM: 18,
    payloadBay: 'fairing',
    description: 'A small, cheap launcher built for small satellites.',
    stages: [
      { name: 'First stage', dryMassKg: 1_000, propellantMassKg: 9_150, ispS: 315, burnTimeS: 155 },
      { name: 'Second stage', dryMassKg: 200, propellantMassKg: 2_150, ispS: 343, burnTimeS: 370 },
    ],
  },
  {
    id: 'soyuz',
    name: 'Soyuz-2.1a',
    shortName: 'Soyuz',
    operator: 'Roscosmos',
    costUsd: 50 * M,
    dryMassKg: 22_000,
    propellantMassKg: 285_000,
    ispS: 315,
    maxLeoPayloadKg: 7_500,
    capacityLabel: 'Medium',
    heightM: 46,
    payloadBay: 'fairing',
    description:
      'A workhorse flown since the 1960s. Reliable in low orbit, short of energy for high ones.',
    stages: [
      {
        name: 'Core stage with boosters',
        dryMassKg: 17_500,
        propellantMassKg: 259_000,
        ispS: 311,
        burnTimeS: 287,
      },
      {
        name: 'Upper stage',
        dryMassKg: 4_500,
        propellantMassKg: 26_000,
        ispS: 359,
        burnTimeS: 240,
      },
    ],
  },
  {
    id: 'falcon9',
    name: 'Falcon 9 Block 5',
    shortName: 'Falcon 9',
    operator: 'SpaceX',
    costUsd: 70 * M,
    dryMassKg: 26_200,
    propellantMassKg: 518_400,
    ispS: 311,
    maxLeoPayloadKg: 22_800,
    capacityLabel: 'Large',
    heightM: 70,
    payloadBay: 'fairing',
    description:
      'A powerful two-stage launcher. Lifts heavy loads to low orbit and satellites to high orbit.',
    stages: [
      {
        name: 'First stage',
        dryMassKg: 22_200,
        propellantMassKg: 411_000,
        ispS: 301,
        burnTimeS: 162,
      },
      {
        name: 'Second stage',
        dryMassKg: 4_000,
        propellantMassKg: 107_400,
        ispS: 348,
        burnTimeS: 397,
      },
    ],
  },
  {
    id: 'ariane6',
    name: 'Ariane 6 (A62)',
    shortName: 'Ariane 6',
    operator: 'Arianespace / ESA',
    costUsd: 85 * M,
    dryMassKg: 41_000,
    propellantMassKg: 455_000,
    ispS: 350,
    maxLeoPayloadKg: 10_350,
    capacityLabel: 'Medium',
    heightM: 56,
    payloadBay: 'fairing',
    description:
      'A European launcher with a very efficient hydrogen upper stage, at its best in high orbits.',
    stages: [
      {
        name: 'Core stage with boosters',
        dryMassKg: 36_000,
        propellantMassKg: 424_000,
        ispS: 342,
        burnTimeS: 465,
      },
      {
        name: 'Upper stage',
        dryMassKg: 5_000,
        propellantMassKg: 31_000,
        ispS: 457,
        burnTimeS: 720,
      },
    ],
  },
  {
    id: 'starship',
    name: 'SpaceX Starship',
    shortName: 'Starship',
    operator: 'SpaceX',
    costUsd: 100 * M,
    dryMassKg: 375_000,
    propellantMassKg: 4_900_000,
    ispS: 360,
    maxLeoPayloadKg: 150_000,
    capacityLabel: 'Super heavy',
    heightM: 121,
    payloadBay: 'internal',
    description:
      'The largest launcher ever built, designed to carry whole station modules in one flight.',
    stages: [
      {
        name: 'Booster (Super Heavy)',
        dryMassKg: 250_000,
        propellantMassKg: 3_400_000,
        ispS: 351,
        burnTimeS: 170,
      },
      {
        name: 'Ship',
        dryMassKg: 125_000,
        propellantMassKg: 1_500_000,
        ispS: 380,
        burnTimeS: 380,
      },
    ],
  },
  {
    id: 'ariane5',
    name: 'Ariane 5 (ECA)',
    shortName: 'Ariane 5',
    operator: 'Arianespace / ESA',
    costUsd: 180 * M,
    dryMassKg: 45_000,
    propellantMassKg: 700_000,
    ispS: 370,
    maxLeoPayloadKg: 20_000,
    capacityLabel: 'Large',
    heightM: 52,
    payloadBay: 'fairing',
    description:
      'A heavy European launcher that carried large satellites and station cargo for decades.',
    stages: [
      {
        name: 'Core stage with boosters',
        dryMassKg: 40_000,
        propellantMassKg: 672_000,
        ispS: 367,
        burnTimeS: 540,
      },
      {
        name: 'Upper stage',
        dryMassKg: 5_000,
        propellantMassKg: 28_000,
        ispS: 446,
        burnTimeS: 945,
      },
    ],
  },
  {
    id: 'saturn5',
    name: 'Saturn V',
    shortName: 'Saturn V',
    operator: 'NASA',
    costUsd: 1_200 * M,
    dryMassKg: 130_000,
    propellantMassKg: 2_840_000,
    ispS: 380,
    maxLeoPayloadKg: 140_000,
    capacityLabel: 'Super heavy',
    heightM: 111,
    payloadBay: 'fairing',
    description: 'The Moon rocket of the Apollo programme. Enormous capacity at an enormous price.',
    stages: [
      {
        name: 'Lower stack',
        dryMassKg: 95_000,
        propellantMassKg: 2_150_000,
        ispS: 367,
        burnTimeS: 550,
      },
      {
        name: 'Upper stage',
        dryMassKg: 35_000,
        propellantMassKg: 690_000,
        ispS: 421,
        burnTimeS: 475,
      },
    ],
  },
  {
    id: 'shuttle',
    name: 'Space Shuttle (STS)',
    shortName: 'Space Shuttle',
    operator: 'NASA',
    costUsd: 1_500 * M,
    dryMassKg: 278_000,
    propellantMassKg: 1_760_000,
    ispS: 410,
    maxLeoPayloadKg: 24_400,
    capacityLabel: 'Large',
    heightM: 56,
    payloadBay: 'internal',
    description:
      'A reusable winged orbiter with a large cargo bay. The most expensive way to reach orbit.',
    stages: [
      {
        name: 'Solid booster pair',
        dryMassKg: 182_000,
        propellantMassKg: 1_000_000,
        ispS: 378,
        burnTimeS: 124,
      },
      {
        name: 'Orbiter with external tank',
        dryMassKg: 96_000,
        propellantMassKg: 760_000,
        ispS: 452,
        burnTimeS: 396,
      },
    ],
  },
];

const ROCKET_BY_ID = new Map<RocketId, RocketSpec>(ROCKETS.map((r) => [r.id, r]));

export function getRocket(id: RocketId): RocketSpec {
  const rocket = ROCKET_BY_ID.get(id);
  if (!rocket) throw new Error(`Unknown rocket: ${id}`);
  return rocket;
}

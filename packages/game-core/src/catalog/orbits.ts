import type { OrbitId } from '../ids.ts';

export type EnergyLabel = 'Low' | 'Moderate' | 'High' | 'Very high';

/**
 * How the launcher flies to the orbit. Every flight first reaches a low
 * circular orbit (the "insertion" orbit). High orbits then need a transfer:
 * an injection burn, a long coast up to the apogee and, for circular orbits,
 * a final burn to circularise.
 */
export interface OrbitFlightPlan {
  /** Altitude of the first orbit the launcher reaches. */
  readonly insertionAltitudeKm: number;
  /** Delta-v needed to reach that first orbit, losses included. */
  readonly insertionDeltaVMs: number;
  readonly transfer: {
    readonly injectionDeltaVMs: number;
    readonly apogeeAltitudeKm: number;
    /** Zero when the payload stays in the elliptical orbit. */
    readonly circularizationDeltaVMs: number;
  } | null;
}

export interface OrbitSpec {
  readonly id: OrbitId;
  readonly name: string;
  readonly shortName: string;
  readonly altitudeLabel: string;
  readonly inclinationLabel: string;
  /** Total delta-v the launcher must generate, in m/s. */
  readonly requiredDeltaVMs: number;
  readonly energyLabel: EnergyLabel;
  /** True when the orbit crosses or sits inside the Van Allen belts. */
  readonly radiationHazard: boolean;
  /** Risks and notes from the orbit table of the use case. */
  readonly notes: string;
  /** What the orbit is good for, for players without an aerospace background. */
  readonly description: string;
  readonly flightPlan: OrbitFlightPlan;
}

/** Orbit table of `ai/standards/use_case_1_launch.md`, section 3. */
export const ORBITS: readonly OrbitSpec[] = [
  {
    id: 'leo',
    name: 'Low Earth Orbit (LEO)',
    shortName: 'Low Earth orbit',
    altitudeLabel: '300 – 500 km',
    inclinationLabel: 'Low inclination',
    requiredDeltaVMs: 9_300,
    energyLabel: 'Low',
    radiationHazard: false,
    notes: 'Standard orbit, easy access, no severe radiation.',
    description:
      'Just above the atmosphere. The cheapest orbit to reach, with a lap around the Earth every 90 minutes.',
    flightPlan: { insertionAltitudeKm: 400, insertionDeltaVMs: 9_300, transfer: null },
  },
  {
    id: 'sso',
    name: 'Polar LEO / Sun-Synchronous (SSO)',
    shortName: 'Sun-synchronous orbit',
    altitudeLabel: '600 – 800 km',
    inclinationLabel: 'Inclined 98°',
    requiredDeltaVMs: 9_800,
    energyLabel: 'Moderate',
    radiationHazard: false,
    notes: 'Passes over poles, ideal for global observation.',
    description:
      'A low orbit over the poles. The Earth turns underneath, so the satellite sees the whole planet with the same lighting.',
    flightPlan: { insertionAltitudeKm: 700, insertionDeltaVMs: 9_800, transfer: null },
  },
  {
    id: 'meo',
    name: 'Medium Earth Orbit (MEO)',
    shortName: 'Medium Earth orbit',
    altitudeLabel: '20,000 km',
    inclinationLabel: 'Medium inclination',
    requiredDeltaVMs: 11_200,
    energyLabel: 'High',
    radiationHazard: true,
    notes: 'Crosses Van Allen radiation belts (lethal for unshielded crews).',
    description:
      'Where navigation satellites live. Each one sees a large part of the planet, but the orbit lies inside the radiation belts.',
    flightPlan: {
      insertionAltitudeKm: 200,
      insertionDeltaVMs: 9_300,
      transfer: {
        injectionDeltaVMs: 1_100,
        apogeeAltitudeKm: 20_000,
        circularizationDeltaVMs: 800,
      },
    },
  },
  {
    id: 'geo',
    name: 'Geostationary Orbit (GEO)',
    shortName: 'Geostationary orbit',
    altitudeLabel: '35,786 km',
    inclinationLabel: 'Fixed over the equator',
    requiredDeltaVMs: 12_000,
    energyLabel: 'Very high',
    radiationHazard: true,
    notes: 'Continuous 24h fixed coverage, requires high energy and performance.',
    description:
      'The satellite turns at the same rate as the Earth, so it hangs over one spot and covers a continent all day.',
    flightPlan: {
      insertionAltitudeKm: 200,
      insertionDeltaVMs: 9_300,
      transfer: {
        injectionDeltaVMs: 1_650,
        apogeeAltitudeKm: 35_786,
        circularizationDeltaVMs: 1_050,
      },
    },
  },
  {
    id: 'heo',
    name: 'High Elliptical Orbit (HEO / Molniya)',
    shortName: 'High elliptical orbit',
    altitudeLabel: 'High apogee / low perigee',
    inclinationLabel: 'Inclined 63°',
    requiredDeltaVMs: 11_500,
    energyLabel: 'High',
    radiationHazard: true,
    notes: 'Ideal for high latitudes, requires advanced thermal control.',
    description:
      'A long oval orbit. The satellite lingers for hours high above the northern regions, then dives fast past the Earth.',
    flightPlan: {
      insertionAltitudeKm: 500,
      insertionDeltaVMs: 9_300,
      transfer: {
        injectionDeltaVMs: 2_200,
        apogeeAltitudeKm: 39_700,
        circularizationDeltaVMs: 0,
      },
    },
  },
];

const ORBIT_BY_ID = new Map<OrbitId, OrbitSpec>(ORBITS.map((o) => [o.id, o]));

export function getOrbit(id: OrbitId): OrbitSpec {
  const orbit = ORBIT_BY_ID.get(id);
  if (!orbit) throw new Error(`Unknown orbit: ${id}`);
  return orbit;
}

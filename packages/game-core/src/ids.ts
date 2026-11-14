import { z } from 'zod';

/**
 * Identifiers of everything the player can choose. They are plain strings so
 * the game state stays serializable.
 */

export const LEVEL_IDS = [
  'first_space_data',
  'environmental_surveillance',
  'connecting_the_continent',
  'human_horizon',
  'orbital_outpost',
] as const;
export const LevelIdSchema = z.enum(LEVEL_IDS);
export type LevelId = z.infer<typeof LevelIdSchema>;

export const PAYLOAD_IDS = [
  'cubesat',
  'earth_observation',
  'sar_radar',
  'telecom',
  'observatory',
  'capsule_suborbital',
  'capsule_classic',
  'capsule_modern',
  'capsule_shielded',
  'station_core',
  'station_lab',
  'station_habitat',
] as const;
export const PayloadIdSchema = z.enum(PAYLOAD_IDS);
export type PayloadId = z.infer<typeof PayloadIdSchema>;

export const ORBIT_IDS = ['leo', 'sso', 'meo', 'geo', 'heo'] as const;
export const OrbitIdSchema = z.enum(ORBIT_IDS);
export type OrbitId = z.infer<typeof OrbitIdSchema>;

export const ROCKET_IDS = [
  'electron',
  'soyuz',
  'falcon9',
  'ariane6',
  'starship',
  'ariane5',
  'saturn5',
  'shuttle',
] as const;
export const RocketIdSchema = z.enum(ROCKET_IDS);
export type RocketId = z.infer<typeof RocketIdSchema>;

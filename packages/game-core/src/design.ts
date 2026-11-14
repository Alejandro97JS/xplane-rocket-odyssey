import { z } from 'zod';
import { getPayload } from './catalog/payloads.ts';
import { getRocket } from './catalog/rockets.ts';
import {
  OrbitIdSchema,
  PAYLOAD_IDS,
  PayloadIdSchema,
  RocketIdSchema,
  type PayloadId,
} from './ids.ts';

/** What the player has chosen so far. Any part may still be missing. */
export const DesignSchema = z.object({
  payloadIds: z
    .array(PayloadIdSchema)
    .refine((ids) => new Set(ids).size === ids.length, 'A payload can be selected only once'),
  orbitId: OrbitIdSchema.nullable(),
  rocketId: RocketIdSchema.nullable(),
});
export type Design = z.infer<typeof DesignSchema>;

/** A design that can be launched: it has a payload, an orbit and a rocket. */
export const CompleteDesignSchema = DesignSchema.extend({
  payloadIds: DesignSchema.shape.payloadIds.min(1),
  orbitId: OrbitIdSchema,
  rocketId: RocketIdSchema,
});
export type CompleteDesign = z.infer<typeof CompleteDesignSchema>;

export const EMPTY_DESIGN: Design = { payloadIds: [], orbitId: null, rocketId: null };

export function isCompleteDesign(design: Design): design is CompleteDesign {
  return design.payloadIds.length > 0 && design.orbitId !== null && design.rocketId !== null;
}

/** Payload ids in catalog order, so equal selections always serialize equally. */
export function sortPayloadIds(ids: readonly PayloadId[]): PayloadId[] {
  return PAYLOAD_IDS.filter((id) => ids.includes(id));
}

export interface DesignTotals {
  readonly payloadMassKg: number;
  readonly payloadCostUsd: number;
  /** Zero until a rocket is chosen. */
  readonly rocketCostUsd: number;
  readonly totalCostUsd: number;
  /** Astronauts on board, over all capsules. */
  readonly crew: number;
}

export function computeTotals(design: Design): DesignTotals {
  let payloadMassKg = 0;
  let payloadCostUsd = 0;
  let crew = 0;
  for (const id of design.payloadIds) {
    const payload = getPayload(id);
    payloadMassKg += payload.massKg;
    payloadCostUsd += payload.costUsd;
    crew += payload.crew;
  }
  const rocketCostUsd = design.rocketId ? getRocket(design.rocketId).costUsd : 0;
  return {
    payloadMassKg,
    payloadCostUsd,
    rocketCostUsd,
    totalCostUsd: payloadCostUsd + rocketCostUsd,
    crew,
  };
}

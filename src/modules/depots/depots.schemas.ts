import { Depot } from "@prisma/client";
import { z } from "zod";

import { MAX_SHARDS } from "../shared/constants";
import { Serialized } from "../shared/shared.types";

export const enum DepotStatus {
  ACTIVE = 0,
  SUSPENDED = 1,
  CLOSED = 2,
}

export const createDepotSchema = z.object({
  name: z.string(),
  location: z.string(),
  shard: z.number().int().min(0).max(MAX_SHARDS).optional(),
});

export type CreateDepot = z.infer<typeof createDepotSchema>;

export type DepotDTO = Serialized<Omit<Depot, "shard">>;

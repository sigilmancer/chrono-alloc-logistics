import { DispatchRun } from "@prisma/client";
import { z } from "zod";

import { MAX_SHARDS } from "../shared/constants";
import { Serialized } from "../shared/shared.types";

export const createDispatchRunSchema = z.object({
  startAt: z.string(),
  endAt: z.string(),
  courierId: z.number().int().positive().optional(),//z.string().optional(),
  depotId: z.number(),
  jobType: z.string(),
  shard: z.number().int().min(0).max(MAX_SHARDS).optional(),
});

export type CreateDispatchRun = z.infer<typeof createDispatchRunSchema>;

export const getShiftsQuerySchema = z.object({
  courierId: z
    .union([
      z.literal("null").transform(() => null),
      z.literal("").transform(() => undefined),
      z.coerce.number().int().positive(),
    ])
    .optional(),
  jobType: z.string().optional(),
  location: z.string().optional(),
  page: z.coerce.number().int().nonnegative().optional(),
  shard: z.coerce.number().int().min(0).max(MAX_SHARDS).optional(),
});

export type GetShiftsQuery = z.infer<typeof getShiftsQuerySchema>;

export type DispatchRunDTO = Serialized<Omit<DispatchRun, "shard">>;

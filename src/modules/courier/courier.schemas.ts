import { Courier } from "@prisma/client";
import { z } from "zod";

import { Serialized } from "../shared/shared.types";

export const enum CourierStatus {
  ACTIVE = 0,
  SUSPENDED = 1,
  CLOSED = 2,
}

export const createCourierSchema = z.object({
  name: z.string(),
});

export type CreateCourier = z.infer<typeof createCourierSchema>;

export type CourierDTO = Serialized<Omit<Courier, "shard">>;

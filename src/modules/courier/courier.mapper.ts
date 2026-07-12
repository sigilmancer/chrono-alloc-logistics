import type { Courier } from "@prisma/client";

import { omitShard } from "../shared/pagination";
import type { CourierDTO } from "./courier.schemas";

export function toCourierDTO(courier: Courier): CourierDTO {
  return omitShard(courier);
}

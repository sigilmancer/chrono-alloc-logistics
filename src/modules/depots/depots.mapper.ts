import type { Depot } from "@prisma/client";

import { omitShard } from "../shared/pagination";
import type { DepotDTO } from "./depots.schemas";

export function toDepotDTO(depot: Depot): DepotDTO {
  return omitShard(depot);
}

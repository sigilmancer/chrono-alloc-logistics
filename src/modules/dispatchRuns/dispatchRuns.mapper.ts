import type { DispatchRun } from "@prisma/client";

import { omitShard } from "../shared/pagination";
import type { DispatchRunDTO } from "./dispatchRuns.schemas";

export function toDispatchRunDTO(dispatchRun: DispatchRun): DispatchRunDTO {
  const { createdAt, startAt, endAt, cancelledAt, ...rest } = omitShard(dispatchRun);
  return {
    ...rest,
    createdAt: createdAt.toISOString(),
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    cancelledAt: cancelledAt?.toISOString() ?? null,
  };
}

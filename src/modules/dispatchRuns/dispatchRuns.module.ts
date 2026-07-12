import { Module } from "@nestjs/common";
import { DispatchRunsScheduler } from "./dispatchRuns.scheduler";
import { DispatchRunsController } from "./dispatchRuns.controller";
import { DispatchRunService } from "./dispatchRuns.service";

@Module({
  controllers: [DispatchRunsController],
  providers: [DispatchRunService, DispatchRunsScheduler],
})
export class DispatchRunsModule {}

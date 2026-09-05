import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DispatchRunService } from "./dispatchRuns.service";
import { DispatchRun } from "@prisma/client";

@Injectable()
export class DispatchRunsScheduler {
  private readonly logger = new Logger(DispatchRunsScheduler.name);
  private readonly targetShard = Number(process.env.SHARD_INSTANCE_ID) || 0;

  constructor(private readonly dispatchRunsService: DispatchRunService) {} 

  @Cron("* * * * *") //every minute
  async sendDispatchRunReminders() {
    
    this.logger.log(`Cron tick executed. Fetching dispatch runs...${this.targetShard}`);
    
    //shard-directed query: keeps database reads localised and fast
    const eligibleDispatchRuns = await this.dispatchRunsService.getDispatchRunForReminder(this.targetShard);
    this.logger.log(`Found ${eligibleDispatchRuns.length} dispatchRuns requiring notifications.`);

    if (eligibleDispatchRuns.length === 0) return;

    const chunkSize = 10;
    for(let i =0; i < eligibleDispatchRuns.length; i += chunkSize){
      const chunk = eligibleDispatchRuns.slice(i, i+ chunkSize);
      this.logger.log(`Processing sub-batch chunk: items ${i} to ${Math.min(i + chunkSize, eligibleDispatchRuns.length)}`);

      //concurrent processing: runs network requests in parallel to prevent event-loop blocking
      //limit timeouts using Promise.allSettled so one failure doesn't ruin the whole batch
      await Promise.allSettled(
        chunk.map(async (dispatchRun) => {
          try {
            //isolated error domains: ensures a crash on one dispatchRun doesn't halt others
            const success = await this.simulateNotification(dispatchRun);
            const status = success ? "SENT" : "FAILED";
            
            await this.dispatchRunsService.updateReminderStatus(dispatchRun.id, status, dispatchRun.shard);
          
          } catch (error) {
              let errorMessage = error instanceof Error? error.message : String(error);
            this.logger.error(`Failed to process reminder for DispatchRun ID ${dispatchRun.id}:`, errorMessage);
            //tag as failed in the DB so it can be handled by a dead-letter recovery routine
            await this.dispatchRunsService.updateReminderStatus(dispatchRun.id, "FAILED", dispatchRun.shard).catch(() => {});
          }
        })
      );
      }
  }

  private async simulateNotification(dispatchRun: DispatchRun): Promise<boolean> {
    this.logger.log(`Dispatching notification for DispatchRun ${dispatchRun.id} to courier ${dispatchRun.courierId}`);
    
    //simulate an external network dependency with a standard execution window
    return new Promise((resolve) => setTimeout(() => resolve(true), 200));
  }
}

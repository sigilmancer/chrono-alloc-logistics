import { Global, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { DispatchRunsModule } from "./modules/dispatchRuns/dispatchRuns.module";
import { CouriersModule } from "./modules/courier/courier.module";
import { DepotsModule } from "./modules/depots/depots.module";

@Global()
@Module({
  imports: [ScheduleModule.forRoot(),PrismaModule, DispatchRunsModule, CouriersModule, DepotsModule],
})
export class AppModule {}

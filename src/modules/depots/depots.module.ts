import { Module } from "@nestjs/common";

import { DepotsController } from "./depots.controller";
import { DepotsService } from "./depots.service";

@Module({
  controllers: [DepotsController],
  providers: [DepotsService],
})
export class DepotsModule {}

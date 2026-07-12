import { Module } from "@nestjs/common";

import { CouriersController } from "./courier.controller";
import { CouriersService } from "./courier.service";

@Module({
  controllers: [CouriersController],
  providers: [CouriersService],
})
export class CouriersModule {}

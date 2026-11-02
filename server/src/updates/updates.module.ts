import { Module } from "@nestjs/common";
import { UpdatesController } from "./updates.controller";
import { UpdatesService } from "./updates.service";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [ChatModule],
  controllers: [UpdatesController],
  providers: [UpdatesService],
  exports: [UpdatesService]
})
export class UpdatesModule {}

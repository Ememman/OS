import { Module } from "@nestjs/common";
import { GamesController } from "./games.controller";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [ChatModule],
  controllers: [GamesController],
})
export class GamesModule {}

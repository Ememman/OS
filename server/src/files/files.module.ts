import { Module } from "@nestjs/common";
import { FilesController } from "./files.controller";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [ChatModule],
  controllers: [FilesController],
})
export class FilesModule {}

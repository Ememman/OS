import { Module } from "@nestjs/common";
import { NotesController } from "./notes.controller";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [ChatModule],
  controllers: [NotesController],
})
export class NotesModule {}

import { Module } from "@nestjs/common";
import { ProjectsModule } from "./projects/projects.module";
import { UpdatesModule } from "./updates/updates.module";
import { MusicModule } from "./music/music.module";
import { ChatModule } from "./chat/chat.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [ProjectsModule, UpdatesModule, MusicModule, ChatModule],
  controllers: [HealthController]
})
export class AppModule {}


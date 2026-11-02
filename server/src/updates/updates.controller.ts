import { Controller, Get, Post, Delete, Body, Param, Inject } from "@nestjs/common";
import { UpdatesService, Update } from "./updates.service";
import { ChatGateway } from "../chat/chat.gateway";

@Controller("api/updates")
export class UpdatesController {
  constructor(
    private readonly updatesService: UpdatesService,
    @Inject(ChatGateway) private readonly chatGateway: ChatGateway
  ) {}

  @Get()
  getAll(): Update[] {
    return this.updatesService.findAll();
  }

  @Post()
  create(@Body() body: { title: string; body: string; tag?: string; author?: string }): Update {
    const created = this.updatesService.create(body);
    this.chatGateway.broadcast("update:new", created);
    return created;
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    const result = this.updatesService.remove(id);
    this.chatGateway.broadcast("update:deleted", { id });
    return result;
  }

  @Get("reactions")
  getReactions() {
    return this.updatesService.getReactions();
  }

  @Post(":id/react")
  react(
    @Param("id") id: string,
    @Body() body: { emoji?: string }
  ) {
    const result = this.updatesService.react(id, body?.emoji);
    this.chatGateway.broadcast("update:reacted", result);
    return result;
  }
}

import { Controller, Get, Post, Param } from "@nestjs/common";
import { UpdatesService, Update } from "./updates.service";

@Controller("api/updates")
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Get()
  getAll(): Update[] {
    return this.updatesService.findAll();
  }

  @Get("reactions")
  getReactions(): Record<string, number> {
    return this.updatesService.getReactions();
  }

  @Post(":id/react")
  react(@Param("id") id: string): { id: string; count: number } {
    return this.updatesService.react(id);
  }
}


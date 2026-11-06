import { Controller, Get, Post, Delete, Param, Query, Body } from "@nestjs/common";
import { UpdatesService, Update } from "./updates.service";

@Controller("api/updates")
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Get()
  getAll(
    @Query("tag") tag?: string,
    @Query("q") q?: string,
    @Query("sort") sort?: string
  ): Update[] {
    return this.updatesService.findAll(tag, q, sort);
  }

  @Get("reactions")
  getReactions() {
    return this.updatesService.getReactions();
  }

  @Post()
  create(@Body() body: Partial<Update>): Update {
    return this.updatesService.create(body);
  }

  @Post(":id/react")
  react(
    @Param("id") id: string,
    @Body("type") type?: "heart" | "fire" | "rocket" | "party"
  ) {
    return this.updatesService.react(id, type);
  }

  @Post(":id/pin")
  togglePin(@Param("id") id: string) {
    return this.updatesService.togglePin(id);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    const ok = this.updatesService.delete(id);
    return { ok, id };
  }
}

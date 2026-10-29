import { Controller, Get, Post, Param, NotFoundException, Inject } from "@nestjs/common";
import { ProjectsService, Project } from "./projects.service";
import { ChatGateway } from "../chat/chat.gateway";

@Controller("api/projects")
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    @Inject(ChatGateway) private readonly chatGateway: ChatGateway
  ) {}

  @Get()
  getAll(): Project[] {
    return this.projectsService.findAll();
  }

  @Get("likes")
  getLikes() {
    return this.projectsService.getLikes();
  }

  @Get("stats")
  getStats() {
    return this.projectsService.getStats();
  }

  @Post(":id/like")
  like(@Param("id") id: string) {
    const count = this.projectsService.likeProject(id);
    this.chatGateway.broadcast("project:liked", { id, count });
    return { id, count };
  }

  @Get(":id")
  getOne(@Param("id") id: string): Project {
    const proj = this.projectsService.findOne(id);
    if (!proj) throw new NotFoundException(`Project with ID ${id} not found`);
    return proj;
  }
}

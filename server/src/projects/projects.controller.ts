import { Controller, Get, Post, Body, Param, NotFoundException, Inject } from "@nestjs/common";
import { ProjectsService, Project, ProjectFeedback } from "./projects.service";
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

  @Get(":id/feedback")
  getFeedback(@Param("id") id: string): ProjectFeedback[] {
    return this.projectsService.getFeedback(id);
  }

  @Post(":id/feedback")
  addFeedback(
    @Param("id") id: string,
    @Body() body: { author?: string; role?: string; rating?: number; comment: string }
  ): ProjectFeedback {
    const feedback = this.projectsService.addFeedback(id, body);
    this.chatGateway.broadcast("project:feedback", feedback);
    return feedback;
  }

  @Get(":id")
  getOne(@Param("id") id: string): Project {
    const proj = this.projectsService.findOne(id);
    if (!proj) throw new NotFoundException(`Project with ID ${id} not found`);
    return proj;
  }
}

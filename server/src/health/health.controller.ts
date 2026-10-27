import { Controller, Get, Inject } from "@nestjs/common";
import { ChatGateway } from "../chat/chat.gateway";

@Controller("api/health")
export class HealthController {
  constructor(@Inject(ChatGateway) private readonly chatGateway: ChatGateway) {}

  @Get()
  check() {
    return {
      ok: true,
      timestamp: Date.now(),
      service: "Portfolio OS NestJS API & Gateway",
      uptimeSeconds: Math.floor(process.uptime()),
      realtime: { connectedClients: this.chatGateway.getOnlineCount() }
    };
  }
}

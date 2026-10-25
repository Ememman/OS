import { Controller, Get } from "@nestjs/common";

@Controller("api/health")
export class HealthController {
  @Get()
  check() {
    return {
      ok: true,
      timestamp: Date.now(),
      service: "Portfolio OS NestJS API & Gateway"
    };
  }
}


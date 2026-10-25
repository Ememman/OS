import "dotenv/config";
import "reflect-metadata";
import dns from "node:dns";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// Prioritize IPv4 for reliable outbound network requests on Windows
dns.setDefaultResultOrder("ipv4first");

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[NestJS] Portfolio OS API & Gateway listening on http://localhost:${port}`);
}

bootstrap();


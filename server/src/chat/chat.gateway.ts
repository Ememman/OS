import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { customAlphabet } from "nanoid";
import os from "node:os";

const ADJECTIVES = ["Swift", "Quiet", "Amber", "Cosmic", "Lucky", "Nimble", "Gentle", "Bright", "Wandering", "Velvet"];
const ANIMALS = ["Falcon", "Otter", "Lynx", "Comet", "Heron", "Fox", "Whale", "Sparrow", "Marlin", "Wren"];
const nano = customAlphabet("0123456789", 3);
const randomName = () =>
  `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]}${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}${nano()}`;

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  ts: number;
  reactions?: Record<string, number>;
}

@WebSocketGateway({ cors: { origin: "*" } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private chatHistory: ChatMessage[] = [];
  private readonly MAX_HISTORY = 100;
  private onlineCount = 0;

  afterInit(server: Server) {
    // Real-time system telemetry streaming to all connected clients
    setInterval(() => {
      if (this.onlineCount > 0 && this.server) {
        const mem = process.memoryUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
        const load = os.loadavg();
        this.server.emit("system:telemetry", {
          time: Date.now(),
          cpuPercent: Math.min(100, Math.max(5, Math.round((load[0] || 0.15) * 20))),
          memoryMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
          systemPercent: usedPercent,
          connectedClients: this.onlineCount,
          uptimeSeconds: Math.floor(process.uptime()),
        });
      }
    }, 2000);
  }

  getOnlineCount() {
    return this.onlineCount;
  }

  broadcast(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
    }
  }

  handleConnection(client: Socket) {
    const guestName = randomName();
    (client as any).guestName = guestName;
    this.onlineCount++;

    client.emit("chat:init", { name: guestName, history: this.chatHistory });
    this.server.emit("chat:presence", { online: this.onlineCount });
  }

  handleDisconnect(client: Socket) {
    this.onlineCount = Math.max(0, this.onlineCount - 1);
    this.server.emit("chat:presence", { online: this.onlineCount });
  }

  @SubscribeMessage("chat:rename")
  handleRename(@ConnectedSocket() client: Socket, @MessageBody() newName: string) {
    const clean = String(newName || "").trim().slice(0, 20);
    if (clean) (client as any).guestName = clean;
  }

  @SubscribeMessage("chat:message")
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() text: string
  ) {
    const clean = String(text || "").trim().slice(0, 500);
    if (!clean) return { ok: false, error: "empty" };

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: (client as any).guestName || "Guest",
      text: clean,
      ts: Date.now(),
      reactions: {}
    };

    this.chatHistory.push(msg);
    if (this.chatHistory.length > this.MAX_HISTORY) {
      this.chatHistory = this.chatHistory.slice(-this.MAX_HISTORY);
    }

    this.server.emit("chat:message", msg);
    return { ok: true, message: msg };
  }

  @SubscribeMessage("chat:react")
  handleReact(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: string; emoji: string }
  ) {
    const { id, emoji } = payload || {};
    const validEmojis = ["❤️", "👍", "🔥", "🚀", "😂"];
    if (!id || !validEmojis.includes(emoji)) return;

    const msg = this.chatHistory.find((m) => m.id === id);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
      this.server.emit("chat:reacted", { id, emoji, reactions: msg.reactions });
    }
  }

  @SubscribeMessage("chat:typing")
  handleTyping(@ConnectedSocket() client: Socket) {
    client.broadcast.emit("chat:typing", {
      name: (client as any).guestName || "Guest"
    });
  }
}

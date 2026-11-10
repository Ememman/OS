import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { customAlphabet } from "nanoid";

const ADJECTIVES = ["Swift", "Quiet", "Amber", "Cosmic", "Lucky", "Nimble", "Gentle", "Bright", "Wandering", "Velvet"];
const ANIMALS = ["Falcon", "Otter", "Lynx", "Comet", "Heron", "Fox", "Whale", "Sparrow", "Marlin", "Wren"];
const nano = customAlphabet("0123456789", 3);
const randomName = () =>
  `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]}${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}${nano()}`;

export interface ChatMessage {
  id: string;
  tempId?: string;
  senderId?: string;
  name: string;
  text: string;
  ts: number;
  reactions?: Record<string, number>;
  replyTo?: { id: string; name: string; text: string };
}

interface ConnectedUser {
  socketId: string;
  clientId: string;
  name: string;
  lastActive: number;
}

@WebSocketGateway({ cors: { origin: "*" } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private chatHistory: ChatMessage[] = [];
  private readonly MAX_HISTORY = 100;
  private readonly SESSION_TTL = 60 * 60 * 1000; // 1 hour inactivity timeout

  // Active connected sockets
  private connectedUsers = new Map<string, ConnectedUser>();
  // Preserved sessions across refresh/reconnect (clientId -> session)
  private knownSessions = new Map<string, { name: string; lastActive: number }>();

  private pruneExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of this.knownSessions.entries()) {
      if (now - session.lastActive > this.SESSION_TTL) {
        this.knownSessions.delete(id);
      }
    }
  }

  getOnlineCount(): number {
    const uniqueClientIds = new Set<string>();
    for (const u of this.connectedUsers.values()) {
      if (u.clientId) uniqueClientIds.add(u.clientId);
    }
    const socketCount = this.server?.sockets?.sockets?.size ?? this.connectedUsers.size;
    return Math.max(uniqueClientIds.size, socketCount, 1);
  }

  getUserList(): Array<{ name: string; clientId?: string }> {
    const seen = new Set<string>();
    const list: Array<{ name: string; clientId?: string }> = [];
    for (const u of this.connectedUsers.values()) {
      const key = u.clientId || u.name;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ name: u.name, clientId: u.clientId });
      }
    }
    return list;
  }

  broadcastPresence() {
    const online = this.getOnlineCount();
    const users = this.getUserList();
    if (this.server) {
      this.server.emit("chat:presence", { online, users });
      this.server.emit("chat:users_updated", users);
    }
  }

  broadcast(event: string, data: any) {
    if (this.server) {
      this.server.emit(event, data);
    }
  }

  handleConnection(client: Socket) {
    this.pruneExpiredSessions();

    const auth = (client.handshake?.auth as any) || {};
    const query = (client.handshake?.query as any) || {};
    const incomingClientId = String(auth.clientId || query.clientId || client.id);
    const incomingName = String(auth.name || query.name || "").trim().slice(0, 20);

    let guestName = incomingName;
    if (!guestName && this.knownSessions.has(incomingClientId)) {
      guestName = this.knownSessions.get(incomingClientId)!.name;
    }
    if (!guestName) {
      guestName = randomName();
    }

    this.knownSessions.set(incomingClientId, { name: guestName, lastActive: Date.now() });
    this.connectedUsers.set(client.id, {
      socketId: client.id,
      clientId: incomingClientId,
      name: guestName,
      lastActive: Date.now(),
    });

    (client as any).guestName = guestName;
    (client as any).clientId = incomingClientId;

    client.emit("chat:init", {
      name: guestName,
      history: this.chatHistory,
      online: this.getOnlineCount(),
      users: this.getUserList(),
    });

    this.broadcastPresence();
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    this.broadcastPresence();
  }

  @SubscribeMessage("chat:join")
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() payload?: any) {
    this.pruneExpiredSessions();

    const incomingClientId = (typeof payload === "object" && payload?.clientId)
      ? String(payload.clientId)
      : (client as any).clientId || client.id;
    const incomingName = (typeof payload === "object" && payload?.name)
      ? String(payload.name).trim().slice(0, 20)
      : "";

    let guestName = incomingName || (client as any).guestName;
    if (!guestName && this.knownSessions.has(incomingClientId)) {
      guestName = this.knownSessions.get(incomingClientId)!.name;
    }
    if (!guestName) {
      guestName = randomName();
    }

    this.knownSessions.set(incomingClientId, { name: guestName, lastActive: Date.now() });
    this.connectedUsers.set(client.id, {
      socketId: client.id,
      clientId: incomingClientId,
      name: guestName,
      lastActive: Date.now(),
    });

    (client as any).guestName = guestName;
    (client as any).clientId = incomingClientId;

    client.emit("chat:init", {
      name: guestName,
      history: this.chatHistory,
      online: this.getOnlineCount(),
      users: this.getUserList(),
    });

    this.broadcastPresence();
  }

  @SubscribeMessage("chat:rename")
  handleRename(@ConnectedSocket() client: Socket, @MessageBody() newName: string) {
    const clean = String(newName || "").trim().slice(0, 20);
    if (!clean) return;

    (client as any).guestName = clean;
    const clientId = (client as any).clientId || client.id;

    this.knownSessions.set(clientId, { name: clean, lastActive: Date.now() });
    const user = this.connectedUsers.get(client.id);
    if (user) {
      user.name = clean;
      user.lastActive = Date.now();
    }

    this.broadcastPresence();
  }

  @SubscribeMessage("chat:message")
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {
    const textRaw = typeof payload === "string" ? payload : payload?.text;
    const clean = String(textRaw || "").trim().slice(0, 500);
    if (!clean) return { ok: false, error: "empty" };

    const customName = typeof payload === "object" && payload?.senderName ? String(payload.senderName).trim().slice(0, 20) : "";
    const name = customName || (client as any).guestName || "Anonymous";
    if (customName) (client as any).guestName = customName;

    const senderId = (typeof payload === "object" && payload?.senderId) ? String(payload.senderId) : (client as any).clientId || client.id;
    const tempId = (typeof payload === "object" && payload?.tempId) ? String(payload.tempId) : undefined;
    const replyTo = (typeof payload === "object" && payload?.replyTo) ? payload.replyTo : undefined;

    // Refresh activity timestamp
    if (this.knownSessions.has(senderId)) {
      this.knownSessions.get(senderId)!.lastActive = Date.now();
      if (customName) this.knownSessions.get(senderId)!.name = customName;
    }
    const user = this.connectedUsers.get(client.id);
    if (user) {
      user.lastActive = Date.now();
      if (customName) user.name = customName;
    }

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tempId,
      senderId,
      name,
      text: clean,
      ts: Date.now(),
      reactions: {},
      replyTo
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
    @MessageBody() payload: { id: string; emoji?: string; key?: string; senderId?: string }
  ) {
    if (!payload?.id) return;
    const rawEmoji = String(payload.emoji || payload.key || "").trim();
    const EMOJI_MAP: Record<string, string> = {
      heart: "heart",
      "❤️": "heart",
      thumbsup: "thumbsup",
      "👍": "thumbsup",
      smile: "smile",
      "😂": "smile",
      "😆": "smile",
      flame: "flame",
      "🔥": "flame",
      rocket: "rocket",
      "🚀": "rocket",
      zap: "zap",
      "⚡": "zap",
      party: "zap",
      "🎉": "zap",
    };
    const canonicalKey = EMOJI_MAP[rawEmoji] || rawEmoji;
    if (!canonicalKey) return;

    const senderId = payload.senderId || (client as any).clientId || client.id;
    const msg = this.chatHistory.find((m) => m.id === payload.id);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      msg.reactions[canonicalKey] = (msg.reactions[canonicalKey] || 0) + 1;
      this.server.emit("chat:reacted", {
        id: payload.id,
        emoji: canonicalKey,
        reactions: msg.reactions,
        senderId,
      });
    }
  }

  @SubscribeMessage("chat:typing")
  handleTyping(@ConnectedSocket() client: Socket) {
    const name = (client as any).guestName || "Someone";
    client.broadcast.emit("chat:typing", { name });
  }
}

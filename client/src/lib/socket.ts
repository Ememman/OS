import { io, Socket } from "socket.io-client";
import { API_URL } from "./config";
import { getChatSession } from "./chatSession";

let socketInstance: Socket | null = null;
let cachedChatInit: any = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const session = getChatSession();

    socketInstance = io(API_URL, {
      autoConnect: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        clientId: session.clientId,
        name: session.name,
      },
      query: {
        clientId: session.clientId,
        name: session.name,
      },
    });

    socketInstance.on("chat:init", (data) => {
      cachedChatInit = data;
    });

    socketInstance.on("chat:presence", (data) => {
      if (cachedChatInit) {
        if (typeof data?.online === "number") cachedChatInit.online = data.online;
        if (data?.users) cachedChatInit.users = data.users;
      }
    });
  }
  return socketInstance;
}

export function getCachedChatInit(): any {
  return cachedChatInit;
}

export const socket: Socket = getSocket();

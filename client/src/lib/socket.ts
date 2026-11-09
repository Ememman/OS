import { io, Socket } from "socket.io-client";
import { API_URL } from "./config";

let socketInstance: Socket | null = null;
let cachedChatInit: any = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(API_URL, {
      autoConnect: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketInstance.on("chat:init", (data) => {
      cachedChatInit = data;
    });
  }
  return socketInstance;
}

export function getCachedChatInit(): any {
  return cachedChatInit;
}

export const socket: Socket = getSocket();

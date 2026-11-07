import { io, Socket } from "socket.io-client";
import { API_URL } from "./config";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(API_URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socketInstance;
}

export const socket: Socket = getSocket();

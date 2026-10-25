import { io } from "socket.io-client";
import { API_URL } from "./config";

let socket;
export function getSocket() {
  if (!socket) {
    socket = io(API_URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socket;
}

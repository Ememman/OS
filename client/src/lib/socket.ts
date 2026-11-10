import { io, Socket } from "socket.io-client";
import { API_URL } from "./config";
import { getChatSession } from "./chatSession";
import { useOS } from "../store/useOS";

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

    socketInstance.on("chat:message", (msg) => {
      if (cachedChatInit?.history && Array.isArray(cachedChatInit.history)) {
        if (!cachedChatInit.history.some((m: any) => m.id === msg.id)) {
          cachedChatInit.history.push(msg);
        }
      }

      const state = useOS.getState();
      const chatWin = state.windows.find((w: any) => w.app === "chats");
      const isChatVisible = chatWin && !chatWin.minimized;
      const curSession = getChatSession();
      const isFromMe = Boolean(msg?.senderId && msg.senderId === curSession.clientId);

      if (!isFromMe && (!isChatVisible || (typeof document !== "undefined" && document.hidden))) {
        state.incrementUnreadChat();
      }
    });
  }
  return socketInstance;
}

export function getCachedChatInit(): any {
  return cachedChatInit;
}

export const socket: Socket = getSocket();

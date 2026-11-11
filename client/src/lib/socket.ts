import { io, Socket } from "socket.io-client";
import { API_URL } from "./config";
import { getChatSession, getLastReadChatTs, setLastReadChatTs } from "./chatSession";
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

      const history = data?.history;
      if (Array.isArray(history) && history.length > 0) {
        const state = useOS.getState();
        const chatWin = state.windows.find((w: any) => w.app === "chats");
        const isChatVisible = chatWin && !chatWin.minimized;
        const curSession = getChatSession();
        const lastReadTs = getLastReadChatTs();

        if (lastReadTs > 0) {
          const unreadCount = history.filter((m: any) => {
            const isFromMe = Boolean(
              (m?.senderId && m.senderId === curSession.clientId) ||
              (curSession.name && m?.name && m.name.toLowerCase() === curSession.name.toLowerCase())
            );
            return !isFromMe && m.ts > lastReadTs;
          }).length;

          if (!isChatVisible || (typeof document !== "undefined" && document.hidden)) {
            state.setUnreadChatCount(unreadCount);
          } else {
            state.setUnreadChatCount(0);
          }
        } else {
          // On brand-new device / first visit, initialize lastReadTs to newest message
          const latestTs = history[history.length - 1]?.ts || Date.now();
          setLastReadChatTs(latestTs);
        }
      }
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
      const isFromMe = Boolean(
        (msg?.senderId && msg.senderId === curSession.clientId) ||
        (curSession.name && msg?.name && msg.name.toLowerCase() === curSession.name.toLowerCase())
      );

      if (!isFromMe && (!isChatVisible || (typeof document !== "undefined" && document.hidden))) {
        state.incrementUnreadChat();
      } else if (isChatVisible && typeof document !== "undefined" && !document.hidden) {
        setLastReadChatTs(msg.ts || Date.now());
      }
    });
  }
  return socketInstance;
}

export function getCachedChatInit(): any {
  return cachedChatInit;
}

export const socket: Socket = getSocket();

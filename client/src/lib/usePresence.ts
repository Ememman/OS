import { useEffect, useState } from "react";
import { getSocket } from "./socket";

/**
 * Subscribes to the same Socket.IO connection used by the Chats app to track
 * how many people currently have this portfolio open — genuinely real-time,
 * synced across every connected visitor, not a local fake counter.
 */
export function usePresence() {
  const [online, setOnline] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onPresence = ({ online }) => setOnline(online);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("chat:presence", onPresence);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("chat:presence", onPresence);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { online, connected };
}

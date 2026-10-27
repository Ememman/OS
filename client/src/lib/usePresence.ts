import { useEffect, useState } from "react";
import { getSocket } from "./socket";
import { API_URL } from "./config";

/**
 * Subscribes to the same Socket.IO connection used by the Chats app to track
 * how many people currently have this portfolio open — genuinely real-time,
 * synced across every connected visitor, not a local fake counter.
 */
export function usePresence() {
  const [online, setOnline] = useState(null);
  const [connected, setConnected] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    const socket = getSocket();
    let active = true;

    const onPresence = ({ online }) => setOnline(online);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const checkApi = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`${API_URL}/api/health`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Health check returned ${response.status}`);
        const health = await response.json();
        if (active) setApiStatus(health.ok === true ? "available" : "unavailable");
      } catch {
        if (active) setApiStatus("unavailable");
      } finally {
        window.clearTimeout(timeout);
      }
    };

    checkApi();
    const healthInterval = window.setInterval(checkApi, 30000);
    window.addEventListener("online", checkApi);
    socket.on("chat:presence", onPresence);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("chat:presence", onPresence);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      active = false;
      window.clearInterval(healthInterval);
      window.removeEventListener("online", checkApi);
    };
  }, []);

  return { online, connected, apiStatus };
}

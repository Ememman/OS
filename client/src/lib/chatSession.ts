// Session and inactivity management for Portfolio OS Chat
// Rules: User identity persists across refreshes and tabs.
// User identity and chat history remain intact even if user doesn't open the system for days.
// After 1 week (7 days / 604800000ms) of complete inactivity, a fresh user session is generated.

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (1 week) of inactivity

export interface ChatSession {
  clientId: string;
  name: string;
  lastActive: number;
}

export function getChatSession(): ChatSession {
  if (typeof window === "undefined") {
    return { clientId: "ssr", name: "", lastActive: Date.now() };
  }

  const storedActive = localStorage.getItem("os_chat_last_active");
  const storedClientId = localStorage.getItem("os_chat_client_id");
  const storedName = localStorage.getItem("os_chat_name") || "";
  const now = Date.now();

  const lastActive = storedActive ? Number(storedActive) : 0;
  const isExpired = !lastActive || now - lastActive > SESSION_EXPIRY_MS || !storedClientId;

  if (isExpired) {
    // Generate a fresh session after 1 week (7 days) of inactivity or on first visit
    const newClientId = "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("os_chat_client_id", newClientId);
    localStorage.removeItem("os_chat_name"); // Clears old identity so a new user is created
    localStorage.setItem("os_chat_last_active", String(now));
    return {
      clientId: newClientId,
      name: "",
      lastActive: now,
    };
  }

  // Still active within 1 week (7 days): maintain identity and refresh activity timestamp
  localStorage.setItem("os_chat_last_active", String(now));
  return {
    clientId: storedClientId,
    name: storedName,
    lastActive: now,
  };
}

export function touchChatActivity(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("os_chat_last_active", String(Date.now()));
  }
}

export function saveChatName(name: string): void {
  if (typeof window !== "undefined") {
    const clean = String(name || "").trim().slice(0, 20);
    if (clean) {
      localStorage.setItem("os_chat_name", clean);
    }
    touchChatActivity();
  }
}

const ADJECTIVES = ["Swift", "Quiet", "Amber", "Cosmic", "Lucky", "Nimble", "Gentle", "Bright", "Wandering", "Velvet"];
const ANIMALS = ["Falcon", "Otter", "Lynx", "Comet", "Heron", "Fox", "Whale", "Sparrow", "Marlin", "Wren"];

export function generateRandomGuestName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${animal}${num}`;
}

/**
 * Returns the user's active chat name / nickname.
 * If not set yet, automatically establishes an identical random nickname (e.g. SwiftFalcon123)
 * and saves it into localStorage (`os_chat_name`), ensuring 100% sync across Chats and Games.
 */
export function getEffectiveChatName(): string {
  if (typeof window === "undefined") return "Player";
  const session = getChatSession();
  if (session.name && session.name.trim()) return session.name.trim();
  const cached = localStorage.getItem("os_chat_name");
  if (cached && cached.trim()) return cached.trim();
  const generated = generateRandomGuestName();
  saveChatName(generated);
  return generated;
}

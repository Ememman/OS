import { Avatar, Style } from "@dicebear/core";
import loreleiJson from "@dicebear/styles/lorelei.json";
import botttsJson from "@dicebear/styles/bottts.json";
import avataaarsJson from "@dicebear/styles/avataaars.json";
import shapesJson from "@dicebear/styles/shapes.json";
import thumbsJson from "@dicebear/styles/thumbs.json";

export interface AvatarStyleOption {
  id: string;
  label: string;
  description: string;
}

export const AVATAR_STYLES: AvatarStyleOption[] = [
  { id: "lorelei", label: "Portraits", description: "Modern refined illustrated portraits" },
  { id: "bottts", label: "Robots", description: "Tech & cybernetic engineering avatars" },
  { id: "avataaars", label: "Personas", description: "Diverse expressive avatars" },
  { id: "shapes", label: "Geometric", description: "Minimalist abstract vector shapes" },
  { id: "thumbs", label: "Playful", description: "Subtle friendly thumb moods" },
];

export const PRESET_SEEDS: Record<string, string[]> = {
  lorelei: ["Julian", "Elena", "Marcus", "Aria", "Maya", "Sora"],
  bottts: ["Nexus7", "ByteWave", "AeroBot", "CyberNova", "PixelPulse", "Vortex"],
  avataaars: ["Jordan", "Taylor", "Morgan", "Casey", "Devon", "Sam"],
  shapes: ["Matrix", "Prism", "Echo", "Aura", "Quantum", "Orbit"],
  thumbs: ["Calm", "Happy", "Chill", "Wink", "Cheer", "Zen"],
};

// Cache style instances
const styleInstances: Record<string, Style<any>> = {
  lorelei: new Style(loreleiJson as any),
  bottts: new Style(botttsJson as any),
  avataaars: new Style(avataaarsJson as any),
  shapes: new Style(shapesJson as any),
  thumbs: new Style(thumbsJson as any),
};

// In-memory cache for generated data URIs
const avatarCache = new Map<string, string>();

/**
 * Generate an avatar SVG data URI using @dicebear/core and @dicebear/styles.
 * Falls back to the official DiceBear HTTP API if needed.
 */
export function generateAvatarDataUri(style: string, seed: string): string {
  const cleanStyle = style.toLowerCase().trim() || "lorelei";
  const cleanSeed = (seed || "guest").trim();
  const cacheKey = `${cleanStyle}:${cleanSeed}`;

  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }

  const styleObj = styleInstances[cleanStyle];
  if (styleObj) {
    try {
      const avatar = new Avatar(styleObj, {
        seed: cleanSeed,
      });
      const dataUri = avatar.toDataUri();
      avatarCache.set(cacheKey, dataUri);
      return dataUri;
    } catch {
      // Fallback below
    }
  }

  const fallbackUri = `https://api.dicebear.com/9.x/${cleanStyle}/svg?seed=${encodeURIComponent(cleanSeed)}`;
  avatarCache.set(cacheKey, fallbackUri);
  return fallbackUri;
}

/**
 * Resolves any avatar string (URL, data URI, or "style:seed" notation) into an image src.
 */
export function resolveAvatarSrc(avatarStr?: string, fallbackSeed = "guest"): string {
  if (!avatarStr || !avatarStr.trim()) {
    return generateAvatarDataUri("lorelei", fallbackSeed);
  }

  const trimmed = avatarStr.trim();

  // If it's already an HTTP URL or data URI, return as-is
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  // Format: "style:seed"
  if (trimmed.includes(":")) {
    const [style, ...seedParts] = trimmed.split(":");
    const seed = seedParts.join(":");
    return generateAvatarDataUri(style, seed || fallbackSeed);
  }

  // If it's an emoji or plain word, default to lorelei style with that as seed
  return generateAvatarDataUri("lorelei", trimmed);
}

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

export let isDbConnected = false;

// 1. Chat Message Schema
const ChatMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    senderId: { type: String, default: "" },
    name: { type: String, required: true },
    text: { type: String, required: true },
    ts: { type: Number, required: true, index: true },
    reactions: { type: Map, of: Number, default: () => new Map() },
    userReactions: { type: Map, of: String, default: () => new Map() },
    replyTo: {
      id: String,
      name: String,
      text: String,
    },
    isPinned: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// 2. Arcade Game Leaderboard Schema
const GameScoreSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    game: { type: String, required: true, index: true },
    gameName: { type: String, required: true },
    player: { type: String, required: true, index: true },
    score: { type: Number, required: true, index: true },
    details: { type: String, default: "" },
    badge: { type: String, default: "🎮 Player" },
    ts: { type: Number, required: true, index: true },
  },
  { timestamps: true }
);

// Compound index to quickly find a player's best score for a specific game
GameScoreSchema.index({ game: 1, player: 1 });

// 3. Guestbook Entry Schema
const GuestbookSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, default: "Visitor" },
    message: { type: String, required: true },
    avatar: { type: String, default: "" },
    reactions: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
    ts: { type: Number, required: true, index: true },
  },
  { timestamps: true }
);

// 4. Contact / Hire Inquiry Schema
const ContactInquirySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, default: "General Inquiry" },
    message: { type: String, required: true },
    ts: { type: Number, required: true, index: true },
  },
  { timestamps: true }
);

export const ChatModel = mongoose.model("ChatMessage", ChatMessageSchema);
export const GameScoreModel = mongoose.model("GameScore", GameScoreSchema);
export const GuestbookModel = mongoose.model("Guestbook", GuestbookSchema);
export const ContactInquiryModel = mongoose.model("ContactInquiry", ContactInquirySchema);

/**
 * Connect to MongoDB Atlas with automatic retry and graceful fallback
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("[MongoDB] No MONGODB_URI found in environment. Running in memory-only fallback mode.");
    return false;
  }

  try {
    // Configure mongoose connection
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });

    isDbConnected = true;
    console.log("[MongoDB] Successfully connected to MongoDB Atlas!");
    return true;
  } catch (err) {
    console.error("[MongoDB] Connection failed:", err.message);
    console.log("[MongoDB] Falling back to in-memory storage. Server will remain fully operational.");
    isDbConnected = false;
    return false;
  }
}

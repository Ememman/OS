# Bron Mendoza — Portfolio OS

A macOS-desktop-style portfolio: draggable windows, a dock, desktop icons, and live widgets (clock, calendar, weather), built with **React + Vite + Tailwind v4** on the frontend and **Express + Socket.IO** on the backend.

```
portfolio-os/
├── client/     React/Vite/Tailwind frontend (the desktop UI)
└── server/     Express API + Socket.IO (chat, updates, project data)
```

## Apps included

| App | What it does | Status |
|---|---|---|
| Library | Your projects (SandreaLee Salon apps, Straive IMS), pulled from the API with a local fallback | Working |
| Music | Playlist-based audio player (Lo-fi / Synthwave / Chill placeholders) plus real song search with **two modes**: 30-second previews (Apple's iTunes Search API, backend-proxied) and **full-length playback** via YouTube's official embedded player — search literally any song, with quick-search chips for "Photograph" (Ed Sheeran), "Anti-Hero" (Taylor Swift), "Forever" (Chris Brown), "Kanibalismo", "Kalapastangan" (Fitter Karma), and "About You" (The 1975). **Playback now persists when the Music window is minimized or closed** — a floating mini-player appears showing what's playing, with its own play/pause/skip, until you either stop it or reopen the app. A live canvas visualizer reacts to whatever's actually playing, and an animated "now playing" equalizer indicator shows up next to the active track everywhere (sidebar, search results, mini-player). Add preview results to a persistent "My Mix" playlist | Working — see note below on licensing |
| Updates | Activity feed with like reactions, backed by the API | Working |
| Chats | Manga/comic-book styled live chat — halftone paper background (5 selectable panel styles via the palette icon in the header), speech bubbles with tails (own messages tinted with your accent color), character-color avatars per guest name, a bold "ON AIR" status stamp, and a black comic caption-box composer. Messages send optimistically with a server acknowledgement — you see your message immediately, with a clear "failed, tap to retry" state if the round-trip doesn't confirm, instead of silently vanishing. Same anonymous, no-login Socket.IO chat underneath | Working |
| Gallery | Filterable image grid with a lightbox | Working — swap placeholder images for your own |
| Games | Block Blast — full 8×8 puzzle game with a responsive fluid board (scales to any screen size), drop/clear animations, score popups, a board-shake on clears, a procedurally-generated background music loop plus sound effects (placement, combo clears, game over) with a mute toggle, plus a "coming soon" list for future games | Working |
| Settings | Reorganized into Appearance / Widgets / Sound & Motion / Danger Zone. Desktop style, **Dock position (bottom/left/right, macOS only)**, wallpaper, custom accent color (presets + hex picker), **glass intensity slider** (controls how translucent windows/widgets/menus look), photo widget, weather location (city search or "use my location"), reduce motion, chat sound, compact dock/taskbar density, and reset-to-defaults | Working |
| Files | A Finder/Explorer-style virtual file browser — Favorites sidebar, breadcrumb navigation, grid/list view. Folders link to Projects, Gallery, Games, and Music; text files (bio, skills, README) open inline | Working |
| Resume | Résumé summary + PDF download button | Working — drop your real PDF in `client/public/resume.pdf` |
| Menu bar | Fully functional File/Edit/View/Window/Help dropdowns (close windows, toggle fullscreen, reduce motion, jump between open windows, copy portfolio link) plus a working Spotlight-style app search | Working |
| Windows 11 extras | A working Start menu (pinned apps grid), a functional "show hidden icons" tray flyout, and click-to-expand Weather/Date flyouts in the taskbar, matching real Windows 11 behavior | Working |
| Responsive | Windows go edge-to-edge and lock dragging/resizing on phones and tablets; the widget stack reflows into a single, centered scrollable column with real spacing between cards; the dock/taskbar shrink and scroll horizontally if needed — with the scrollbar itself hidden (native mobile app convention: swipeable, not a visible scroll bar cluttering the screen); the menu bar collapses into a mobile action sheet. The Windows 11 Start menu, tray flyout, and date/weather flyouts are all viewport-clamped and animate in. Default glass panel opacity was also lowered for a lighter look out of the box — adjustable anytime via the Settings glass intensity slider | Working |
| Real-time features | A live visitor counter (Socket.IO presence, synced across every open tab/device — not a local fake number) in both the macOS menu bar and Windows taskbar; Update reactions sync instantly across everyone viewing the app; Music has an actual Web Audio API frequency analyser driving its visualizer off the real playing audio | Working |
| Window animations | Opening, closing, and minimizing windows now animate — minimize genie-shrinks toward the dock/taskbar, close fades out, open scales in | Working |
| Widgets | Photo, weather forecast card, a single exact-time clock (analog + digital), agenda (click to expand into a full month calendar with event dots and integrated back navigation), a sticky note, and colorful shortcut tiles | Working — set your own photo and weather city in Settings |

## Running it locally

**Backend**
```bash
cd server
npm install
npm run dev        # http://localhost:4000
```

**Frontend** (in a second terminal)
```bash
cd client
npm install
cp .env.example .env   # points VITE_API_URL at your backend
npm run dev             # http://localhost:5173
```

## Wallpaper images

Three custom wallpapers (`Mountain View`, `Night City`, `Forest Path`) are wired up in Settings, but the actual image files need to be dropped in yourself:

```
client/public/wallpapers/BG_1.png
client/public/wallpapers/BG_2.png
client/public/wallpapers/BG_3.png
```

Until they're there, each one falls back to a dark gradient automatically (no broken-image icon). Rename your files to exactly `BG_1.png`, `BG_2.png`, `BG_3.png` (or update the paths in `client/src/components/Wallpaper.jsx` and `client/src/components/apps/Settings.jsx` if you'd rather keep your own filenames).

## About the Music search feature

The Search tab in Music has two modes:

- **Previews**: Apple's public iTunes Search API (proxied through `server/index.js` to dodge CORS), returning **real, officially-provided 30-second previews** of virtually any commercially released song. Same mechanism apps like Shazam use. No setup needed.
- **Full Song**: real search results from the official **YouTube Data API**, with full-length playback via YouTube's own embedded player. This needs a free API key — see setup below. Without one configured, this tab still works, it just gives you a one-tap "Open on YouTube" link instead of inline results (YouTube locked down the old no-key "search inside the embed" trick a while back, so a proper API key is the only reliable way to get real inline results now).

Neither mode downloads, stores, or serves copyrighted audio files from this app's own servers — that would mean distributing unlicensed music, which this project intentionally does not do. Both are legitimate third-party integrations that play content through the original platform's own official embed/API surface. Each preview result also has an "open in Apple Music" link to hear the full track there directly.

**To enable inline Full Song search results:**
1. `cp server/.env.example server/.env`
2. Get a free key: [console.cloud.google.com](https://console.cloud.google.com/apis/library/youtube.googleapis.com) → create a project → enable "YouTube Data API v3" → Credentials → Create API Key
3. Paste it into `server/.env` as `YOUTUBE_API_KEY=...`
4. Restart the backend (`npm run dev` in `server/`)

**If the Previews tab (or anything hitting an external API) says "couldn't reach the search API" / server logs show `fetch failed`:** that's almost always the network the backend is running on blocking outbound HTTPS — a corporate firewall, VPN, or restricted network — not a bug in the code. The server logs the actual underlying cause (DNS failure, connection refused, timeout, etc.) to the terminal now; check there first.

If you want full-length playback of your *own* music without relying on either external service, that's what the Ambient playlists are for — replace the placeholder tracks in `client/src/data/music.js` with royalty-free files or tracks you hold the rights to, hosted in `client/public/audio/`.

**Background playback**: Ambient tracks and Preview results keep playing when you minimize or close the Music window — the actual audio element lives outside any window's lifecycle (`GlobalAudioPlayer.jsx`, mounted once at the app root), and a floating mini-player (`MiniPlayer.jsx`) appears near the dock/taskbar so it's obvious something's still playing. It stops only when you pause it, hit stop, or the track finishes with nothing queued next. Full Song (YouTube) playback is scoped to the Music window itself and does pause when the window closes — persisting an embedded video player the same way would need the iframe to stay mounted and visible somewhere at all times, which is a heavier lift than this pass covers.

## Things worth doing before you launch this

1. **Resume**: add your real PDF at `client/public/resume.pdf`, and edit the content in `client/src/components/apps/Resume.jsx`.
2. **Music**: the tracks in `client/src/data/music.js` are freely-licensed placeholder audio (SoundHelix demo tracks) so the player works out of the box. Replace them with your own MP3s in `client/public/audio/` and update the `src` paths.
3. **Gallery**: swap the Unsplash placeholder images in `client/src/data/gallery.js` for real screenshots/photos.
4. **Chat persistence**: chat history currently lives in memory on the server and resets on restart (last 100 messages while it's running). If you want messages to survive restarts, swap the in-memory array in `server/index.js` for MongoDB — you're already comfortable with that stack.
5. **Deploying**: `client` deploys as a static site (Vercel/Netlify — set `VITE_API_URL` to your deployed backend URL). `server` deploys anywhere that runs Node with a WebSocket-friendly host (Render, Railway, Fly.io). Because it's Socket.IO-based, avoid serverless functions for the backend.

## Design notes

- Three wallpapers ship out of the box: **Night Ocean & Balloon** (matches your reference image), **Deep Galaxy**, and **Aurora Coast** — all pure CSS/SVG, no image assets to host.
- Accent color is a CSS variable (`--accent`) so Settings can repaint focus rings, hover states, and highlights across every app instantly.
- Type system: Space Grotesk (display/headings), Inter (body), JetBrains Mono (timestamps/data).

## Ideas for later

- Spotlight-style search (⌘K) across projects and updates
- A "Notes" or "Terminal" app as an easter egg
- Drag-and-drop desktop icon repositioning (currently fixed)
- Push notifications from Updates using the Notification API

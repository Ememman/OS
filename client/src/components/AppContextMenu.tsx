import { useEffect, useRef } from "react";
import { useOS } from "../store/useOS";
import { useDesktopStore } from "../store/useDesktopStore";
import { APP_REGISTRY } from "../types/desktop";
import { soundFx } from "../lib/soundFx";
import {
  GIconSquare,
  GIconMinus,
  GIconClose,
  GIconChrome,
  GIconSafari,
  GIconShield,
  GIconCircleInfo,
  GIconLink,
  GIconFolder,
  GIconNotes,
  GIconTerminal,
  GIconMusic,
  GIconCalculator,
  GIconActivity,
  GIconChats,
  GIconSliders,
  GIconGames,
  GIconUpdates,
  GIconResume,
  GIconTrash,
} from "./icons/GravityIcons";

export default function AppContextMenu() {
  const {
    appContextMenu,
    closeAppContextMenu,
    openApp,
    closeWindow,
    restoreWindow,
    requestMinimize,
    focusWindow,
    windows,
    osMode,
    pinAppToDock,
    unpinAppFromDock,
    isAppPinnedToDock,
    openAppProperties,
    notify,
    systemSounds,
  } = useOS();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const isWin = osMode === "win";

  // Dismiss on outside click or Escape
  useEffect(() => {
    if (!appContextMenu) return;

    const handleDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (menuRef.current && !menuRef.current.contains(target)) {
        closeAppContextMenu();
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAppContextMenu();
    };

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("touchstart", handleDown, { passive: true });
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("touchstart", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [appContextMenu, closeAppContextMenu]);

  if (!appContextMenu) return null;

  const { app, x, y, source, desktopItemId, folderId, customLabel, customColor } = appContextMenu;
  const isFolder = source === "folder" || !!folderId;

  const reg = APP_REGISTRY[app];
  const AppIcon = isFolder
    ? GIconFolder
    : app === "browser"
      ? isWin
        ? GIconChrome
        : GIconSafari
      : reg?.icon || GIconSquare;

  const appLabel =
    customLabel ||
    (isFolder
      ? "Folder"
      : app === "activity" && isWin
        ? "Task Manager"
        : app === "browser" && isWin
          ? "Google Chrome"
          : reg?.label || app);

  const appColor = customColor || (app === "browser" && isWin ? "#4285F4" : reg?.color || "#38bdf8");

  // Check active window state
  const existingWin = windows.find((w) => w.app === app);
  const isRunning = Boolean(existingWin);
  const isMinimized = existingWin?.minimized ?? false;
  const isPinned = isAppPinnedToDock(app);

  // Position clamping
  const menuW = 230;
  const menuH = isWin ? 390 : 360;
  const clampedX = Math.max(10, Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 800) - menuW - 10));
  const clampedY = Math.max(10, Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 600) - menuH - 10));

  const handleOpen = () => {
    if (systemSounds) soundFx.playClick();
    if (isFolder && folderId) {
      useDesktopStore.getState().openFolder(folderId);
    } else if (existingWin) {
      if (isMinimized) {
        restoreWindow(existingWin.id);
      } else {
        focusWindow(existingWin.id);
      }
    } else {
      openApp(app);
    }
    closeAppContextMenu();
  };

  const handleRunAsAdmin = () => {
    if (systemSounds) soundFx.playOpen();
    openApp(app);
    notify(
      isWin ? "Run as Administrator" : "Launch in Isolated Sandbox",
      `${appLabel} launched with administrative privileges and clean buffer.`,
      "success",
      3000
    );
    closeAppContextMenu();
  };

  const handlePinToggle = () => {
    if (systemSounds) soundFx.playPop();
    if (isPinned) {
      unpinAppFromDock(app);
    } else {
      pinAppToDock(app);
    }
    closeAppContextMenu();
  };

  const handleCreateDesktopShortcut = () => {
    if (systemSounds) soundFx.playPop();
    useDesktopStore.getState().addOrPositionApp(app);
    notify("Desktop Shortcut", `Created shortcut for ${appLabel} on Desktop.`, "success", 2000);
    closeAppContextMenu();
  };

  const handleDeleteShortcut = () => {
    if (systemSounds) soundFx.playClose();
    if (desktopItemId) {
      useDesktopStore.getState().removeDesktopItem(desktopItemId);
      notify("Removed Shortcut", `Removed "${appLabel}" from desktop.`, "info", 2000);
    }
    closeAppContextMenu();
  };

  const handleDuplicateShortcut = () => {
    if (systemSounds) soundFx.playPop();
    if (desktopItemId) {
      useDesktopStore.getState().duplicateDesktopItem(desktopItemId);
      notify("Shortcut Duplicated", `Created a copy of "${appLabel}" on Desktop.`, "success", 2000);
    }
    closeAppContextMenu();
  };

  const handleRename = () => {
    if (systemSounds) soundFx.playClick();
    if (desktopItemId) {
      useDesktopStore.getState().openNamingModal(desktopItemId, appLabel, isFolder);
    }
    closeAppContextMenu();
  };

  const handleCopyLink = () => {
    if (systemSounds) soundFx.playClick();
    try {
      const url = `${window.location.origin}${window.location.pathname}?app=${encodeURIComponent(app)}`;
      navigator.clipboard.writeText(url);
      notify("Link Copied", `Direct web shortcut URL copied to clipboard.`, "success", 2500);
    } catch {
      notify("Copy Failed", "Unable to access clipboard.", "warning", 2000);
    }
    closeAppContextMenu();
  };

  const handleProperties = () => {
    if (systemSounds) soundFx.playClick();
    openAppProperties({
      app,
      label: appLabel,
      isFolder,
      folderId,
    });
    closeAppContextMenu();
  };

  // Quick jump actions per app
  const renderAppJumpActions = () => {
    if (isFolder) {
      return (
        <button
          onClick={() => {
            if (folderId) useDesktopStore.getState().ungroupFolder(folderId);
            closeAppContextMenu();
          }}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
        >
          <GIconFolder size={14} className="text-amber-400" />
          <span className="flex-1">Ungroup Folder</span>
        </button>
      );
    }

    switch (app) {
      case "browser":
        return (
          <>
            <button
              onClick={() => {
                openApp("browser");
                closeAppContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
            >
              <AppIcon size={14} className="text-sky-400" />
              <span className="flex-1">New Window</span>
              <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+N" : "⌘N"}</span>
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem("portfolio_browser_history");
                  notify("Browser Cache Cleared", "History and cached site state reset.", "info", 2000);
                } catch {}
                closeAppContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
            >
              <GIconTrash size={14} className="text-rose-400" />
              <span className="flex-1">Clear Browsing Cache</span>
            </button>
          </>
        );

      case "terminal":
        return (
          <>
            <button
              onClick={() => {
                openApp("terminal");
                closeAppContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
            >
              <GIconTerminal size={14} className="text-emerald-400" />
              <span className="flex-1">New Terminal Session</span>
              <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+T" : "⌘T"}</span>
            </button>
            <button
              onClick={() => {
                try {
                  sessionStorage.removeItem("terminal_history");
                  notify("Shell Reset", "Command history cleared.", "info", 2000);
                } catch {}
                closeAppContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
            >
              <GIconTrash size={14} className="text-amber-400" />
              <span className="flex-1">Clear Command History</span>
            </button>
          </>
        );

      case "notes":
        return (
          <button
            onClick={() => {
              openApp("notes");
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconNotes size={14} className="text-amber-400" />
            <span className="flex-1">New Quick Note</span>
            <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+N" : "⌘N"}</span>
          </button>
        );

      case "music":
        return (
          <>
            <button
              onClick={() => {
                openApp("music");
                closeAppContextMenu();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
            >
              <GIconMusic size={14} className="text-pink-400" />
              <span className="flex-1">Open Music Player</span>
            </button>
          </>
        );

      case "activity":
        return (
          <button
            onClick={() => {
              openApp("activity");
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconActivity size={14} className="text-emerald-400" />
            <span className="flex-1">{isWin ? "Task Manager Overview" : "Activity Monitor"}</span>
            <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+Shift+Esc" : "⌥⌘Esc"}</span>
          </button>
        );

      case "calculator":
        return (
          <button
            onClick={() => {
              openApp("calculator");
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconCalculator size={14} className="text-cyan-400" />
            <span className="flex-1">Open Calculator</span>
          </button>
        );

      case "chats":
        return (
          <button
            onClick={() => {
              openApp("chats");
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconChats size={14} className="text-violet-400" />
            <span className="flex-1">Open Live Guestbook</span>
          </button>
        );

      case "settings":
        return (
          <button
            onClick={() => {
              openApp("settings");
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconSliders size={14} className="text-slate-400" />
            <span className="flex-1">System Preferences & Personalization</span>
          </button>
        );

      case "games":
        return (
          <button
            onClick={() => {
              openApp("games");
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconGames size={14} className="text-orange-400" />
            <span className="flex-1">Play Retro Arcade Games</span>
          </button>
        );

      case "updates":
        return (
          <button
            onClick={() => {
              openApp("updates");
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconUpdates size={14} className="text-emerald-400" />
            <span className="flex-1">Check for System Updates</span>
          </button>
        );

      case "resume":
      case "pdf-viewer":
        return (
          <button
            onClick={() => {
              openApp("pdf-viewer");
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconResume size={14} className="text-rose-400" />
            <span className="flex-1">Open James Mendoza CV</span>
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={menuRef}
      onContextMenu={(e) => e.preventDefault()}
      style={{ left: clampedX, top: clampedY }}
      className={`fixed z-[9999] w-[230px] max-h-[calc(100vh-20px)] overflow-y-auto thin-scroll p-1.5 select-none text-xs ${
        isWin
          ? "rounded-xl bg-[#1c2230]/95 backdrop-blur-2xl border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-white/90"
          : "rounded-2xl bg-[#181a20]/95 backdrop-blur-3xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.8)] text-white/95"
      }`}
    >
      {/* App Header Badge */}
      <div className="flex items-center gap-2 px-2 py-1 mb-1 border-b border-white/10">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-white/10"
          style={{ backgroundColor: `${appColor}22` }}
        >
          <AppIcon size={12} color={appColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate text-[11px] leading-tight">{appLabel}</div>
          <div className="text-[9px] text-white/40 leading-tight">
            {isRunning ? (isMinimized ? "Minimized" : "Active Window") : isWin ? "Application (.exe)" : "App Bundle"}
          </div>
        </div>
      </div>

      {/* 1. Primary Open / Focus Button */}
      <button
        onClick={handleOpen}
        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-left text-xs font-bold cursor-pointer ${
          isWin
            ? "hover:bg-white/12 text-white"
            : "hover:bg-accent hover:text-accent-contrast text-white"
        }`}
      >
        <span className="flex-1">
          {isRunning ? (isMinimized ? "Restore Window" : "Bring to Front") : "Open"}
        </span>
        <span className="text-[10px] text-white/40 font-mono font-normal">
          {isWin ? "Enter" : "⏎"}
        </span>
      </button>

      {/* 2. Run as Administrator / Clean Sandbox (Windows 11 inspired) */}
      {!isFolder && (
        <button
          onClick={handleRunAsAdmin}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
        >
          <GIconShield size={14} className={isWin ? "text-amber-400" : "text-sky-400"} />
          <span className="flex-1">{isWin ? "Run as administrator" : "Launch in Clean Sandbox"}</span>
        </button>
      )}

      {/* App specific jump list tasks */}
      {renderAppJumpActions()}

      <div className="h-px bg-white/10 my-1" />

      {/* 3. Window Controls (if running) */}
      {isRunning && existingWin && (
        <>
          <button
            onClick={() => {
              if (isMinimized) {
                restoreWindow(existingWin.id);
              } else {
                requestMinimize(existingWin.id);
              }
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconMinus size={13} className="text-sky-400" />
            <span className="flex-1">{isMinimized ? "Restore" : "Minimize"}</span>
            <span className="text-[10px] text-white/40 font-mono">{isWin ? "Alt+Space+N" : "⌘M"}</span>
          </button>

          <button
            onClick={() => {
              closeWindow(existingWin.id);
              closeAppContextMenu();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-rose-300 hover:text-rose-200 hover:bg-rose-500/20 transition-colors text-left text-xs cursor-pointer"
          >
            <GIconClose size={13} className="text-rose-400" />
            <span className="flex-1">Close Window</span>
            <span className="text-[10px] text-rose-300/50 font-mono">{isWin ? "Alt+F4" : "⌘W"}</span>
          </button>

          <div className="h-px bg-white/10 my-1" />
        </>
      )}

      {/* 4. Pinning Options */}
      {!isFolder && (
        <button
          onClick={handlePinToggle}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
        >
          <GIconSquare size={13} className={isPinned ? "text-amber-400" : "text-sky-400"} />
          <span className="flex-1">
            {isWin
              ? isPinned
                ? "Unpin from taskbar"
                : "Pin to taskbar"
              : isPinned
                ? "Options > Remove from Dock"
                : "Options > Keep in Dock"}
          </span>
        </button>
      )}

      {/* 5. Desktop Shortcuts Management */}
      {source === "desktop" ? (
        <>
          <button
            onClick={handleRename}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <span className="flex-1">Rename</span>
            <span className="text-[10px] text-white/40 font-mono">{isWin ? "F2" : "⏎"}</span>
          </button>

          <button
            onClick={handleDuplicateShortcut}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
          >
            <span className="flex-1">Duplicate Shortcut</span>
            <span className="text-[10px] text-white/40 font-mono">{isWin ? "Ctrl+D" : "⌘D"}</span>
          </button>

          <button
            onClick={handleDeleteShortcut}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition-colors text-left text-xs cursor-pointer"
          >
            <span className="flex-1">Delete Shortcut</span>
            <span className="text-[10px] text-rose-300/50 font-mono">{isWin ? "Del" : "⌘⌫"}</span>
          </button>
        </>
      ) : (
        <button
          onClick={handleCreateDesktopShortcut}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
        >
          <span className="flex-1">Create Desktop Shortcut</span>
        </button>
      )}

      {/* 6. Copy URL link */}
      {!isFolder && (
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
        >
          <GIconLink size={13} className="text-sky-400" />
          <span className="flex-1">Copy Web Link</span>
        </button>
      )}

      <div className="h-px bg-white/10 my-1" />

      {/* 7. Properties / Get Info Modal Trigger */}
      <button
        onClick={handleProperties}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left text-xs cursor-pointer"
      >
        <GIconCircleInfo size={13} className="text-accent" />
        <span className="flex-1">{isWin ? "Properties" : "Get Info"}</span>
        <span className="text-[10px] text-white/40 font-mono">{isWin ? "Alt+Enter" : "⌘I"}</span>
      </button>
    </div>
  );
}

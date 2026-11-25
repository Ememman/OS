import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOS } from "../store/useOS";
import { APP_ITEMS_MAP } from "../data/appItems";
import { soundFx } from "../lib/soundFx";
import { downloadResumePdf } from "../lib/resumePdf";
import { useOutsideClick as useOutsideClose } from "../lib/useOutsideClick";
import LiveBadge from "./LiveBadge";
import CalendarWidget from "./widgets/CalendarWidget";
import {
  GIconCode,
  GIconSignal,
  GIconPower,
  GIconSearch,
  GIconCheck,
  GIconClose,
  GIconSliders,
  GIconLayoutCells,
  GIconResume,
  GIconChats,
  GIconGames,
  GIconTerminal,
  GIconNotes,
  GIconCalculator,
  GIconActivity,
  GIconLibrary,
  GIconFolder,
  GIconSettings,
  GIconBookOpen,
  GIconGithub,
} from "./icons/GravityIcons";

interface MenuDropdownProps {
  label: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onMouseEnter: () => void;
  children: ReactNode;
  minWidth?: string;
}

function MenuDropdown({
  label,
  isOpen,
  onToggle,
  onMouseEnter,
  children,
  minWidth = "min-w-[240px]",
}: MenuDropdownProps) {
  return (
    <div className="relative" onMouseEnter={onMouseEnter}>
      <button
        onClick={onToggle}
        className={`px-2.5 sm:px-3 py-0.5 rounded-md transition-all cursor-pointer text-[13px] sm:text-[14px] flex items-center gap-1 select-none ${
          isOpen
            ? "bg-white/20 text-white font-medium shadow-xs"
            : "hover:bg-white/10 hover:text-white text-white/90 font-medium"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {label}
      </button>
      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1.5 ${minWidth} max-w-[calc(100vw-20px)] max-h-[85vh] overflow-y-auto thin-scroll bg-[#121826]/96 backdrop-blur-3xl rounded-2xl border border-white/18 shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.12)] p-1.5 z-[1300] origin-top-left select-none`}
          style={{ animation: "menuOpen 140ms cubic-bezier(.16,1,.3,1) both" }}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  checked?: boolean;
  shortcut?: string;
  danger?: boolean;
  icon?: ReactNode;
}

function MenuItem({
  children,
  onClick,
  disabled,
  checked,
  shortcut,
  danger,
  icon,
}: MenuItemProps) {
  return (
    <button
      onClick={() => {
        if (disabled) return;
        soundFx.playClick();
        onClick?.();
      }}
      disabled={disabled}
      role="menuitem"
      className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-100 select-none group ${
        disabled
          ? "text-white/30 cursor-not-allowed pointer-events-none"
          : danger
            ? "text-rose-400 hover:bg-rose-500/20 hover:text-rose-200 active:bg-rose-500/30 cursor-pointer"
            : "text-white/90 hover:bg-accent hover:text-accent-contrast active:brightness-95 cursor-pointer"
      }`}
    >
      <span className="w-4 shrink-0 flex items-center justify-center">
        {checked ? (
          <GIconCheck size={12} className="text-current stroke-[2.5]" />
        ) : icon ? (
          <span className="text-white/60 group-hover:text-current">{icon}</span>
        ) : null}
      </span>
      <span className="flex-1 truncate font-normal tracking-wide">{children}</span>
      {shortcut && (
        <span className="text-[11px] font-mono text-white/40 group-hover:text-inherit ml-2 tracking-wider shrink-0 transition-colors">
          {shortcut}
        </span>
      )}
    </button>
  );
}

function MenuHeader({ label }: { label: string }) {
  return (
    <div className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/45 select-none">
      {label}
    </div>
  );
}

function MenuSeparator() {
  return <div className="h-px bg-white/10 my-1 mx-1.5" role="separator" />;
}

interface InfoModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function InfoModal({ title, onClose, children }: InfoModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-6 select-none"
      onClick={onClose}>
      <div
        className="bg-[#0d111d] sm:bg-[#0d111d]/98 backdrop-blur-2xl rounded-2xl max-w-sm w-full p-5 border border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.85)] text-white"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "menuOpen 160ms cubic-bezier(.16,1,.3,1) both" }}>
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
          <h3 className="font-display text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white/60 hover:text-white cursor-pointer">
            <GIconClose size={14} />
          </button>
        </div>
        <div className="text-xs text-white/75 leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function MenuBar() {
  const {
    windows,
    openApp,
    closeWindow,
    minimizeWindow,
    restoreWindow,
    toggleMaximize,
    snapWindow,
    closeAllWindows,
    minimizeAllWindows,
    cascadeWindows,
    lastClosedWindow,
    reopenLastClosedWindow,
    dockPosition,
    setDockPosition,
    toggleShowDesktop,
    focusWindow,
    reduceMotion,
    toggleMotion,
    openSpotlight,
    reopenPicker,
    controlCenterOpen,
    toggleControlCenter,
    missionControlOpen,
    toggleMissionControl,
    powerOff,
    restart,
    setSleeping,
    openPowerDialog,
    themeMode,
    setThemeMode,
    wallpapers,
    wallpaper,
    setWallpaper,
    widgetsVisible,
    toggleWidgets,
    showDesktopApps,
    toggleShowDesktopApps,
    showHeaderButtons,
    toggleShowHeaderButtons,
    showDock,
    toggleShowDock,
    desktopIconSize,
    setDesktopIconSize,
    autoArrangeIcons,
    toggleAutoArrangeIcons,
    systemSounds,
    toggleSystemSounds,
    notify,
    resetDefaults,
    notification,
    dynamicIslandEnabled,
    dynamicIslandExpanded,
  } = useOS();

  const isIslandWide = dynamicIslandEnabled && (Boolean(notification) || dynamicIslandExpanded);

  const [now, setNow] = useState(new Date());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<"about" | "shortcuts" | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [wifiOpen, setWifiOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  // Preserve active editable focus and text selection before menu bar clicks
  const lastActiveTargetRef = useRef<{
    el: HTMLElement | null;
    start: number;
    end: number;
    text: string;
  }>({ el: null, start: 0, end: 0, text: "" });

  useEffect(() => {
    const recordActive = () => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable)) {
        const input = activeEl as HTMLInputElement | HTMLTextAreaElement;
        const s = input.selectionStart ?? 0;
        const e = input.selectionEnd ?? 0;
        lastActiveTargetRef.current = {
          el: activeEl,
          start: s,
          end: e,
          text: (input.value ? input.value.slice(s, e) : "") || (window.getSelection()?.toString() || ""),
        };
      } else {
        const sel = window.getSelection()?.toString() || "";
        if (sel) {
          lastActiveTargetRef.current = {
            el: null,
            start: 0,
            end: 0,
            text: sel,
          };
        }
      }
    };

    document.addEventListener("selectionchange", recordActive, { passive: true });
    document.addEventListener("focusin", recordActive, { passive: true });
    return () => {
      document.removeEventListener("selectionchange", recordActive);
      document.removeEventListener("focusin", recordActive);
    };
  }, []);

  const menuNavRef = useRef<HTMLDivElement>(null);
  const wifiRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useOutsideClose(wifiRef, () => setWifiOpen(false));
  useOutsideClose(dateRef, () => setDateOpen(false));

  // Unified outside click and keyboard arrow / escape handler for top menu bar
  useEffect(() => {
    if (!openMenu) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (menuNavRef.current && !menuNavRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const menuOrder = ["apple", "file", "edit", "view", "window", "help"];
        const idx = menuOrder.indexOf(openMenu);
        if (idx !== -1) {
          const nextIdx =
            e.key === "ArrowRight"
              ? (idx + 1) % menuOrder.length
              : (idx - 1 + menuOrder.length) % menuOrder.length;
          setOpenMenu(menuOrder[nextIdx]);
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // Identify actively focused, non-minimized window
  const activeWindows = windows.filter((w) => !w.minimized);
  const focusedWindow = activeWindows.length
    ? activeWindows.reduce((a, b) => (a.z > b.z ? a : b))
    : null;
  const focusedId = focusedWindow ? focusedWindow.id : null;

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const handleMenuToggle = (name: string) => {
    if (wifiOpen) setWifiOpen(false);
    if (dateOpen) setDateOpen(false);
    setOpenMenu((prev) => (prev === name ? null : name));
  };

  const handleMenuHover = (name: string) => {
    if (openMenu !== null && openMenu !== name) {
      setOpenMenu(name);
    }
  };

  const handleAppleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setMobileSheetOpen((prev) => !prev);
      setOpenMenu(null);
    } else {
      handleMenuToggle("apple");
    }
  };

  // Export system configuration & preferences as JSON
  const exportBackup = () => {
    try {
      const data = {
        app: "Portfolio OS",
        version: "2.4",
        wallpaper: localStorage.getItem("os_wallpaper") || "bg1",
        accent: localStorage.getItem("os_accent") || "59 130 246",
        themeMode: localStorage.getItem("os_theme_mode") || "dark",
        dockPosition: localStorage.getItem("os_dock_position") || "bottom",
        systemSounds: localStorage.getItem("os_system_sounds") !== "off",
        timestamp: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio-os-settings-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify("System Backup Exported", "Settings & preferences downloaded successfully.", "success", 3000);
    } catch {
      notify("Export Failed", "Unable to download backup JSON.", "error", 2500);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-8 z-[999] glass flex items-center justify-between px-3 sm:px-4 text-[14px] text-white/95 select-none shadow-md overflow-visible">
      {/* Left Menu Items (Apple, File, Edit, View, Window, Help) */}
      <div
        ref={menuNavRef}
        className={`flex items-center gap-1 sm:gap-1.5 min-w-0 transition-transform duration-300 ease-out ${
          isIslandWide ? "-translate-x-1.5 sm:translate-x-0" : "translate-x-0"
        }`}
      >
        {/* Apple-style OS Logo using Gravity UI */}
        <MenuDropdown
          label={
            <div className="flex items-center gap-1.5 py-0.5 font-bold tracking-tight text-white transition-opacity">
              <GIconCode size={16} className="text-accent shrink-0" />
              <span
                className={`transition-all duration-300 ${
                  isIslandWide ? "hidden sm:inline text-[13px] font-semibold" : "hidden xs:inline text-[13px] font-semibold"
                }`}
              >
                Portfolio OS
              </span>
            </div>
          }
          isOpen={openMenu === "apple"}
          onToggle={handleAppleToggle}
          onMouseEnter={() => handleMenuHover("apple")}
          minWidth="min-w-[245px]"
        >
          <MenuItem
            onClick={() => {
              setModal("about");
              setOpenMenu(null);
            }}>
            About This Portfolio
          </MenuItem>
          <MenuItem
            onClick={() => {
              openApp("settings");
              setOpenMenu(null);
            }}
            shortcut="⌘,">
            System Settings…
          </MenuItem>
          <MenuItem
            onClick={() => {
              reopenPicker();
              setOpenMenu(null);
            }}>
            Switch OS Style…
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            onClick={() => {
              openApp("activity");
              setOpenMenu(null);
            }}>
            Activity Monitor
          </MenuItem>
          <MenuItem
            onClick={() => {
              openApp("guestbook");
              setOpenMenu(null);
            }}>
            Guestbook & Ledger
          </MenuItem>
          <MenuItem
            onClick={() => {
              openApp("terminal");
              setOpenMenu(null);
            }}
            shortcut="⌘T">
            Open Terminal
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            disabled={windows.length === 0}
            onClick={() => {
              closeAllWindows();
              setOpenMenu(null);
            }}
            shortcut="⌥⌘Q">
            Force Quit All Windows
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            onClick={() => {
              setSleeping(true);
              setOpenMenu(null);
            }}
            shortcut="⌃⌘Q">
            Lock Screen (Sleep)
          </MenuItem>
          <MenuItem
            onClick={() => {
              restart();
              setOpenMenu(null);
            }}>
            Restart System…
          </MenuItem>
          <MenuItem
            onClick={() => {
              powerOff();
              setOpenMenu(null);
            }}>
            Shut Down…
          </MenuItem>
          <MenuItem
            onClick={() => {
              reopenPicker();
              setOpenMenu(null);
            }}>
            Log Out / Switch OS…
          </MenuItem>
        </MenuDropdown>

        {/* Desktop Menu Suite */}
        <div className="hidden sm:flex items-center gap-1">
          {/* FILE MENU */}
          <MenuDropdown
            label="File"
            isOpen={openMenu === "file"}
            onToggle={() => handleMenuToggle("file")}
            onMouseEnter={() => handleMenuHover("file")}
            minWidth="min-w-[245px]"
          >
            <MenuItem
              onClick={() => {
                openApp("notes");
                setOpenMenu(null);
              }}
              shortcut="⌘N">
              New Note
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("terminal");
                setOpenMenu(null);
              }}
              shortcut="⌘T">
              New Terminal Window
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("files");
                setOpenMenu(null);
              }}
              shortcut="⇧⌘N">
              New Finder Window
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                openApp("files");
                setOpenMenu(null);
              }}
              shortcut="⌘O">
              Open File Browser…
            </MenuItem>
            <MenuItem
              onClick={() => {
                exportBackup();
                setOpenMenu(null);
              }}
              shortcut="⌘S">
              Export System Backup
            </MenuItem>
            <MenuItem
              onClick={() => {
                downloadResumePdf();
                notify("Resume Downloaded", "MendozaJamesEmmanuelCV.pdf saved to your device.", "success", 2600);
                setOpenMenu(null);
              }}
              shortcut="⌘P">
              Download Resume (PDF)
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              disabled={!focusedId}
              onClick={() => {
                if (focusedId) closeWindow(focusedId);
                setOpenMenu(null);
              }}
              shortcut="⌘W">
              Close Window
            </MenuItem>
            <MenuItem
              disabled={windows.length === 0}
              onClick={() => {
                closeAllWindows();
                setOpenMenu(null);
              }}
              shortcut="⌥⌘W">
              Close All Windows
            </MenuItem>
          </MenuDropdown>

          {/* EDIT MENU */}
          <MenuDropdown
            label="Edit"
            isOpen={openMenu === "edit"}
            onToggle={() => handleMenuToggle("edit")}
            onMouseEnter={() => handleMenuHover("edit")}
            minWidth="min-w-[250px]"
          >
            <MenuItem
              onClick={() => {
                const target = lastActiveTargetRef.current.el;
                if (target) {
                  target.focus();
                  document.execCommand("undo");
                  notify("Undo", "Reverted recent edit in active document.", "info", 1800);
                } else if (lastClosedWindow) {
                  const restored = reopenLastClosedWindow();
                  if (restored) {
                    notify("Window Restored", "Reopened recently closed window.", "success", 2400);
                  }
                } else {
                  notify("Undo", "No recent action to undo.", "info", 1800);
                }
                setOpenMenu(null);
              }}
              shortcut="⌘Z">
              Undo
            </MenuItem>
            <MenuItem
              onClick={() => {
                const target = lastActiveTargetRef.current.el;
                if (target) {
                  target.focus();
                  document.execCommand("redo");
                  notify("Redo", "Restored recent edit in active document.", "info", 1800);
                } else {
                  notify("Redo", "No recent action to redo.", "info", 1800);
                }
                setOpenMenu(null);
              }}
              shortcut="⇧⌘Z">
              Redo
            </MenuItem>
            {lastClosedWindow && (
              <MenuItem
                onClick={() => {
                  reopenLastClosedWindow();
                  notify("Window Restored", "Reopened recently closed window.", "success", 2400);
                  setOpenMenu(null);
                }}
                shortcut="⇧⌘T">
                Reopen Closed Window
              </MenuItem>
            )}
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                const target = lastActiveTargetRef.current.el;
                const textToCut = lastActiveTargetRef.current.text || window.getSelection()?.toString();
                if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
                  const input = target as HTMLInputElement | HTMLTextAreaElement;
                  const start = input.selectionStart ?? 0;
                  const end = input.selectionEnd ?? 0;
                  const val = input.value;
                  const selectedText = val.slice(start, end);
                  if (selectedText) {
                    navigator.clipboard?.writeText(selectedText);
                    input.setRangeText("", start, end, "end");
                    input.focus();
                    notify("Cut", `"${selectedText.slice(0, 30)}" cut to clipboard.`, "info", 2000);
                  } else {
                    notify("Cut", "Select text inside an input to cut.", "warning", 2000);
                  }
                } else if (textToCut) {
                  navigator.clipboard?.writeText(textToCut);
                  document.execCommand("delete");
                  notify("Cut", "Selection cut to clipboard.", "info", 2000);
                } else {
                  notify("Cut", "Select text inside an editor or document to cut.", "warning", 2200);
                }
                setOpenMenu(null);
              }}
              shortcut="⌘X">
              Cut
            </MenuItem>
            <MenuItem
              onClick={() => {
                const target = lastActiveTargetRef.current.el;
                let textToCopy = lastActiveTargetRef.current.text || window.getSelection()?.toString();
                if (!textToCopy && target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
                  const input = target as HTMLInputElement | HTMLTextAreaElement;
                  const start = input.selectionStart ?? 0;
                  const end = input.selectionEnd ?? 0;
                  if (start !== end) {
                    textToCopy = input.value.slice(start, end);
                  }
                }
                if (textToCopy && textToCopy.trim()) {
                  navigator.clipboard?.writeText(textToCopy);
                  notify("Copied to Clipboard", `"${textToCopy.slice(0, 32)}${textToCopy.length > 32 ? "…" : ""}" copied.`, "success", 2200);
                } else {
                  const url = window.location.href;
                  navigator.clipboard?.writeText(url);
                  notify("Portfolio Link Copied", "Direct portfolio URL copied to clipboard.", "success", 2400);
                }
                setOpenMenu(null);
              }}
              shortcut="⌘C">
              Copy
            </MenuItem>
            <MenuItem
              onClick={async () => {
                try {
                  const text = await navigator.clipboard?.readText();
                  if (!text) {
                    notify("Clipboard Empty", "No text found on system clipboard.", "info", 2000);
                    setOpenMenu(null);
                    return;
                  }
                  const target = lastActiveTargetRef.current.el;
                  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
                    const input = target as HTMLInputElement | HTMLTextAreaElement;
                    const start = input.selectionStart ?? input.value.length;
                    const end = input.selectionEnd ?? input.value.length;
                    input.setRangeText(text, start, end, "end");
                    input.focus();
                    notify("Pasted", `Inserted clipboard text (${text.length} chars).`, "success", 2000);
                  } else {
                    const activeWins = windows.filter((w) => !w.minimized);
                    const focused = activeWins.length ? activeWins.reduce((a, b) => (a.z > b.z ? a : b)) : null;
                    if (focused?.app === "notes") {
                      notify("Ready in Notes", `Copied text ready to paste in Notes.`, "success", 2200);
                    } else if (focused?.app === "terminal") {
                      notify("Ready in Terminal", `Press Ctrl+V in Terminal shell to paste.`, "info", 2200);
                    } else {
                      openApp("notes");
                      notify("Opened Notes", `Ready with clipboard content.`, "info", 2200);
                    }
                  }
                } catch {
                  notify("Paste Access", "Press ⌘V / Ctrl+V to paste directly into active editor.", "info", 2400);
                }
                setOpenMenu(null);
              }}
              shortcut="⌘V">
              Paste
            </MenuItem>
            <MenuItem
              onClick={() => {
                const target = lastActiveTargetRef.current.el;
                if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
                  const input = target as HTMLInputElement | HTMLTextAreaElement;
                  input.focus();
                  input.select();
                  notify("Selected All", "All text selected in active editor.", "info", 1800);
                } else {
                  window.getSelection()?.selectAllChildren(document.body);
                  notify("Selected All", "Selected page content.", "info", 1800);
                }
                setOpenMenu(null);
              }}
              shortcut="⌘A">
              Select All
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                openSpotlight();
                setOpenMenu(null);
              }}
              shortcut="⌘K">
              Spotlight Search…
            </MenuItem>
            <MenuItem
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                notify("Portfolio Link Copied", "Direct shareable portfolio link copied to clipboard.", "success", 2400);
                setOpenMenu(null);
              }}
              shortcut="⇧⌘C">
              Copy Portfolio Link
            </MenuItem>
          </MenuDropdown>

          {/* VIEW MENU */}
          <MenuDropdown
            label="View"
            isOpen={openMenu === "view"}
            onToggle={() => handleMenuToggle("view")}
            onMouseEnter={() => handleMenuHover("view")}
            minWidth="min-w-[250px]"
          >
            <MenuItem
              onClick={() => {
                toggleMissionControl();
                setOpenMenu(null);
              }}
              shortcut="F3">
              Mission Control
            </MenuItem>
            <MenuItem
              onClick={() => {
                toggleFullscreen();
                setOpenMenu(null);
              }}
              shortcut="⌃⌘F">
              {fullscreen ? "Exit Full Screen" : "Enter Full Screen"}
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                const nextMode = themeMode === "night" ? "dark" : "night";
                setThemeMode(nextMode);
                notify(
                  nextMode === "night" ? "Night Mode Activated" : "Dark Mode Activated",
                  nextMode === "night" ? "Midnight OLED pitch black glass with zero glare." : "Deep slate glass theme restored.",
                  "success",
                  2600
                );
                setOpenMenu(null);
              }}>
              {themeMode === "night" ? "Switch to Dark Mode (Slate)" : "Switch to Night Mode (OLED)"}
            </MenuItem>
            <MenuItem
              onClick={() => {
                const currentIndex = wallpapers.findIndex((w) => w.id === wallpaper);
                const nextIndex = (currentIndex + 1) % wallpapers.length;
                const nextWall = wallpapers[nextIndex];
                setWallpaper(nextWall.id);
                notify("Wallpaper Changed", `Active backdrop set to "${nextWall.name}".`, "info", 2400);
                setOpenMenu(null);
              }}
              shortcut="⌃⌘W">
              Cycle Next Wallpaper
            </MenuItem>
            <MenuItem
              checked={widgetsVisible}
              onClick={() => {
                toggleWidgets();
                setOpenMenu(null);
              }}>
              Desktop Widgets
            </MenuItem>
            <MenuItem
              checked={showDesktopApps}
              onClick={() => {
                toggleShowDesktopApps();
                setOpenMenu(null);
              }}>
              Show Desktop Applications
            </MenuItem>
            <MenuItem
              checked={showHeaderButtons}
              onClick={() => {
                toggleShowHeaderButtons();
                setOpenMenu(null);
              }}>
              Show Header Buttons
            </MenuItem>
            <MenuItem
              checked={showDock}
              onClick={() => {
                toggleShowDock();
                setOpenMenu(null);
              }}>
              Show Dock Applications
            </MenuItem>
            <MenuSeparator />
            <MenuHeader label="Desktop Icon Size" />
            <MenuItem
              checked={desktopIconSize === "large"}
              onClick={() => {
                setDesktopIconSize("large");
                setOpenMenu(null);
              }}>
              Large Icons
            </MenuItem>
            <MenuItem
              checked={desktopIconSize === "medium"}
              onClick={() => {
                setDesktopIconSize("medium");
                setOpenMenu(null);
              }}>
              Medium Icons
            </MenuItem>
            <MenuItem
              checked={desktopIconSize === "small"}
              onClick={() => {
                setDesktopIconSize("small");
                setOpenMenu(null);
              }}>
              Small Icons
            </MenuItem>
            <MenuItem
              checked={autoArrangeIcons}
              onClick={() => {
                toggleAutoArrangeIcons();
                setOpenMenu(null);
              }}>
              Auto Arrange Icons
            </MenuItem>
            <MenuSeparator />
            <MenuHeader label="Dock Position" />
            <MenuItem
              checked={dockPosition === "bottom"}
              onClick={() => {
                setDockPosition("bottom");
                setOpenMenu(null);
              }}>
              Dock at Bottom
            </MenuItem>
            <MenuItem
              checked={dockPosition === "left"}
              onClick={() => {
                setDockPosition("left");
                setOpenMenu(null);
              }}>
              Dock on Left
            </MenuItem>
            <MenuItem
              checked={dockPosition === "right"}
              onClick={() => {
                setDockPosition("right");
                setOpenMenu(null);
              }}>
              Dock on Right
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              checked={reduceMotion}
              onClick={() => {
                toggleMotion();
                setOpenMenu(null);
              }}>
              Reduce Motion
            </MenuItem>
            <MenuItem
              checked={systemSounds}
              onClick={() => {
                toggleSystemSounds();
                setOpenMenu(null);
              }}>
              System Audio Effects
            </MenuItem>
            <MenuItem
              onClick={() => {
                toggleShowDesktop();
                setOpenMenu(null);
              }}
              shortcut="⌘D">
              Show Desktop
            </MenuItem>
          </MenuDropdown>

          {/* WINDOW MENU */}
          <MenuDropdown
            label="Window"
            isOpen={openMenu === "window"}
            onToggle={() => handleMenuToggle("window")}
            onMouseEnter={() => handleMenuHover("window")}
            minWidth="min-w-[260px]"
          >
            <MenuItem
              disabled={!focusedId}
              onClick={() => {
                if (focusedId) minimizeWindow(focusedId);
                setOpenMenu(null);
              }}
              shortcut="⌘M">
              Minimize Window
            </MenuItem>
            <MenuItem
              disabled={!focusedId}
              onClick={() => {
                if (focusedId) toggleMaximize(focusedId);
                setOpenMenu(null);
              }}
              shortcut="⌃⌘M">
              Zoom / Maximize Window
            </MenuItem>
            <MenuItem
              disabled={!focusedId}
              onClick={() => {
                if (focusedId) snapWindow(focusedId, "left");
                setOpenMenu(null);
              }}
              shortcut="⌥⌘←">
              Tile Window to Left Half
            </MenuItem>
            <MenuItem
              disabled={!focusedId}
              onClick={() => {
                if (focusedId) snapWindow(focusedId, "right");
                setOpenMenu(null);
              }}
              shortcut="⌥⌘→">
              Tile Window to Right Half
            </MenuItem>
            <MenuItem
              disabled={!focusedId}
              onClick={() => {
                if (focusedId) snapWindow(focusedId, "center");
                setOpenMenu(null);
              }}
              shortcut="⌥⌘C">
              Center Window
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              disabled={windows.length === 0}
              onClick={() => {
                cascadeWindows();
                notify("Cascaded Windows", "Organized all open windows in cascade.", "info", 1800);
                setOpenMenu(null);
              }}>
              Cascade All Windows
            </MenuItem>
            <MenuItem
              disabled={windows.length === 0}
              onClick={() => {
                windows.forEach((w) => {
                  if (w.minimized) restoreWindow(w.id);
                });
                if (focusedId) focusWindow(focusedId);
                notify("Brought to Front", "All open windows brought forward.", "info", 1800);
                setOpenMenu(null);
              }}>
              Bring All to Front
            </MenuItem>
            <MenuItem
              disabled={!windows.some((w) => !w.minimized)}
              onClick={() => {
                minimizeAllWindows();
                setOpenMenu(null);
              }}
              shortcut="⌥⌘M">
              Minimize All Windows
            </MenuItem>
            <MenuItem
              disabled={windows.length === 0}
              onClick={() => {
                closeAllWindows();
                setOpenMenu(null);
              }}
              shortcut="⌥⌘W">
              Close All Windows
            </MenuItem>
            <MenuSeparator />
            <MenuHeader label={`Active Windows (${windows.length})`} />
            {windows.length === 0 ? (
              <div className="px-3 py-2 text-xs text-white/40 italic flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                No Open Windows
              </div>
            ) : (
              windows.map((w) => {
                const meta = APP_ITEMS_MAP[w.app];
                const AppIcon = meta?.icon;
                return (
                  <MenuItem
                    key={w.id}
                    checked={w.id === focusedId && !w.minimized}
                    onClick={() => {
                      if (w.minimized) restoreWindow(w.id);
                      focusWindow(w.id);
                      setOpenMenu(null);
                    }}>
                    <div className="flex items-center gap-2 min-w-0">
                      {AppIcon && (
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0 border border-white/10"
                          style={{ backgroundColor: `${meta.color || "#0091ff"}25` }}
                        >
                          <AppIcon size={10} color={meta.color} />
                        </div>
                      )}
                      <span className="truncate">{w.title}</span>
                      {w.minimized && (
                        <span className="text-[10px] opacity-60 font-mono italic shrink-0">
                          (minimized)
                        </span>
                      )}
                    </div>
                  </MenuItem>
                );
              })
            )}
          </MenuDropdown>

          {/* HELP MENU */}
          <MenuDropdown
            label="Help"
            isOpen={openMenu === "help"}
            onToggle={() => handleMenuToggle("help")}
            onMouseEnter={() => handleMenuHover("help")}
            minWidth="min-w-[250px]"
          >
            <MenuItem
              onClick={() => {
                openSpotlight();
                setOpenMenu(null);
              }}
              shortcut="⌘?">
              Search System & Help…
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                setModal("about");
                setOpenMenu(null);
              }}>
              About Portfolio OS
            </MenuItem>
            <MenuItem
              onClick={() => {
                setModal("shortcuts");
                setOpenMenu(null);
              }}
              shortcut="⌘/">
              Keyboard Shortcuts Reference
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("codeplay");
                setOpenMenu(null);
              }}>
              Interactive CodePlay Sandbox
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("library");
                setOpenMenu(null);
              }}>
              Case Studies & Projects
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("updates");
                setOpenMenu(null);
              }}>
              System Activity & Updates
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("chats");
                setOpenMenu(null);
              }}>
              Say Hi in Live Guestbook & Chat
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              icon={<GIconGithub size={13} />}
              onClick={() => {
                window.open("https://github.com/Ememman/OS", "_blank");
                setOpenMenu(null);
              }}>
              View Source on GitHub
            </MenuItem>
            <MenuItem
              icon={<GIconGithub size={13} />}
              onClick={() => {
                window.open("https://github.com/Ememman", "_blank");
                setOpenMenu(null);
              }}>
              Developer GitHub Profile (@Ememman)
            </MenuItem>
            <MenuItem
              danger
              onClick={() => {
                setOpenMenu(null);
                if (window.confirm("Reset all desktop settings to defaults? This restores wallpaper, accent, sound, and task preferences.")) {
                  resetDefaults();
                  notify("Settings Restored", "Portfolio OS desktop settings reset to factory defaults.", "delete", 3500);
                }
              }}>
              Reset All Desktop Defaults…
            </MenuItem>
          </MenuDropdown>
        </div>
      </div>

      <div
        className={`flex items-center gap-1 sm:gap-2 text-white/90 transition-all duration-300 ease-out ${
          isIslandWide ? "translate-x-1 sm:translate-x-0" : "translate-x-0"
        }`}
      >
        {/* Mission Control Button */}
        <button
          onClick={toggleMissionControl}
          title="Mission Control (F3)"
          className={`items-center justify-center p-1 sm:p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
            isIslandWide ? "hidden md:flex" : "flex"
          } ${
            missionControlOpen
              ? "bg-accent text-accent-contrast shadow-md shadow-accent/20"
              : "hover:bg-white/10 text-white/80 hover:text-white"
          }`}
        >
          <GIconLayoutCells size={15} />
        </button>

        {/* Spotlight Trigger */}
        <button
          onClick={openSpotlight}
          title="Spotlight Search (⌘K)"
          className={`items-center gap-1 sm:gap-1.5 hover:text-white transition-all duration-300 p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white/80 cursor-pointer ${
            isIslandWide ? "hidden sm:flex" : "flex"
          }`}
        >
          <GIconSearch size={15} />
          <span className="hidden md:inline text-[11px] text-white/40 border border-white/15 rounded px-1.5 py-0.2">⌘K</span>
        </button>

        {/* Online Visitors Badge -> Opens Chats */}
        <button
          onClick={() => openApp("chats")}
          title="Live Visitors — Click to open Chat"
          className={`hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer ${
            isIslandWide ? "hidden sm:block" : "block"
          }`}
        >
          <LiveBadge compact />
        </button>

        {/* macOS Control Center Trigger */}
        <button
          onClick={toggleControlCenter}
          data-control-center-trigger="true"
          title="Control Center (Display, Sound & System)"
          className={`flex items-center justify-center p-1 sm:p-1.5 rounded-lg transition-all duration-300 cursor-pointer ${
            controlCenterOpen
              ? "bg-accent text-accent-contrast shadow-md shadow-accent/20"
              : "hover:bg-white/10 text-white/80 hover:text-white"
          }`}
        >
          <GIconSliders size={15} />
        </button>

        {/* Wi-Fi Status Trigger & Flyout */}
        <div ref={wifiRef} className="relative hidden xs:block">
          <button
            onClick={() => setWifiOpen(!wifiOpen)}
            title="Wi-Fi: Connected to Portfolio-OS-Mesh"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              wifiOpen ? "bg-accent text-accent-contrast shadow-sm" : "hover:bg-white/10 text-white/80 hover:text-white"
            }`}
          >
            <GIconSignal size={15} />
          </button>

          {wifiOpen && (
            <div
              className="absolute top-full right-0 mt-1.5 w-64 glass rounded-2xl border border-white/15 p-3.5 shadow-2xl z-[1300] text-xs text-white space-y-3 origin-top-right select-none"
              style={{ animation: "menuOpen 140ms cubic-bezier(.16,1,.3,1) both" }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 font-semibold">
                  <GIconSignal size={14} className="text-accent" />
                  <span>Wi-Fi Network</span>
                </div>
                <span className="text-[10px] text-accent font-mono bg-accent/15 px-2 py-0.5 rounded-full border border-accent/25">
                  Connected
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <div className="font-medium text-white/90">Portfolio-OS-Fiber</div>
                    <div className="text-[10px] text-white/45">5 GHz · 100% Signal Quality</div>
                  </div>
                  <GIconCheck size={14} className="text-accent" />
                </div>

                <div className="flex justify-between text-[11px] text-white/50 px-1 pt-1">
                  <span>Security</span>
                  <span className="text-white/80 font-mono">WPA3 Enterprise</span>
                </div>
                <div className="flex justify-between text-[11px] text-white/50 px-1">
                  <span>IP Address</span>
                  <span className="text-white/80 font-mono">192.168.1.104</span>
                </div>
              </div>

              <button
                onClick={() => {
                  openApp("activity");
                  setWifiOpen(false);
                }}
                className="w-full py-1.5 px-2 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-[11px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <GIconSignal size={12} />
                <span>Diagnostics & Ping...</span>
              </button>
            </div>
          )}
        </div>

        {/* Power Options Trigger (Working Power Button!) */}
        <button
          onClick={openPowerDialog}
          title="Power: Shut Down, Restart, or Switch OS Style"
          className="p-1.5 rounded-lg hover:bg-white/10 hover:text-rose-400 active:scale-95 transition-all text-white/80 cursor-pointer hidden xs:flex items-center justify-center"
        >
          <GIconPower size={16} />
        </button>

        {/* Date & Time with Calendar Flyout */}
        <div ref={dateRef} className="relative">
          <button
            onClick={() => setDateOpen(!dateOpen)}
            title="View Calendar & Clock"
            className={`font-mono text-[11px] sm:text-[14px] whitespace-nowrap px-1 sm:px-1.5 py-0.5 sm:py-1 rounded-lg transition-colors cursor-pointer ${
              dateOpen ? "bg-white/20 text-white shadow-sm" : "hover:bg-white/10 text-white font-medium"
            }`}
          >
            <span className="hidden sm:inline">{date} · </span>
            {time}
          </button>

          {dateOpen && (
            <div
              className="absolute top-full right-0 mt-1.5 w-72 glass rounded-2xl border border-white/15 p-2.5 shadow-2xl z-[1300] origin-top-right select-none"
              style={{ animation: "menuOpen 140ms cubic-bezier(.16,1,.3,1) both" }}
            >
              <CalendarWidget />
            </div>
          )}
        </div>
      </div>

      {mobileSheetOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 select-none"
            onClick={() => setMobileSheetOpen(false)}>
            <div
              className="w-full max-w-lg bg-[#0e1422] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-2xl max-h-[88dvh] flex flex-col shadow-2xl overflow-hidden pb-6 sm:pb-3"
              onClick={(e) => e.stopPropagation()}
              style={{
                animation: "sheetSlideUp 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
              }}>
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-white/25 rounded-full mx-auto mt-3 mb-1 shrink-0" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
                    <GIconCode size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white leading-tight">Portfolio OS</h3>
                    <p className="text-[10px] text-white/50">Emman Mendoza · System Menu</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                  aria-label="Close menu">
                  <GIconClose size={15} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto thin-scroll p-4 space-y-4 flex-1">
                {/* Apps Grid */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2.5 px-0.5">
                    Applications
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "resume", name: "Resume", icon: GIconResume, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                      { id: "chats", name: "Chats", icon: GIconChats, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                      { id: "games", name: "Games", icon: GIconGames, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                      { id: "codeplay", name: "CodePlay", icon: GIconCode, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
                      { id: "terminal", name: "Terminal", icon: GIconTerminal, color: "text-green-400 bg-green-500/10 border-green-500/20" },
                      { id: "notes", name: "Notes", icon: GIconNotes, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
                      { id: "calculator", name: "Calculator", icon: GIconCalculator, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                      { id: "activity", name: "Activity", icon: GIconActivity, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                      { id: "guestbook", name: "Guestbook", icon: GIconBookOpen, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
                      { id: "files", name: "Files", icon: GIconFolder, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
                      { id: "library", name: "Library", icon: GIconLibrary, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
                      { id: "settings", name: "Settings", icon: GIconSettings, color: "text-slate-300 bg-slate-500/10 border-slate-500/20" },
                    ].map((app) => {
                      const Icon = app.icon;
                      return (
                        <button
                          key={app.id}
                          onClick={() => {
                            openApp(app.id as any);
                            setMobileSheetOpen(false);
                          }}
                          className="flex flex-col items-center justify-center p-2 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 transition cursor-pointer">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border mb-1 ${app.color}`}>
                            <Icon size={18} />
                          </div>
                          <span className="text-[10px] text-white/85 font-medium truncate max-w-full text-center">
                            {app.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* System Controls */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2 px-0.5">
                    System Tools
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
                    <MenuItem
                      onClick={() => {
                        openSpotlight();
                        setMobileSheetOpen(false);
                      }}>
                      Spotlight Search (⌘K)
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        toggleControlCenter();
                        setMobileSheetOpen(false);
                      }}>
                      Control Center
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        toggleFullscreen();
                        setMobileSheetOpen(false);
                      }}>
                      {fullscreen ? "Exit Full Screen" : "Enter Full Screen"}
                    </MenuItem>
                    <MenuItem
                      checked={reduceMotion}
                      onClick={() => {
                        toggleMotion();
                        setMobileSheetOpen(false);
                      }}>
                      Reduce Motion
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setModal("about");
                        setMobileSheetOpen(false);
                      }}>
                      About Portfolio OS
                    </MenuItem>
                  </div>
                </div>

                {/* Session & Power */}
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2 px-0.5">
                    Session & Power
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 overflow-hidden">
                    <MenuItem
                      onClick={() => {
                        setMobileSheetOpen(false);
                        reopenPicker();
                      }}>
                      Switch OS Style
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setMobileSheetOpen(false);
                        restart();
                      }}>
                      Restart System
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setMobileSheetOpen(false);
                        powerOff();
                      }}>
                      <span className="text-rose-400">Shut Down</span>
                    </MenuItem>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {modal === "about" && (
        <InfoModal title="About Portfolio OS" onClose={() => setModal(null)}>
          <p>
            A high-performance desktop portfolio operating system powered by <strong>React 19</strong>, <strong>Tailwind v4</strong>, <strong>Gravity UI Icons</strong>, and real-time Socket.IO.
          </p>
          <p>
            Switch dynamically between macOS Sequoia and Windows 11 Fluent interfaces with custom accents, draggable windows, full shell terminal, and live audio.
          </p>
        </InfoModal>
      )}
      {modal === "shortcuts" && (
        <InfoModal title="Keyboard Shortcuts" onClose={() => setModal(null)}>
          <div className="flex justify-between py-0.5">
            <span>Spotlight Search</span>
            <span className="font-mono text-emerald-400 font-semibold">⌘K / Ctrl+K</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Close focused window</span>
            <span className="font-mono text-white/50">⌘W</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Copy portfolio link</span>
            <span className="font-mono text-white/50">⌘C</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Close gallery / modal</span>
            <span className="font-mono text-white/50">Esc</span>
          </div>
        </InfoModal>
      )}
    </div>
  );
}

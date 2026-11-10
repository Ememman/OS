import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useOS } from "../store/useOS";
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
  GIconBars,
  GIconSliders,
  GIconLayoutCells,
} from "./icons/GravityIcons";

interface MenuDropdownProps {
  label: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
}

function MenuDropdown({ label, isOpen, onToggle, onClose, children }: MenuDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, onClose);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`px-3 py-0.5 rounded transition-colors cursor-default text-[14px] ${isOpen ? "bg-white/15 text-white" : "hover:text-white text-white/90 font-medium"}`}>
        {label}
      </button>
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1.5 min-w-[240px] glass rounded-lg border border-white/10 shadow-2xl py-1.5 z-[1300] origin-top-left"
          style={{ animation: "menuOpen 130ms cubic-bezier(.16,1,.3,1) both" }}>
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
}

function MenuItem({ children, onClick, disabled, checked, shortcut }: MenuItemProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 text-left px-4 py-2 text-[14px] ${
        disabled
          ? "text-white/25 cursor-default"
          : "text-white/85 hover:bg-accent hover:text-white cursor-default"
      }`}>
      <span className="w-4 shrink-0">{checked && <GIconCheck size={14} />}</span>
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="text-[12px] text-white/35">{shortcut}</span>
      )}
    </button>
  );
}

function MenuSeparator() {
  return <div className="h-px bg-white/10 my-2" />;
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
  } = useOS();
  const [now, setNow] = useState(new Date());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<"about" | "shortcuts" | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [wifiOpen, setWifiOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const wifiRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  useOutsideClose(wifiRef, () => setWifiOpen(false));
  useOutsideClose(dateRef, () => setDateOpen(false));

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
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const focusedId = windows.length
    ? windows.reduce((a, b) => (a.z > b.z ? a : b)).id
    : null;

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const m = (name: string) => ({
    isOpen: openMenu === name,
    onToggle: () => setOpenMenu((o) => (o === name ? null : name)),
    onClose: () => setOpenMenu((o) => (o === name ? null : o)),
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-8 z-[999] glass flex items-center justify-between px-3 sm:px-4 text-[14px] text-white/95 select-none shadow-md">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Apple-style OS Logo using Gravity UI */}
        <MenuDropdown
          label={
            <div className="flex items-center gap-1.5 py-0.5 font-bold tracking-tight text-white hover:text-white transition-opacity">
              <GIconCode size={16} className="text-accent" />
              <span className="hidden xs:inline text-[13px] font-semibold">Portfolio OS</span>
            </div>
          }
          {...m("apple")}
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
            }}>
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
            onClick={() => {
              windows.forEach((w) => closeWindow(w.id));
              setOpenMenu(null);
            }}>
            Force Quit All Windows
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            onClick={() => {
              setSleeping(true);
              setOpenMenu(null);
            }}>
            Sleep
          </MenuItem>
          <MenuItem
            onClick={() => {
              restart();
              setOpenMenu(null);
            }}>
            Restart…
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

        <button
          onClick={() => setMobileSheetOpen(true)}
          className="sm:hidden p-1 -ml-1 hover:bg-white/10 rounded text-white"
          aria-label="Open mobile menu"
        >
          <GIconBars size={16} />
        </button>

        <div className="hidden sm:flex items-center gap-1">
          <MenuDropdown label="File" {...m("file")}>
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
              New Terminal
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("calculator");
                setOpenMenu(null);
              }}>
              Calculator
            </MenuItem>
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
                openApp("files");
                setOpenMenu(null);
              }}>
              New Finder Window
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("resume");
                setOpenMenu(null);
              }}>
              Open Resume
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              disabled={!focusedId}
              onClick={() => {
                closeWindow(focusedId);
                setOpenMenu(null);
              }}
              shortcut="⌘W">
              Close Window
            </MenuItem>
          </MenuDropdown>

          <MenuDropdown label="Edit" {...m("edit")}>
            <MenuItem
              onClick={() => {
                openSpotlight();
                setOpenMenu(null);
              }}
              shortcut="⌘K">
              Spotlight Search…
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setOpenMenu(null);
              }}
              shortcut="⌘C">
              Copy Portfolio Link
            </MenuItem>
          </MenuDropdown>

          <MenuDropdown label="View" {...m("view")}>
            <MenuItem
              onClick={() => {
                toggleMissionControl();
                setOpenMenu(null);
              }}
              shortcut="F3">
              Mission Control
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                toggleFullscreen();
                setOpenMenu(null);
              }}>
              {fullscreen ? "Exit Full Screen" : "Enter Full Screen"}
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
              disabled={!windows.length}
              onClick={() => {
                windows.forEach((w) => minimizeWindow(w.id));
                setOpenMenu(null);
              }}>
              Show Desktop
            </MenuItem>
          </MenuDropdown>

          <MenuDropdown label="Window" {...m("window")}>
            {windows.length === 0 && (
              <MenuItem disabled>No Open Windows</MenuItem>
            )}
            {windows.map((w) => (
              <MenuItem
                key={w.id}
                checked={w.id === focusedId}
                onClick={() => {
                  focusWindow(w.id);
                  setOpenMenu(null);
                }}>
                {w.title}
              </MenuItem>
            ))}
            {windows.length > 0 && (
              <>
                <MenuSeparator />
                <MenuItem
                  onClick={() => {
                    windows.forEach((w) => minimizeWindow(w.id));
                    setOpenMenu(null);
                  }}>
                  Minimize All
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    windows.forEach((w) => closeWindow(w.id));
                    setOpenMenu(null);
                  }}>
                  Close All
                </MenuItem>
              </>
            )}
          </MenuDropdown>

          <MenuDropdown label="Help" {...m("help")}>
            <MenuItem
              onClick={() => {
                setModal("about");
                setOpenMenu(null);
              }}>
              About This Portfolio
            </MenuItem>
            <MenuItem
              onClick={() => {
                setModal("shortcuts");
                setOpenMenu(null);
              }}>
              Keyboard Shortcuts
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                openApp("chats");
                setOpenMenu(null);
              }}>
              Say Hi in Chat
            </MenuItem>
          </MenuDropdown>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 text-white/90">
        {/* Mission Control Button */}
        <button
          onClick={toggleMissionControl}
          title="Mission Control (F3)"
          className={`flex items-center justify-center p-1.5 rounded-lg transition-all cursor-pointer ${
            missionControlOpen
              ? "bg-accent text-white shadow-md shadow-accent/20"
              : "hover:bg-white/10 text-white/80 hover:text-white"
          }`}
        >
          <GIconLayoutCells size={15} />
        </button>

        {/* Spotlight Trigger */}
        <button
          onClick={openSpotlight}
          title="Spotlight Search (⌘K)"
          className="flex items-center gap-1.5 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 text-white/80 cursor-pointer"
        >
          <GIconSearch size={15} />
          <span className="hidden md:inline text-[11px] text-white/40 border border-white/15 rounded px-1.5 py-0.2">⌘K</span>
        </button>

        {/* Online Visitors Badge -> Opens Chats */}
        <button
          onClick={() => openApp("chats")}
          title="Live Visitors — Click to open Chat"
          className="hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <LiveBadge compact />
        </button>

        {/* macOS Control Center Trigger */}
        <button
          onClick={toggleControlCenter}
          title="Control Center (Display, Sound & System)"
          className={`flex items-center justify-center p-1.5 rounded-lg transition-all cursor-pointer ${
            controlCenterOpen
              ? "bg-accent text-white shadow-md shadow-accent/20"
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
              wifiOpen ? "bg-accent text-white shadow-sm" : "hover:bg-white/10 text-white/80 hover:text-white"
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
            className={`font-mono text-[12px] sm:text-[14px] whitespace-nowrap px-1.5 py-1 rounded-lg transition-colors cursor-pointer ${
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

      {mobileSheetOpen && (
        <div
          className="fixed inset-0 z-[2000] bg-black/60 flex items-end sm:items-center justify-center"
          onClick={() => setMobileSheetOpen(false)}>
          <div
            className="glass rounded-t-2xl sm:rounded-2xl w-full sm:w-80 max-h-[75vh] overflow-y-auto thin-scroll border border-white/10 p-2"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "menuOpen 160ms cubic-bezier(.16,1,.3,1) both",
            }}>
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                Menu
              </span>
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white">
                <GIconClose size={14} />
              </button>
            </div>

            <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-white/35">
              System
            </div>
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
                openApp("terminal");
                setMobileSheetOpen(false);
              }}>
              Terminal
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("notes");
                setMobileSheetOpen(false);
              }}>
              Notes
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("calculator");
                setMobileSheetOpen(false);
              }}>
              Calculator
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("activity");
                setMobileSheetOpen(false);
              }}>
              Activity Monitor
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("guestbook");
                setMobileSheetOpen(false);
              }}>
              Guestbook & Ledger
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("files");
                setMobileSheetOpen(false);
              }}>
              Files
            </MenuItem>
            <MenuItem
              onClick={() => {
                openApp("resume");
                setMobileSheetOpen(false);
              }}>
              Resume
            </MenuItem>

            <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-white/35">
              View
            </div>
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

            <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-white/35">
              Power & Session
            </div>
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
              Shut Down
            </MenuItem>
          </div>
        </div>
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

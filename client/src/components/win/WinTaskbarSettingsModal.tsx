import { useOS, type WinTaskbarConfig } from "../../store/useOS";
import { soundFx } from "../../lib/soundFx";
import { GIconClose, GIconSliders } from "../icons/GravityIcons";

export default function WinTaskbarSettingsModal() {
  const {
    taskbarSettingsModalOpen,
    closeTaskbarSettingsModal,
    winTaskbarConfig,
    setWinTaskbarConfig,
    systemSounds,
    notify,
  } = useOS();

  if (!taskbarSettingsModalOpen) return null;

  const handleToggle = (key: keyof WinTaskbarConfig) => {
    if (systemSounds) soundFx.playClick();
    const currentVal = winTaskbarConfig[key];
    if (typeof currentVal === "boolean") {
      setWinTaskbarConfig({ [key]: !currentVal });
    }
  };

  const handleAlignmentChange = (val: "center" | "left") => {
    if (systemSounds) soundFx.playClick();
    setWinTaskbarConfig({ alignment: val });
    notify("Taskbar Alignment", `Taskbar aligned to ${val === "center" ? "Center" : "Left"}.`, "info", 2000);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 select-none">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={closeTaskbarSettingsModal} />

      {/* Main Settings Card */}
      <div
        className="relative w-full max-w-lg max-h-[88vh] bg-[#141a29]/95 backdrop-blur-3xl rounded-2xl border border-white/18 shadow-[0_24px_70px_rgba(0,0,0,0.85)] ring-1 ring-white/10 flex flex-col overflow-hidden text-white font-sans z-10 animate-fade-in"
        style={{ animation: "menuOpen 180ms cubic-bezier(.16,1,.3,1) both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <GIconSliders size={16} />
            </div>
            <div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                Personalization &gt; Taskbar
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                Taskbar
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              if (systemSounds) soundFx.playClick();
              closeTaskbarSettingsModal();
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
            title="Close Settings"
          >
            <GIconClose size={15} />
          </button>
        </div>

        {/* Scrollable Settings Options matching Windows 11 Reference */}
        <div className="p-4 sm:p-5 overflow-y-auto thin-scroll space-y-4 flex-1">
          {/* 1. Taskbar alignment */}
          <div className="flex flex-col gap-1.5 pb-3 border-b border-white/10">
            <label className="text-xs sm:text-sm font-semibold text-white/95">
              Taskbar alignment
            </label>
            <div className="relative w-full sm:w-60">
              <select
                value={winTaskbarConfig.alignment}
                onChange={(e) => handleAlignmentChange(e.target.value as "center" | "left")}
                className="w-full h-9 px-3 rounded-xl bg-black/40 border border-white/20 text-xs sm:text-sm text-white appearance-none outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 cursor-pointer transition"
              >
                <option value="center" className="bg-[#141a29] text-white">Center</option>
                <option value="left" className="bg-[#141a29] text-white">Left</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/50">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 2. Toggle Switches List matching the exact user screenshot */}
          <div className="space-y-3 pt-1">
            {[
              {
                key: "showWidgets" as const,
                title: "Show Widgets button",
                desc: "Weather chip & widgets board on taskbar",
              },
              {
                key: "showDesktop" as const,
                title: "Show Desktop button",
                desc: "Quick minimize-all sliver at far-right corner",
              },
              {
                key: "autoHide" as const,
                title: "Automatically hide the taskbar in desktop mode",
                desc: "Taskbar auto-collapses and reveals on hover",
              },
              {
                key: "showBadges" as const,
                title: "Show badges on taskbar buttons",
                desc: "Live notification badges on pinned and running apps",
              },
              {
                key: "showInkWorkspace" as const,
                title: "Show Windows Ink Workspace button",
                desc: "Pen & digital sketch tool in system tray",
              },
              {
                key: "showTouchKeyboard" as const,
                title: "Show touch keyboard button",
                desc: "On-screen virtual keyboard toggle in system tray",
              },
              {
                key: "showTaskView" as const,
                title: "Show Task View button",
                desc: "Mission Control overview (F3 / Alt+Tab)",
              },
              {
                key: "showSearch" as const,
                title: "Show search button",
                desc: "Spotlight search shortcut on taskbar",
              },
            ].map((item) => {
              const isOn = Boolean(winTaskbarConfig[item.key]);
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
                >
                  <div className="pr-3">
                    <div className="text-xs sm:text-sm font-medium text-white/95">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-white/40 leading-tight">
                      {item.desc}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                        isOn ? "bg-[#0078d7] border-[#0078d7]" : "bg-black/40 border-white/30"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4.5 w-4.5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out mt-0.5 ${
                          isOn ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold w-7 text-left text-white/80">
                      {isOn ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-black/30 shrink-0">
          <div className="text-[10px] text-white/40 font-mono">
            Windows 11 Experience Pack · v2.5
          </div>
          <button
            onClick={closeTaskbarSettingsModal}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-xs font-semibold text-white transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

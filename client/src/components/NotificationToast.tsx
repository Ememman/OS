import { useOS } from "../store/useOS";
import { GIconSparkles, GIconClose } from "./icons/GravityIcons";

export default function NotificationToast() {
  const { notification, dismissNotification, osMode } = useOS();

  if (!notification) return null;

  const positionClass =
    osMode === "win"
      ? "bottom-16 right-4 sm:right-6 origin-bottom-right"
      : "top-12 right-4 sm:right-6 origin-top-right";

  return (
    <div
      onClick={dismissNotification}
      className={`fixed ${positionClass} z-2500 max-w-sm w-[calc(100vw-32px)] glass rounded-2xl border border-white/20 shadow-2xl p-3 sm:p-3.5 flex items-start gap-3 cursor-pointer hover:border-white/35 transition-all select-none animate-in fade-in`}
      style={{ animation: "menuOpen 180ms cubic-bezier(.16,1,.3,1) both" }}
    >
      <div className="w-8 h-8 rounded-xl bg-accent/25 border border-accent/40 flex items-center justify-center shrink-0 text-accent">
        <GIconSparkles size={16} />
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="text-xs font-semibold text-white truncate leading-tight">
          {notification.title}
        </div>
        <div className="text-[11px] text-white/70 leading-normal mt-0.5">
          {notification.message}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          dismissNotification();
        }}
        className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0 -mr-1 -mt-1"
      >
        <GIconClose size={12} />
      </button>
    </div>
  );
}

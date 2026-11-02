import { useOS } from "../store/useOS";
import {
  GIconCircleInfo,
  GIconClose,
  GIconCheck,
  GIconTrash,
  GIconPencil,
  GIconPlus,
  GIconWrench,
} from "./icons/GravityIcons";
import type { ToastVariant, SystemNotification } from "../types/os";

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    icon: any;
    accentColor: string;
    border: string;
    badgeBg: string;
    label: string;
    progressColor: string;
  }
> = {
  add: {
    icon: GIconPlus,
    accentColor: "#10b981",
    border: "border-emerald-500/35",
    badgeBg: "bg-emerald-500/20 text-emerald-300",
    label: "ADDED",
    progressColor: "bg-emerald-400",
  },
  delete: {
    icon: GIconTrash,
    accentColor: "#f43f5e",
    border: "border-rose-500/35",
    badgeBg: "bg-rose-500/20 text-rose-300",
    label: "DELETED",
    progressColor: "bg-rose-500",
  },
  update: {
    icon: GIconPencil,
    accentColor: "#38bdf8",
    border: "border-sky-500/35",
    badgeBg: "bg-sky-500/20 text-sky-300",
    label: "UPDATED",
    progressColor: "bg-sky-400",
  },
  success: {
    icon: GIconCheck,
    accentColor: "#10b981",
    border: "border-emerald-500/35",
    badgeBg: "bg-emerald-500/20 text-emerald-300",
    label: "SUCCESS",
    progressColor: "bg-emerald-400",
  },
  warning: {
    icon: GIconWrench,
    accentColor: "#f59e0b",
    border: "border-amber-500/35",
    badgeBg: "bg-amber-500/20 text-amber-300",
    label: "ACTION",
    progressColor: "bg-amber-400",
  },
  info: {
    icon: GIconCircleInfo,
    accentColor: "#8b5cf6",
    border: "border-violet-500/35",
    badgeBg: "bg-violet-500/20 text-violet-300",
    label: "NOTICE",
    progressColor: "bg-violet-400",
  },
};

function ToastCard({
  item,
  onDismiss,
}: {
  item: SystemNotification;
  onDismiss: (id: string | number) => void;
}) {
  const variant = item.variant || "info";
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.info;
  const Icon = cfg.icon;
  const duration = item.durationMs || 3800;

  return (
    <div
      onClick={() => onDismiss(item.id)}
      className={`pointer-events-auto relative max-w-sm w-full glass rounded-2xl border ${cfg.border} shadow-2xl p-3 sm:p-3.5 flex flex-col gap-2 cursor-pointer hover:border-white/40 transition-all select-none overflow-hidden group`}
      style={{ animation: "menuOpen 200ms cubic-bezier(.16,1,.3,1) both" }}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-white/10 ${cfg.badgeBg}`}
          style={{ color: cfg.accentColor }}
        >
          <Icon size={14} />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${cfg.badgeBg}`}
            >
              {cfg.label}
            </span>
            <span className="text-xs font-semibold text-white truncate leading-tight">
              {item.title}
            </span>
          </div>
          <div className="text-[11px] text-white/75 leading-normal">
            {item.message}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(item.id);
          }}
          className="p-1 rounded-lg hover:bg-white/15 text-white/40 hover:text-white transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
          title="Dismiss"
        >
          <GIconClose size={12} />
        </button>
      </div>

      {/* Countdown progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 overflow-hidden">
        <div
          className={`h-full ${cfg.progressColor} opacity-80`}
          style={{
            animation: `shrinkWidth ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export default function NotificationToast() {
  const { notifications, dismissNotification, osMode } = useOS();

  if (!notifications || notifications.length === 0) return null;

  const isWin = osMode === "win";

  return (
    <div
      className={`fixed ${
        isWin
          ? "bottom-14 right-4 sm:right-6 flex flex-col-reverse gap-2"
          : "top-12 right-4 sm:right-6 flex flex-col gap-2"
      } z-[2500] max-w-sm w-[calc(100vw-32px)] pointer-events-none`}
    >
      {notifications.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
}

import { toast } from "sonner";
import { soundFx } from "./soundFx";
import { useOS } from "../store/useOS";

export { toast };

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
}

/**
 * Universal OS Toast Notification powered by Sonner with sound effects.
 */
export function showToast(type: ToastType, title: string, options?: ToastOptions) {
  const systemSounds = useOS.getState().systemSounds;
  const duration = options?.duration ?? 4000;

  if (systemSounds) {
    if (type === "error") soundFx.playClose();
    else if (type === "success") soundFx.playPop();
    else soundFx.playNotification();
  }

  switch (type) {
    case "success":
      return toast.success(title, {
        description: options?.description,
        duration,
        action: options?.action,
        cancel: options?.cancel,
      });
    case "error":
      return toast.error(title, {
        description: options?.description,
        duration,
        action: options?.action,
        cancel: options?.cancel,
      });
    case "warning":
      return toast.warning(title, {
        description: options?.description,
        duration,
        action: options?.action,
        cancel: options?.cancel,
      });
    case "loading":
      return toast.loading(title, {
        description: options?.description,
        duration,
      });
    case "info":
    default:
      return toast.info(title, {
        description: options?.description,
        duration,
        action: options?.action,
        cancel: options?.cancel,
      });
  }
}

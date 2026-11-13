import { useOS, type NotificationVariant } from "../store/useOS";

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

export interface ToastOptions {
  description?: string;
  duration?: number;
  id?: string | number;
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
 * Universal OS Toast Notification routed through OS-native notification toast system with sound effects.
 */
export function showToast(type: ToastType, title: string, options?: ToastOptions) {
  const variant: NotificationVariant =
    type === "error" ? "delete" : type === "success" ? "success" : type === "warning" ? "warning" : "info";
  const duration = options?.duration ?? 4000;
  useOS.getState().notify(title, options?.description, variant, duration);
}

export const toast = {
  success: (title: string, options?: ToastOptions) => {
    showToast("success", title, options);
  },
  error: (title: string, options?: ToastOptions) => {
    showToast("error", title, options);
  },
  warning: (title: string, options?: ToastOptions) => {
    showToast("warning", title, options);
  },
  info: (title: string, options?: ToastOptions) => {
    showToast("info", title, options);
  },
  dismiss: (id?: string | number) => {
    useOS.getState().dismissNotification(typeof id === "number" ? id : undefined);
  },
};

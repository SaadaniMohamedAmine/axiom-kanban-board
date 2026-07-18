"use client";

import { createContext, useCallback, useContext } from "react";
import { useTheme } from "next-themes";
import { toast as toastify, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NotificationIcon, notificationBadgeClass } from "@/components/layout/notification-icon";

export type ToastType = "success" | "error" | "info";

export interface NotificationToastPayload {
  type: string;
  title: string;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  notify: (payload: NotificationToastPayload) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  notify: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

function NotificationToastContent({ type, title, message }: NotificationToastPayload) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${notificationBadgeClass(type)}`}>
        <NotificationIcon type={type} className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[13px] font-semibold text-on-surface leading-tight">{title}</p>
        <p className="text-[12px] text-on-surface-variant/70 mt-0.5 leading-snug">{message}</p>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  const toast = useCallback((message: string, type: ToastType = "success") => {
    toastify(message, { type });
  }, []);

  const notify = useCallback((payload: NotificationToastPayload) => {
    toastify(<NotificationToastContent {...payload} />, { icon: false });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, notify }}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={4500}
        newestOnTop
        theme={resolvedTheme === "light" ? "light" : "dark"}
        toastClassName="axiom-toast"
      />
    </ToastContext.Provider>
  );
}

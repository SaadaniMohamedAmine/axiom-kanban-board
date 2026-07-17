"use client";

import { createContext, useCallback, useContext } from "react";
import { useTheme } from "next-themes";
import { toast as toastify, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export type ToastType = "success" | "error" | "info";

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  const toast = useCallback((message: string, type: ToastType = "success") => {
    toastify(message, { type });
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3500}
        newestOnTop
        theme={resolvedTheme === "light" ? "light" : "dark"}
        toastClassName="!rounded-xl !text-[13px] !font-medium"
      />
    </ToastContext.Provider>
  );
}

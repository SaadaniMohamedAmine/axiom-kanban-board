"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "axiom:sidebar-pinned";

interface SidebarContextValue {
  pinned: boolean;
  togglePinned: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  pinned: true,
  togglePinned: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPinned(stored === "true");
    }
  }, []);

  function togglePinned() {
    setPinned((v) => {
      const next = !v;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <SidebarContext.Provider value={{ pinned, togglePinned }}>
      {children}
    </SidebarContext.Provider>
  );
}

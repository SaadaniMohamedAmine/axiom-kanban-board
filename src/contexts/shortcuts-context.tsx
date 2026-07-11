"use client";

import { createContext, useContext, useState } from "react";

interface ShortcutsContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export function useShortcutsPanel() {
  return useContext(ShortcutsContext);
}

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ShortcutsContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((v) => !v),
      }}
    >
      {children}
    </ShortcutsContext.Provider>
  );
}

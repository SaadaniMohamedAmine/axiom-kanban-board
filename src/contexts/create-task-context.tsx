"use client";

import { createContext, useContext, useState } from "react";

interface CreateTaskContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CreateTaskContext = createContext<CreateTaskContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function useCreateTask() {
  return useContext(CreateTaskContext);
}

export function CreateTaskProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CreateTaskContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </CreateTaskContext.Provider>
  );
}

"use client";

import { useState } from "react";
import { useRipple } from "@/hooks/use-ripple";

interface UpgradeCheckoutButtonProps {
  workspaceId: string;
  plan: "PRO" | "TEAM";
  label: string;
  processingLabel: string;
  className: string;
}

export function UpgradeCheckoutButton({ workspaceId, plan, label, processingLabel, className }: UpgradeCheckoutButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const { onMouseDown, rippleElements } = useRipple();

  async function handleClick() {
    setIsPending(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, plan }),
      });
      const { url } = (await res.json()) as { url?: string };
      if (url) {
        window.location.href = url;
      } else {
        setIsPending(false);
      }
    } catch {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseDown={onMouseDown}
      disabled={isPending}
      className={`relative overflow-hidden cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {isPending ? processingLabel : label}
      {rippleElements}
    </button>
  );
}

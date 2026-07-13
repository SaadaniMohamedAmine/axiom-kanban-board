"use client";

import { useRipple } from "@/hooks/use-ripple";

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string;
}

export function RippleButton({ className = "", children, onMouseDown, rippleColor, ...props }: RippleButtonProps) {
  const { onMouseDown: triggerRipple, rippleElements } = useRipple(rippleColor);

  return (
    <button
      {...props}
      onMouseDown={(e) => {
        triggerRipple(e);
        onMouseDown?.(e);
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      {rippleElements}
    </button>
  );
}

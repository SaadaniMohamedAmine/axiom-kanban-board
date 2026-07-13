"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { useRipple } from "@/hooks/use-ripple";

interface MotionCtaProps {
  href: string;
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function MotionCta({ href, className, children, onClick }: MotionCtaProps) {
  const { onMouseDown, rippleElements } = useRipple();

  return (
    <motion.span
      className="inline-block"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={MOTION.ease.spring}
    >
      <Link
        href={href}
        className={`relative overflow-hidden ${className}`}
        onMouseDown={onMouseDown}
        onClick={onClick}
      >
        {children}
        {rippleElements}
      </Link>
    </motion.span>
  );
}

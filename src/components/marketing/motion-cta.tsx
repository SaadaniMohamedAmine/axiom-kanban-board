"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";

interface MotionCtaProps {
  href: string;
  className: string;
  children: React.ReactNode;
}

export function MotionCta({ href, className, children }: MotionCtaProps) {
  return (
    <motion.span
      className="inline-block"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={MOTION.ease.spring}
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.span>
  );
}

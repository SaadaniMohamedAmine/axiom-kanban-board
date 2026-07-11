"use client";

import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={MOTION.variants.fadeIn}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

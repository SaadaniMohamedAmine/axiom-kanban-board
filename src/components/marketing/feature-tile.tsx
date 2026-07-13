"use client";

import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";

interface FeatureTileProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export function FeatureTile({ children, className, index = 0 }: FeatureTileProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: MOTION.duration.slow, ease: MOTION.ease.decelerate, delay: index * 0.08 }}
    >
      {children}
    </motion.div>
  );
}

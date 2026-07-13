"use client";

import { motion } from "framer-motion";
import { MOTION } from "@/lib/motion";
import { MotionCta } from "@/components/marketing/motion-cta";

interface HeroContentProps {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  startFree: string;
  viewDemo: string;
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: MOTION.duration.slow, ease: MOTION.ease.decelerate } },
};

export function HeroContent({ badge, titleLine1, titleLine2, subtitle, startFree, viewDemo }: HeroContentProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="visible">
      <motion.div
        variants={item}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/8 mb-8"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE] animate-pulse" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-[#8B5CF6]">{badge}</span>
      </motion.div>

      <motion.h1
        variants={item}
        className="text-[52px] md:text-[72px] font-semibold text-on-surface leading-[1.05] tracking-tight mb-6"
      >
        {titleLine1}
        <br />
        <span className="text-primary">{titleLine2}</span>
      </motion.h1>

      <motion.p
        variants={item}
        className="text-[18px] md:text-[20px] text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed"
      >
        {subtitle}
      </motion.p>

      <motion.div variants={item} className="flex items-center justify-center gap-4 flex-wrap mb-20">
        <MotionCta
          href="/sign-up"
          className="px-7 py-3.5 bg-primary text-white rounded-md text-[15px] font-semibold hover:brightness-110 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-[background,box-shadow]"
        >
          {startFree}
        </MotionCta>
        <MotionCta
          href="/login"
          className="px-7 py-3.5 border border-outline-variant bg-surface-container text-on-surface rounded-md text-[15px] font-medium hover:bg-surface-container-high transition-colors"
        >
          {viewDemo}
        </MotionCta>
      </motion.div>
    </motion.div>
  );
}

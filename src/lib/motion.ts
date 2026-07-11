export const MOTION = {
  duration: {
    instant: 0.1,
    fast: 0.15,
    normal: 0.2,
    moderate: 0.3,
    slow: 0.4,
  },

  ease: {
    standard: [0.4, 0, 0.2, 1] as const,
    decelerate: [0, 0, 0.2, 1] as const,
    accelerate: [0.4, 0, 1, 1] as const,
    spring: { type: "spring" as const, stiffness: 380, damping: 30 },
    springGentle: { type: "spring" as const, stiffness: 200, damping: 25 },
  },

  variants: {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
    },
    slideUp: {
      hidden: { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } },
      exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.96 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } },
      exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
    },
    modalOverlay: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.15 } },
      exit: { opacity: 0, transition: { duration: 0.12 } },
    },
    modalContent: {
      hidden: { opacity: 0, scale: 0.97, y: 8 },
      visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } },
      exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
    },
    listItem: {
      hidden: { opacity: 0, x: -6 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 6 },
    },
  },
} as const;

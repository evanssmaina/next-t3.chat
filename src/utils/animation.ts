export const FADE_ANIMATION = {
  initial: { opacity: 0, y: 1 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeInOut" },
} as const;

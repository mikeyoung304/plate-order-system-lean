/**
 * Simple performance utility replacements
 * These are minimal implementations to replace the deleted performance library
 */

// Simple pass-through for API calls (no actual monitoring)
export async function measureApiCall<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return fn();
}

// Empty hook for render performance (does nothing)
export function useRenderPerformance(componentName: string): void {
  // No-op: Performance monitoring removed
}

// Simple animation variants for Framer Motion
export const optimizedVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 }
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 }
  },
  pulse: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.05, 1],
      transition: { 
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  }
};

// Empty performance monitor object
export const performanceMonitor = {
  init: () => {},
  track: () => {},
  measure: () => {},
  report: () => {}
};
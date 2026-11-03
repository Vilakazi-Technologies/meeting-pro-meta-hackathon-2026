import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Accessibility gate from motion-foundations:
 * when true, skip transforms; opacity-only fades ≤ 200ms are allowed.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const sync = () => {
        if (mounted) setReduced(mq.matches);
      };
      sync();
      mq.addEventListener?.('change', sync);
      return () => {
        mounted = false;
        sub.remove();
        mq.removeEventListener?.('change', sync);
      };
    }

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

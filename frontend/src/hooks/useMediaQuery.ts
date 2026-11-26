import { useCallback, useSyncExternalStore } from 'react';
import { BREAKPOINTS } from '../styles/tokens';

/**
 * Observe une media query CSS via useSyncExternalStore (sans cascade de rendu, sûr SSR).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }
      const media = window.matchMedia(query);
      media.addEventListener('change', onStoreChange);
      return () => media.removeEventListener('change', onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Retourne les indicateurs booléens alignés sur les 4 paliers officiels SamaAdresse Clarté.
 */
export function useBreakpoints() {
  const isTabletUp = useMediaQuery(`(min-width: ${BREAKPOINTS.tabletMin}px)`);
  const isDesktopUp = useMediaQuery(`(min-width: ${BREAKPOINTS.desktopMin}px)`);
  const isWideUp = useMediaQuery(`(min-width: ${BREAKPOINTS.wideMin}px)`);

  return {
    isMobile: !isTabletUp,
    isTablet: isTabletUp && !isDesktopUp,
    isDesktop: isDesktopUp,
    isWide: isWideUp,
  };
}

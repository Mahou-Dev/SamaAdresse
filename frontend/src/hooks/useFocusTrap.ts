import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface UseFocusTrapOptions {
  isActive: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onEscape?: () => void;
  initialFocusSelector?: string;
  lockScroll?: boolean;
}

/**
 * Piège le focus clavier à l'intérieur d'un conteneur (Modal, Drawer),
 * gère la fermeture par Échap, verrouille le défilement du corps et restaure
 * le focus sur l'élément déclencheur à la fermeture (WCAG 2.2 AA).
 *
 * `onEscape` est stocké dans une référence stable afin d'éviter toute
 * réinitialisation intempestive du focus lors des re-rendus du parent.
 */
export function useFocusTrap({
  isActive,
  containerRef,
  onEscape,
  initialFocusSelector,
  lockScroll = true,
}: UseFocusTrapOptions): void {
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef<(() => void) | undefined>(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!isActive || typeof document === 'undefined') return;

    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    if (lockScroll) {
      document.body.style.overflow = 'hidden';
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeRef.current?.();
        return;
      }

      if (event.key === 'Tab' && containerRef.current) {
        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      if (initialFocusSelector) {
        const target = container.querySelector<HTMLElement>(initialFocusSelector);
        if (target) {
          target.focus();
          return;
        }
      }

      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        container.focus();
      }
    }, 30);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      if (lockScroll) {
        document.body.style.overflow = previousOverflow;
      }
      previousActiveRef.current?.focus();
    };
  }, [isActive, containerRef, initialFocusSelector, lockScroll]);
}

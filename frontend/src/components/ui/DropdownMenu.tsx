import React, { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useClickOutside } from '../../hooks/useClickOutside';
import { cn } from '../../utils/cn';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  triggerAriaLabel?: string;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  header?: React.ReactNode;
  className?: string;
  menuClassName?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  triggerAriaLabel,
  items,
  align = 'right',
  header,
  className,
  menuClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const menuId = useId();

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    const enabledIndices = items
      .map((item, idx) => (!item.disabled ? idx : -1))
      .filter((idx) => idx !== -1);

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (enabledIndices.length === 0) return;

    const currentIndex = itemRefs.current.findIndex((el) => el === document.activeElement);
    const currentPos = enabledIndices.indexOf(currentIndex);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = enabledIndices[(currentPos + 1) % enabledIndices.length];
      itemRefs.current[next]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = enabledIndices[(currentPos - 1 + enabledIndices.length) % enabledIndices.length];
      itemRefs.current[prev]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      itemRefs.current[enabledIndices[0]]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      itemRefs.current[enabledIndices[enabledIndices.length - 1]]?.focus();
    }
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={triggerAriaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !isOpen) {
            e.preventDefault();
            setIsOpen(true);
          } else if (e.key === 'Escape' && isOpen) {
            e.preventDefault();
            setIsOpen(false);
          }
        }}
        className="inline-flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution cursor-pointer"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute top-full mt-2 z-[var(--z-dropdown)] min-w-[220px] rounded-2xl',
            'bg-surface-elevated border border-border shadow-lg py-1.5 sa-animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {header && <div className="px-3.5 py-2.5 border-b border-border mb-1">{header}</div>}

          {items.map((item, idx) => {
            const Icon = item.icon;
            const itemClasses = cn(
              'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-left transition-colors',
              'focus-visible:outline-none focus-visible:bg-surface-hover',
              item.disabled
                ? 'opacity-45 cursor-not-allowed'
                : item.danger
                ? 'text-danger hover:bg-danger-soft cursor-pointer'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-hover cursor-pointer'
            );

            return (
              <React.Fragment key={item.id}>
                {item.dividerBefore && <div role="separator" className="my-1 border-t border-border" />}

                {item.to && !item.disabled ? (
                  <Link
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    to={item.to}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                    className={itemClasses}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <button
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.disabled) return;
                      setIsOpen(false);
                      item.onClick?.();
                    }}
                    className={itemClasses}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    <span>{item.label}</span>
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

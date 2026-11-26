import React, { useRef } from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export type TabsVariant = 'segment' | 'underline' | 'pill';

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: TabsVariant;
  ariaLabel?: string;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'segment',
  ariaLabel = 'Onglets de navigation',
  className,
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledIndices = tabs
      .map((t, idx) => (!t.disabled ? idx : -1))
      .filter((idx) => idx !== -1);

    if (enabledIndices.length === 0) return;

    const currentPos = enabledIndices.indexOf(index);
    let nextPos = -1;

    if (e.key === 'ArrowRight') {
      nextPos = (currentPos + 1) % enabledIndices.length;
    } else if (e.key === 'ArrowLeft') {
      nextPos = (currentPos - 1 + enabledIndices.length) % enabledIndices.length;
    } else if (e.key === 'Home') {
      nextPos = 0;
    } else if (e.key === 'End') {
      nextPos = enabledIndices.length - 1;
    }

    if (nextPos !== -1) {
      e.preventDefault();
      const targetIndex = enabledIndices[nextPos];
      onChange(tabs[targetIndex].id);
      tabRefs.current[targetIndex]?.focus();
    }
  };

  const containerClasses: Record<TabsVariant, string> = {
    segment: 'inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface border border-border',
    underline: 'flex items-center gap-1 border-b border-border overflow-x-auto sa-no-scrollbar',
    pill: 'inline-flex flex-wrap items-center gap-2',
  };

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn(containerClasses[variant], className)}>
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        const buttonClasses =
          variant === 'underline'
            ? cn(
                'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-brand text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-border-strong'
              )
            : variant === 'pill'
            ? cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all',
                isActive
                  ? 'bg-ink text-ink-inverse border-ink shadow-xs'
                  : 'bg-surface-elevated text-ink-secondary border-border hover:border-border-strong hover:bg-surface'
              )
            : cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all',
                isActive
                  ? 'bg-surface-elevated text-ink shadow-xs border border-border'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-hover border border-transparent'
              );

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-controls={`panel-${tab.id}`}
            aria-selected={isActive}
            disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'min-h-[40px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution',
              tab.disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer',
              buttonClasses
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0',
                  isActive && variant !== 'pill' ? 'text-brand' : 'text-current'
                )}
                aria-hidden="true"
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-xs font-mono px-1.5 py-0.5 rounded-full leading-none',
                  isActive && variant === 'pill'
                    ? 'bg-canvas/20 text-ink-inverse'
                    : isActive
                    ? 'bg-brand-soft text-brand-hover'
                    : 'bg-surface-hover text-ink-muted'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  id,
  activeTab,
  children,
  className,
}) => {
  const isSelected = activeTab === id;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!isSelected}
      tabIndex={0}
      className={cn('focus-visible:outline-none', className)}
    >
      {isSelected ? children : null}
    </div>
  );
};

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ComponentSize } from '../../types/designSystem';
import { cn } from '../../utils/cn';

export interface AddressCodeProps {
  code: string;
  size?: ComponentSize;
  variant?: 'inline' | 'pill' | 'subtle';
  copyable?: boolean;
  onCopy?: (code: string) => void;
  className?: string;
}

const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base sm:text-lg',
};

const VARIANT_CLASSES = {
  inline: 'text-institution font-bold',
  pill: 'px-2.5 py-1 rounded-lg bg-institution-soft text-institution border border-institution-border font-bold',
  subtle: 'px-2 py-0.5 rounded-md bg-surface text-ink border border-border font-semibold',
} as const;

export const AddressCode: React.FC<AddressCodeProps> = ({
  code,
  size = 'md',
  variant = 'pill',
  copyable = false,
  onCopy,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopied(true);
    onCopy?.(code);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono tracking-tight whitespace-nowrap select-all',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <span>{code}</span>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copier le code ${code}`}
          title={copied ? 'Code copié' : `Copier ${code}`}
          className="inline-flex items-center justify-center p-1 -mr-1 rounded-md text-current hover:bg-institution/10 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-institution"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
          )}
        </button>
      )}
    </span>
  );
};

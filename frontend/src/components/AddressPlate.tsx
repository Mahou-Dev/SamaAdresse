import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { getLocationTypeLabel } from '../utils/locationTypes';
import { getZoneName } from '../utils/geoGrid';
import { cn } from '../utils/cn';

export interface AddressPlateProps {
  code: string;
  zone?: string;
  type?: string;
  size?: 'sm' | 'md' | 'lg';
  showCopy?: boolean;
  className?: string;
  isExample?: boolean;
  animated?: boolean;
}

const SIZE_CONFIG = {
  sm: {
    container: 'p-1 rounded-lg w-full',
    inner: 'px-2 py-1.5 rounded-md gap-1',
    rivetSize: 'w-1.5 h-1.5',
    bandeauPadding: 'pb-0.5',
    bandeauText: 'text-[11px] tracking-wide',
    codeText: 'text-[clamp(15px,4.2vw,18px)] font-extrabold whitespace-nowrap leading-tight',
    badgeText: 'text-[11px] leading-none px-1.5 py-0.5',
    codeMinHeight: 'min-h-0',
  },
  md: {
    container: 'p-1.5 rounded-xl max-w-sm sm:max-w-md w-full',
    inner: 'px-3 py-2 sm:px-4 sm:py-3 rounded-lg gap-1.5',
    rivetSize: 'w-2 h-2',
    bandeauPadding: 'pb-1',
    bandeauText: 'text-[11px] sm:text-xs tracking-wider',
    codeText: 'text-[clamp(1.35rem,5.8vw,1.95rem)] font-extrabold whitespace-nowrap leading-tight',
    badgeText: 'text-[11px] sm:text-xs leading-none px-2 py-0.5',
    codeMinHeight: 'min-h-[2rem]',
  },
  lg: {
    container: 'p-2 rounded-2xl max-w-lg w-full',
    inner: 'px-3.5 py-3 sm:p-5 rounded-xl gap-2',
    rivetSize: 'w-2.5 h-2.5',
    bandeauPadding: 'pb-1.5',
    bandeauText: 'text-[11px] sm:text-xs tracking-widest',
    codeText: 'text-[clamp(1.5rem,6.8vw,2.6rem)] font-extrabold whitespace-nowrap leading-none',
    badgeText: 'text-[11px] sm:text-xs leading-none px-2 py-1',
    codeMinHeight: 'min-h-[2.5rem]',
  },
} as const;

interface PlateRivetProps {
  position: string;
  sizeClass: string;
}

const PlateRivet: React.FC<PlateRivetProps> = ({ position, sizeClass }) => (
  <svg
    className={cn(
      'absolute text-border-strong print:hidden pointer-events-none',
      position,
      sizeClass
    )}
    viewBox="0 0 10 10"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="5" cy="5" r="4.5" className="fill-surface stroke-border-strong" strokeWidth="1" />
    <circle cx="5" cy="5" r="1.5" className="fill-ink-muted" />
  </svg>
);

export const AddressPlate: React.FC<AddressPlateProps> = ({
  code,
  zone,
  type,
  size = 'md',
  showCopy = false,
  className = '',
  isExample = false,
  animated = false,
}) => {
  const [copied, setCopied] = useState(false);

  const zoneCode = zone?.toUpperCase() || (code ? code.split('-')[0]?.toUpperCase() : '');
  const zoneName = getZoneName(zoneCode).toUpperCase();
  const typeLabel = getLocationTypeLabel(type);
  const sizeConfig = SIZE_CONFIG[size];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const renderBadges = () => (
    <div className="flex items-center gap-1.5 shrink-0">
      {isExample && (
        <span
          className="font-bold text-brand-hover bg-brand-soft border border-brand-border rounded-md px-1.5 py-0.5 text-[11px] leading-none tracking-wide print:border-black print:text-black shrink-0"
          title="Plaque de démonstration (Exemple)"
        >
          Exemple
        </span>
      )}

      {typeLabel && (
        <span
          className={cn(
            'font-semibold text-ink-secondary bg-surface border border-border rounded-md print:border-black print:bg-white print:text-black shrink-0',
            sizeConfig.badgeText
          )}
        >
          {typeLabel}
        </span>
      )}
    </div>
  );

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className={cn(
          'relative bg-institution border-2 border-institution-hover shadow-sm print:border-black print:bg-white print:shadow-none transition-shadow',
          sizeConfig.container
        )}
        data-testid="address-plate"
      >
        <PlateRivet position="top-1 left-1" sizeClass={sizeConfig.rivetSize} />
        <PlateRivet position="top-1 right-1" sizeClass={sizeConfig.rivetSize} />
        <PlateRivet position="bottom-1 left-1" sizeClass={sizeConfig.rivetSize} />
        <PlateRivet position="bottom-1 right-1" sizeClass={sizeConfig.rivetSize} />

        {/* Cadre intérieur émaillé */}
        <div
          className={cn(
            'relative flex flex-col items-center justify-center text-center bg-canvas border border-institution/25 shadow-xs print:border-black print:bg-white print:shadow-none',
            sizeConfig.inner
          )}
        >
          {/* Bandeau supérieur : jamais tronqué */}
          <div
            className={cn(
              'w-full flex items-center gap-1.5 border-b border-border print:border-black min-w-0',
              size === 'sm' ? 'justify-center' : 'justify-center min-[400px]:justify-between',
              sizeConfig.bandeauPadding
            )}
          >
            <span
              className={cn(
                'font-bold text-institution font-sans print:text-black uppercase whitespace-nowrap',
                sizeConfig.bandeauText
              )}
            >
              SAMAADRESSE
              <span className="hidden min-[400px]:inline">
                {zoneName ? ` · ${zoneName}` : ''}
              </span>
            </span>

            {size !== 'sm' && (isExample || typeLabel) && (
              <div className="hidden min-[400px]:flex items-center shrink-0">
                {renderBadges()}
              </div>
            )}
          </div>

          {/* Code Central : JetBrains Mono plat, jamais sur 2 lignes */}
          <div
            role="group"
            className={cn(
              'w-full flex items-center justify-center py-0.5 overflow-hidden',
              sizeConfig.codeMinHeight
            )}
            aria-label={code}
          >
            <span
              className={cn(
                'font-mono font-extrabold tracking-tight text-institution select-all print:text-black inline-block text-center whitespace-nowrap',
                sizeConfig.codeText,
                animated && 'motion-safe:animate-[pulse_4s_ease-in-out_infinite]'
              )}
              style={{ textShadow: 'none' }}
            >
              {code}
            </span>
          </div>

          {/* Ligne inférieure pour le tag de type */}
          {(isExample || typeLabel) && (
            <div
              className={cn(
                'w-full flex items-center justify-end pt-0.5 border-t border-border/70',
                size === 'sm' ? 'flex' : 'flex min-[400px]:hidden'
              )}
            >
              {renderBadges()}
            </div>
          )}
        </div>
      </div>

      {showCopy && (
        <div className="w-full flex justify-center mt-2.5 print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-xs font-semibold text-institution transition shadow-xs cursor-pointer min-h-[40px] focus-visible:outline-2 focus-visible:outline-institution"
            title="Copier le code de la plaque"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                <span className="text-success">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copier le code</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

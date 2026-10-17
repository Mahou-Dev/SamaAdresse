import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { getLocationTypeLabel } from '../utils/locationTypes';
import { getZoneName } from '../utils/geoGrid';

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
    setTimeout(() => setCopied(false), 2000);
  };

  // Dimensions et typographies adaptées avec clamp() :
  // - Aucun retour à la ligne du code de 320 à 1440 px (whitespace-nowrap)
  // - Tag de type >= 11 px partout
  // - Code >= 15 px dans les listes (sm), et occupe l'essentiel de la largeur sur la fiche (lg)
  const sizeConfig = {
    sm: {
      container: 'p-1 rounded-md w-full',
      inner: 'px-2 py-1.5 rounded-sm gap-1',
      rivetSize: 'w-1.5 h-1.5',
      bandeauPadding: 'pb-0.5',
      bandeauText: 'text-[11px] tracking-wide',
      codeText: 'text-[clamp(15px,4.2vw,18px)] font-extrabold whitespace-nowrap leading-tight',
      badgeText: 'text-[11px] leading-none px-1.5 py-0.5',
      codeMinHeight: 'min-h-0',
    },
    md: {
      container: 'p-1.5 rounded-lg max-w-sm sm:max-w-md w-full',
      inner: 'px-3 py-2 sm:px-4 sm:py-3 rounded-md gap-1.5',
      rivetSize: 'w-2 h-2',
      bandeauPadding: 'pb-1',
      bandeauText: 'text-[11px] sm:text-xs tracking-wider',
      codeText: 'text-[clamp(1.35rem,5.8vw,1.95rem)] font-extrabold whitespace-nowrap leading-tight',
      badgeText: 'text-[11px] sm:text-xs leading-none px-2 py-0.5',
      codeMinHeight: 'min-h-[2rem]',
    },
    lg: {
      container: 'p-2 rounded-xl max-w-lg w-full',
      inner: 'px-3.5 py-3 sm:p-5 rounded-lg gap-2',
      rivetSize: 'w-2.5 h-2.5',
      bandeauPadding: 'pb-1.5',
      bandeauText: 'text-[11px] sm:text-xs tracking-widest',
      codeText: 'text-[clamp(1.5rem,6.8vw,2.6rem)] font-extrabold whitespace-nowrap leading-none',
      badgeText: 'text-[11px] sm:text-xs leading-none px-2 py-1',
      codeMinHeight: 'min-h-[2.5rem]',
    },
  }[size];

  // Rivet SVG léger représentant les fixations des plaques de rue
  const Rivet = ({ position }: { position: string }) => (
    <svg
      className={`absolute ${position} ${sizeConfig.rivetSize} text-[#8C8272] print:hidden pointer-events-none`}
      viewBox="0 0 10 10"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="5" r="4.5" fill="#E6DDD0" stroke="#8C8272" strokeWidth="1" />
      <circle cx="5" cy="5" r="1.5" fill="#5C4D44" />
    </svg>
  );

  const renderBadges = () => (
    <div className="flex items-center gap-1.5 shrink-0">
      {isExample && (
        <span
          className="font-bold text-[#8A3112] bg-[#F2ECE1] border border-[#8C8272] rounded px-1.5 py-0.5 text-[11px] leading-none tracking-wide print:border-black print:text-black shadow-[0_1px_0_rgba(35,26,21,0.05)] shrink-0"
          title="Plaque de démonstration (Exemple)"
        >
          Exemple
        </span>
      )}

      {typeLabel && (
        <span
          className={`font-semibold text-[#231A15] bg-[#F2ECE1] border border-[#D4CEBF] rounded-sm print:border-black print:bg-white print:text-black shrink-0 ${sizeConfig.badgeText}`}
        >
          {typeLabel}
        </span>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`relative bg-[#1D528F] border-2 border-[#153C6B] shadow-[0_2px_0_rgba(35,26,21,0.12)] print:border-black print:bg-white print:shadow-none transition-shadow ${sizeConfig.container}`}
        data-testid="address-plate"
      >
        {/* 4 Rivets d'angle légers */}
        <Rivet position="top-1 left-1" />
        <Rivet position="top-1 right-1" />
        <Rivet position="bottom-1 left-1" />
        <Rivet position="bottom-1 right-1" />

        {/* Cadre intérieur émaillé (double bordure) avec relief subtil */}
        <div
          className={`relative flex flex-col items-center justify-center text-center bg-[#FFFFFF] border border-[#1D528F]/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(29,82,143,0.08)] print:border-black print:bg-white print:shadow-none ${sizeConfig.inner}`}
        >
          {/* Bandeau supérieur : JAMAIS tronqué. Sous 400 px (ou en taille sm), SAMAADRESSE s'affiche seul en haut */}
          <div
            className={`w-full flex items-center ${
              size === 'sm'
                ? 'justify-center'
                : 'justify-center min-[400px]:justify-between'
            } gap-1.5 border-b border-[#E6DDD0] print:border-black min-w-0 ${sizeConfig.bandeauPadding}`}
          >
            <span
              className={`font-bold text-[#1D528F] font-sans print:text-black uppercase whitespace-nowrap ${sizeConfig.bandeauText}`}
            >
              SAMAADRESSE
              <span className="hidden min-[400px]:inline">
                {zoneName ? ` · ${zoneName}` : ''}
              </span>
            </span>

            {/* Sur md/lg à partir de 400 px, le tag est à droite dans le bandeau */}
            {size !== 'sm' && (isExample || typeLabel) && (
              <div className="hidden min-[400px]:flex items-center shrink-0">
                {renderBadges()}
              </div>
            )}
          </div>

          {/* Code Central : Texte plat JetBrains Mono, sans ombre, JAMAIS sur 2 lignes (white-space: nowrap) */}
          <div
            role="group"
            className={`w-full flex items-center justify-center py-0.5 overflow-hidden ${sizeConfig.codeMinHeight}`}
            aria-label={code}
          >
            <span
              className={`font-mono font-extrabold tracking-tight text-[#1D528F] select-all print:text-black inline-block text-center whitespace-nowrap ${sizeConfig.codeText} ${
                animated ? 'motion-safe:animate-[pulse_4s_ease-in-out_infinite]' : ''
              }`}
              style={{ textShadow: 'none' }}
            >
              {code}
            </span>
          </div>

          {/* Ligne inférieure pour le tag de type : toujours sur sa propre ligne sous 400 px (et en taille sm) */}
          {(isExample || typeLabel) && (
            <div
              className={`w-full flex items-center justify-end pt-0.5 border-t border-[#E6DDD0]/60 ${
                size === 'sm' ? 'flex' : 'flex min-[400px]:hidden'
              }`}
            >
              {renderBadges()}
            </div>
          )}
        </div>
      </div>

      {/* Bouton "Copier le code" placé DESSOUS de la plaque avec retour visuel "Copié" */}
      {showCopy && (
        <div className="w-full flex justify-center mt-2 print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-xs font-bold text-[#1D528F] transition shadow-[0_1px_0_rgba(35,26,21,0.06)] cursor-pointer touch-target"
            title="Copier le code de la plaque"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#2A6B44]" />
                <span className="text-[#2A6B44]">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier le code</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

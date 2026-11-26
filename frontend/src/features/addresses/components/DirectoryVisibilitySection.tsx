import React from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface DirectoryVisibilitySectionProps {
  listed: boolean;
  showOwnerName: boolean;
  onListedChange: (listed: boolean) => void;
  onShowOwnerNameChange: (showOwnerName: boolean) => void;
  listedId: string;
  showOwnerId: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  listedHelpText?: string;
}

/**
 * Volet de visibilité dans l'annuaire public (réutilisé entre Création et Modification).
 * Respecte strictement le consentement explicite : showOwnerName n'est visible que si listed=true.
 */
export const DirectoryVisibilitySection: React.FC<DirectoryVisibilitySectionProps> = ({
  listed,
  showOwnerName,
  onListedChange,
  onShowOwnerNameChange,
  listedId,
  showOwnerId,
  defaultOpen = true,
  disabled = false,
  listedHelpText = "Par défaut, votre adresse reste privée (accessible uniquement via son code ou son QR code). Cochez cette option pour qu'elle soit trouvable dans l'annuaire public.",
}) => {
  return (
    <details
      open={defaultOpen}
      className={cn(
        'group rounded-2xl border border-border bg-surface p-4 text-xs sm:text-sm',
        disabled && 'opacity-65 pointer-events-none'
      )}
    >
      <summary className="font-semibold text-institution cursor-pointer hover:text-institution-hover list-none flex items-center justify-between gap-2 min-h-[32px] focus-visible:outline-2 focus-visible:outline-institution rounded-lg">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Visibilité dans l'annuaire</span>
        </div>
        <ChevronDown
          className="w-4 h-4 text-ink-muted group-open:rotate-180 transition-transform shrink-0"
          aria-hidden="true"
        />
      </summary>

      <div className="mt-3.5 pt-3.5 border-t border-border space-y-3.5">
        <div className="flex items-start gap-3">
          <input
            id={listedId}
            type="checkbox"
            checked={listed}
            disabled={disabled}
            onChange={(e) => {
              const checked = e.target.checked;
              onListedChange(checked);
              if (!checked) {
                onShowOwnerNameChange(false);
              }
            }}
            className="mt-0.5 w-4 h-4 rounded border-border-control accent-institution cursor-pointer shrink-0"
          />
          <div className="space-y-0.5">
            <label htmlFor={listedId} className="font-semibold text-ink cursor-pointer block">
              Figurer dans l'annuaire public
            </label>
            <p className="text-xs text-ink-muted leading-relaxed">{listedHelpText}</p>
          </div>
        </div>

        {listed && (
          <div className="flex items-start gap-3 pl-7 pt-1">
            <input
              id={showOwnerId}
              type="checkbox"
              checked={showOwnerName}
              disabled={disabled}
              onChange={(e) => onShowOwnerNameChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border-control accent-institution cursor-pointer shrink-0"
            />
            <div className="space-y-0.5">
              <label htmlFor={showOwnerId} className="font-semibold text-ink cursor-pointer block">
                Afficher mon nom sur la fiche
              </label>
              <p className="text-xs text-ink-muted leading-relaxed">
                Votre nom sera visible par toute personne consultant l'annuaire.
              </p>
            </div>
          </div>
        )}
      </div>
    </details>
  );
};

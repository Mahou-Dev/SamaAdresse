import React from 'react';
import type { LocationType } from '../../../api/addressApi';
import { SegmentedPicker } from '../../../components/SegmentedPicker';
import { cn } from '../../../utils/cn';

export interface AddressDetailsFieldsProps {
  locationType: LocationType;
  onLocationTypeChange: (value: LocationType) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  descriptionId: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  descriptionHelper?: string;
  descriptionError?: string | null;
  disabled?: boolean;
  required?: boolean;
}

export const AddressDetailsFields: React.FC<AddressDetailsFieldsProps> = ({
  locationType,
  onLocationTypeChange,
  description,
  onDescriptionChange,
  descriptionId,
  descriptionLabel = 'Repère visuel ou description',
  descriptionPlaceholder = 'Ex. : Porte verte en face de la boutique Chez Moussa, à 50 m du grand manguier…',
  descriptionHelper = 'Indiquez des détails visibles depuis la voie publique : couleur de façade, commerce voisin, croisement.',
  descriptionError,
  disabled = false,
  required = true,
}) => {
  const feedbackId = `${descriptionId}-feedback`;
  const charCount = description.length;
  const overLimit = charCount > 500;
  const hasError = Boolean(descriptionError) || overLimit;

  return (
    <div className="space-y-5">
      {/* Type de lieu (3 valeurs réelles backend : MAISON, COMMERCE, INSTITUTION) */}
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-ink">
          Type de lieu
        </span>
        <SegmentedPicker
          value={locationType}
          onChange={onLocationTypeChange}
          label="Type de lieu"
          disabled={disabled}
        />
      </div>

      {/* Description / repère visuel */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={descriptionId}
            className="block text-sm font-semibold text-ink"
          >
            {descriptionLabel}
            {required && (
              <span className="text-danger ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
          <span
            className={cn(
              'text-xs font-mono',
              overLimit ? 'text-danger font-bold' : 'text-ink-muted'
            )}
          >
            {charCount}/500
          </span>
        </div>

        <textarea
          id={descriptionId}
          rows={4}
          maxLength={500}
          required={required}
          disabled={disabled}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={descriptionPlaceholder}
          aria-invalid={hasError || undefined}
          aria-describedby={feedbackId}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border bg-surface-elevated text-sm text-ink placeholder:text-ink-muted leading-relaxed resize-y min-h-[112px] transition-colors',
            'focus-visible:outline-none focus-visible:ring-3 disabled:opacity-65 disabled:bg-surface disabled:cursor-not-allowed',
            hasError
              ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
              : 'border-border-control hover:border-ink-secondary focus-visible:border-institution focus-visible:ring-institution/20'
          )}
        />

        {descriptionError ? (
          <p id={feedbackId} role="alert" className="text-xs font-medium text-danger">
            {descriptionError}
          </p>
        ) : (
          <p id={feedbackId} className="text-xs text-ink-muted leading-relaxed">
            {descriptionHelper}
          </p>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { LocationType } from '../../../api/addressApi';
import { AddressDetailsFields } from '../components/AddressDetailsFields';
import { DirectoryVisibilitySection } from '../components/DirectoryVisibilitySection';

export interface WizardStepDetailsProps {
  locationType: LocationType;
  onLocationTypeChange: (value: LocationType) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  listed: boolean;
  onListedChange: (value: boolean) => void;
  showOwnerName: boolean;
  onShowOwnerNameChange: (value: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export const WizardStepDetails: React.FC<WizardStepDetailsProps> = ({
  locationType,
  onLocationTypeChange,
  description,
  onDescriptionChange,
  listed,
  onListedChange,
  showOwnerName,
  onShowOwnerNameChange,
  onBack,
  onNext,
}) => {
  return (
    <section aria-labelledby="step2-title" className="space-y-6 sa-animate-fade-in">
      <div className="space-y-1.5">
        <h1
          id="step2-title"
          className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight"
        >
          Décrivez votre lieu
        </h1>
        <p className="text-sm text-ink-secondary leading-relaxed">
          Précisez la nature du bâtiment et un repère visuel clair pour faciliter l'orientation des visiteurs et livreurs.
        </p>
      </div>

      <div className="p-5 sm:p-6 rounded-2xl bg-surface-elevated border border-border shadow-xs space-y-6">
        <AddressDetailsFields
          locationType={locationType}
          onLocationTypeChange={onLocationTypeChange}
          description={description}
          onDescriptionChange={onDescriptionChange}
          descriptionId="address-desc"
        />

        <DirectoryVisibilitySection
          listed={listed}
          showOwnerName={showOwnerName}
          onListedChange={onListedChange}
          onShowOwnerNameChange={onShowOwnerNameChange}
          listedId="directory-listed"
          showOwnerId="directory-show-owner"
          defaultOpen={true}
        />
      </div>

      {/* Navigation */}
      <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-xs sm:text-sm font-semibold text-ink transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-institution"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Retour à l'emplacement</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!description.trim()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse text-sm font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
        >
          <span>Continuer vers la photo</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

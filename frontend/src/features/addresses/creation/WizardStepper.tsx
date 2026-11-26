import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../utils/cn';

const WIZARD_STEPS = [
  { id: 1, shortLabel: 'Emplacement', title: 'Emplacement' },
  { id: 2, shortLabel: 'Informations', title: 'Informations du lieu' },
  { id: 3, shortLabel: 'Photo', title: 'Photo de façade' },
  { id: 4, shortLabel: 'Plaque', title: 'Votre plaque d’adresse' },
] as const;

export interface WizardStepperProps {
  currentStep: number;
  headingRef: React.RefObject<HTMLSpanElement | null>;
  onStepSelect?: (step: number) => void;
  disabled?: boolean;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  headingRef,
  onStepSelect,
  disabled = false,
}) => {
  const activeStep = WIZARD_STEPS[currentStep - 1] ?? WIZARD_STEPS[0];
  const percent = Math.round((currentStep / WIZARD_STEPS.length) * 100);

  return (
    <div className="space-y-4">
      {/* Annonce lecteurs d'écran */}
      <div className="sr-only" aria-live="polite">
        Étape {currentStep} sur 4 : {activeStep.title}
      </div>

      {/* Titre courant + pourcentage */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          ref={headingRef}
          tabIndex={-1}
          className="text-sm font-bold text-ink outline-none"
        >
          Étape {currentStep} sur 4 : {activeStep.title}
        </span>
        <span className="font-mono text-xs font-semibold text-ink-muted">{percent}%</span>
      </div>

      {/* Barre de progression accessible */}
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={4}
        aria-label="Progression de création d'adresse"
        className="w-full bg-surface-active h-1.5 rounded-full overflow-hidden"
      >
        <div
          className="bg-brand h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Repères visuels des 4 étapes (navigation arrière autorisée sur les étapes déjà complétées) */}
      <ol className="grid grid-cols-4 gap-1.5 sm:gap-2" aria-label="Étapes du parcours">
        {WIZARD_STEPS.map((item) => {
          const isCompleted = item.id < currentStep;
          const isCurrent = item.id === currentStep;
          const canJumpBack = Boolean(onStepSelect) && isCompleted && currentStep < 4 && !disabled;

          const content = (
            <>
              <span
                className={cn(
                  'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors',
                  isCompleted
                    ? 'bg-success text-ink-inverse'
                    : isCurrent
                    ? 'bg-brand text-ink-inverse shadow-xs'
                    : 'bg-surface border border-border-strong text-ink-muted'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  item.id
                )}
              </span>
              <span
                className={cn(
                  'text-[11px] sm:text-xs truncate',
                  isCurrent
                    ? 'font-bold text-ink'
                    : isCompleted
                    ? 'font-semibold text-ink-secondary'
                    : 'font-medium text-ink-muted'
                )}
              >
                {item.shortLabel}
              </span>
            </>
          );

          return (
            <li key={item.id} className="min-w-0">
              {canJumpBack ? (
                <button
                  type="button"
                  onClick={() => onStepSelect?.(item.id)}
                  className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 px-2 py-2 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors cursor-pointer min-h-[44px] focus-visible:outline-2 focus-visible:outline-institution"
                >
                  {content}
                </button>
              ) : (
                <div
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 px-2 py-2 rounded-xl border min-h-[44px]',
                    isCurrent
                      ? 'bg-brand-soft/60 border-brand-border'
                      : 'bg-surface/60 border-transparent'
                  )}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

import React from 'react';
import {
  Camera,
  RotateCcw,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Check,
  MapPin,
} from 'lucide-react';
import { formatFileSize } from '../../../utils/imageCompressor';
import type { LocationType } from '../../../api/addressApi';
import { getLocationTypeLabel } from '../../../utils/locationTypes';

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

export interface WizardStepPhotoProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  photoFile: File | null;
  photoPreview: string | null;
  compressing: boolean;
  compressionStats: CompressionStats | null;
  photoError: string | null;
  submitting: boolean;
  summaryQuartierLabel: string | null;
  locationType: LocationType;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  onBack: () => void;
  onSubmitWithoutPhoto: () => void;
  onSubmitWithPhoto: () => void;
}

export const WizardStepPhoto: React.FC<WizardStepPhotoProps> = ({
  fileInputRef,
  photoFile,
  photoPreview,
  compressing,
  compressionStats,
  photoError,
  submitting,
  summaryQuartierLabel,
  locationType,
  onPhotoSelect,
  onRemovePhoto,
  onBack,
  onSubmitWithoutPhoto,
  onSubmitWithPhoto,
}) => {
  return (
    <section aria-labelledby="step3-title" className="space-y-6 sa-animate-fade-in">
      <div className="space-y-1.5">
        <h1
          id="step3-title"
          className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight"
        >
          Ajouter une photo de façade
        </h1>
        <p className="text-sm text-ink-secondary leading-relaxed">
          Une photo nette de l'entrée aide vos visiteurs et livreurs à confirmer le lieu au premier coup d'œil. Cette étape est facultative.
        </p>
      </div>

      {/* Récapitulatif rapide avant création */}
      {summaryQuartierLabel && (
        <div className="px-4 py-3 rounded-2xl bg-surface border border-border flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary">
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
            <MapPin className="w-3.5 h-3.5 text-institution shrink-0" aria-hidden="true" />
            <span>{summaryQuartierLabel}</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-elevated border border-border font-semibold text-ink-secondary">
            {getLocationTypeLabel(locationType)}
          </span>
        </div>
      )}

      {/* Zone de sélection et prévisualisation photo */}
      <div className="p-5 sm:p-6 bg-surface-elevated rounded-2xl border border-border shadow-xs space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          id="camera-input"
          onChange={onPhotoSelect}
          className="hidden"
        />

        {!photoPreview ? (
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-border-strong rounded-2xl bg-surface text-center space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-soft border border-brand-border flex items-center justify-center text-brand">
              <Camera className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-ink">
                Prenez une photo ou choisissez une image
              </p>
              <p className="text-xs text-ink-muted">
                Formats JPEG, PNG, WebP (max 10 Mo) · Compression automatique avant envoi
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={compressing || submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-ink hover:bg-ink-secondary text-ink-inverse text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
            >
              <Camera className="w-4 h-4 text-brand-border" aria-hidden="true" />
              <span>Prendre ou sélectionner une photo</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="relative rounded-2xl overflow-hidden border border-border bg-surface-secondary aspect-[4/3] max-h-80 w-full flex items-center justify-center">
              <img
                src={photoPreview}
                alt="Aperçu de la façade"
                className="w-full h-full object-cover"
              />
            </div>

            {compressionStats && (
              <div className="p-3 rounded-xl bg-success-soft border border-success-border text-xs text-ink-secondary flex items-center justify-between flex-wrap gap-2">
                <span className="font-medium">
                  Poids optimisé : {formatFileSize(compressionStats.originalSize)} →{' '}
                  <strong className="text-success">
                    {formatFileSize(compressionStats.compressedSize)}
                  </strong>{' '}
                  (-{compressionStats.reductionPercentage}%)
                </span>
                <span className="text-success font-semibold">Prête pour l'envoi</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing || submitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-xs font-semibold text-ink transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                <span>Reprendre</span>
              </button>
              <button
                type="button"
                onClick={onRemovePhoto}
                disabled={compressing || submitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-danger-border bg-danger-soft hover:bg-danger/10 text-xs font-semibold text-danger transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        )}

        {compressing && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 text-xs font-medium text-ink-secondary py-2"
          >
            <Loader2 className="w-4 h-4 animate-spin text-brand" aria-hidden="true" />
            <span>Compression et optimisation de la photo en cours…</span>
          </div>
        )}

        {photoError && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-danger-soft border border-danger-border text-xs sm:text-sm font-medium text-danger flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{photoError}</span>
          </div>
        )}
      </div>

      {/* Navigation & validation finale */}
      <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-xs sm:text-sm font-semibold text-ink transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-institution"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Retour aux détails</span>
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {!photoFile && (
            <button
              type="button"
              onClick={onSubmitWithoutPhoto}
              disabled={submitting || compressing}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-ink-secondary hover:text-ink hover:bg-surface transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-institution"
            >
              Passer cette étape
            </button>
          )}

          <button
            type="button"
            onClick={onSubmitWithPhoto}
            disabled={submitting || compressing}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[46px] rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse text-sm font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Création de l'adresse en cours…</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                <span>Valider et créer l'adresse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

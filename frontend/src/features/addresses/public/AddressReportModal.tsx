import React, { useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Flag } from 'lucide-react';
import { createPublicReport } from '../../../api/addressApi';
import type { ReportReason } from '../../../api/addressApi';
import { ApiError } from '../../../api/apiClient';
import { useOnlineStatus } from '../../../context/OnlineStatusContext';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { REPORT_REASONS } from '../utils';
import { cn } from '../../../utils/cn';

export interface AddressReportModalProps {
  isOpen: boolean;
  code: string;
  onClose: () => void;
}

export const AddressReportModal: React.FC<AddressReportModalProps> = ({
  isOpen,
  code,
  onClose,
}) => {
  const { isOnline } = useOnlineStatus();
  const [reason, setReason] = useState<ReportReason>('POSITION_INCORRECTE');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const submittingRef = useRef(false);

  // Réinitialisation propre à l'ouverture
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setReason('POSITION_INCORRECTE');
      setComment('');
      setError(null);
      setSuccess(false);
      setSubmitting(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || submitting) return;

    if (!isOnline) {
      setError("L'envoi d'un signalement nécessite une connexion Internet.");
      return;
    }

    const allowed = REPORT_REASONS.map((r) => r.value);
    if (!allowed.includes(reason)) {
      setError('Veuillez sélectionner un motif valide.');
      return;
    }

    if (comment.length > 300) {
      setError('Le commentaire ne doit pas dépasser 300 caractères.');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      await createPublicReport(code, {
        reason,
        comment: comment.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Trop de signalements, réessayez plus tard.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Impossible d'envoyer le signalement.");
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Signaler un problème"
      description={`Fiche ${code} · transmis à l'équipe de modération`}
      titleId="report-modal-title"
      size="md"
      closeOnBackdrop={!submitting}
      closeOnEscape={!submitting}
      footer={
        success ? (
          <Button variant="primary" size="md" onClick={onClose}>
            Fermer
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="md"
              disabled={submitting}
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="public-report-form"
              variant="primary"
              size="md"
              leftIcon={Flag}
              isLoading={submitting}
              disabled={submitting || !isOnline}
              className="w-full sm:w-auto"
            >
              {submitting ? 'Envoi en cours…' : 'Envoyer le signalement'}
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-2xl bg-success-soft border border-success-border text-success flex items-start gap-3 text-sm font-medium"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-bold">Merci, votre signalement a été transmis.</p>
            <p className="text-xs text-ink-secondary">
              Notre équipe examinera cette fiche dans les meilleurs délais.
            </p>
          </div>
        </div>
      ) : (
        <form id="public-report-form" onSubmit={handleSubmit} className="space-y-5">
          <fieldset className="space-y-2.5" disabled={submitting}>
            <legend className="text-sm font-semibold text-ink mb-2">
              Motif du signalement
            </legend>
            {REPORT_REASONS.map((item) => {
              const checked = reason === item.value;
              return (
                <label
                  key={item.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-colors',
                    checked
                      ? 'border-brand bg-brand-soft/60 text-ink'
                      : 'border-border bg-surface-elevated text-ink hover:bg-surface'
                  )}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={item.value}
                    checked={checked}
                    onChange={() => setReason(item.value)}
                    className="mt-0.5 accent-brand shrink-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="font-semibold block">{item.label}</span>
                    <span className="text-xs text-ink-muted block leading-snug">
                      {item.description}
                    </span>
                  </div>
                </label>
              );
            })}
          </fieldset>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label htmlFor="report-comment" className="font-semibold text-ink">
                Précisions (optionnel)
              </label>
              <span
                className={cn(
                  'font-mono text-xs',
                  comment.length > 300 ? 'text-danger font-bold' : 'text-ink-muted'
                )}
              >
                {comment.length}/300
              </span>
            </div>
            <textarea
              id="report-comment"
              rows={3}
              maxLength={300}
              disabled={submitting}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Indiquez brièvement le problème constaté…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-control bg-surface-elevated text-sm text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:border-institution focus-visible:ring-3 focus-visible:ring-institution/20"
            />
          </div>

          {!isOnline && (
            <div
              role="status"
              className="p-3 rounded-xl bg-warning-soft border border-warning-border text-warning text-xs font-medium"
            >
              Vous êtes hors ligne. Reconnectez-vous pour transmettre un signalement.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-danger-soft border border-danger-border text-danger text-xs sm:text-sm font-medium flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
};

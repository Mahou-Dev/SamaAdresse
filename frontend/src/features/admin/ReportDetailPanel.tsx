import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Loader2,
  RotateCcw,
  ExternalLink,
  ImageOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { AdminReportResponse } from '../../api/addressApi';
import { SidePanel, StatusBadge } from '../../components/ui';
import { AddressPlate } from '../../components/AddressPlate';
import { getLocationTypeLabel } from '../../utils/locationTypes';
import { resolvePhotoSrc } from '../addresses/utils';
import { REASON_LABELS } from './types';

export interface ReportDetailPanelProps {
  report: AdminReportResponse | null;
  isOpen: boolean;
  processing: boolean;
  inlineSuspendReason: string;
  inlineSuspendError: string | null;
  onInlineSuspendReasonChange: (value: string) => void;
  onInlineSuspendSubmit: () => void;
  onClose: () => void;
  onRequestDismiss: (report: AdminReportResponse) => void;
  onRequestResolve: (report: AdminReportResponse) => void;
  onRequestOpenSuspendModal: () => void;
  onRequestOpenReinstateModal: () => void;
}

export const ReportDetailPanel: React.FC<ReportDetailPanelProps> = ({
  report,
  isOpen,
  processing,
  inlineSuspendReason,
  inlineSuspendError,
  onInlineSuspendReasonChange,
  onInlineSuspendSubmit,
  onClose,
  onRequestDismiss,
  onRequestResolve,
  onRequestOpenSuspendModal,
  onRequestOpenReinstateModal,
}) => {
  const [brokenPhotoUrl, setBrokenPhotoUrl] = useState<string | null>(null);
  const photoSrc = resolvePhotoSrc(report?.addressPhotoUrl);
  const hasValidPhoto = Boolean(photoSrc) && brokenPhotoUrl !== photoSrc;

  return (
    <SidePanel
      isOpen={isOpen && Boolean(report)}
      onClose={onClose}
      title={`Signalement — ${report?.addressCode || ''}`}
      subtitle={
        report
          ? `Reçu le ${new Date(report.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`
          : undefined
      }
      width="md"
      footer={
        report && (
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-2">
            {report.status === 'OPEN' && (
              <>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onRequestDismiss(report)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-xs font-semibold transition-colors cursor-pointer min-h-[40px] disabled:opacity-45"
                >
                  <XCircle className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                  <span>Classer sans suite</span>
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => onRequestResolve(report)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-success hover:bg-success-hover text-ink-inverse text-xs font-semibold transition-colors shadow-xs cursor-pointer min-h-[40px] disabled:opacity-45"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Marquer traité</span>
                </button>
              </>
            )}

            {report.addressStatus === 'ACTIVE' ? (
              <button
                type="button"
                disabled={processing}
                onClick={onRequestOpenSuspendModal}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-danger hover:bg-danger-hover text-ink-inverse text-xs font-semibold transition-colors shadow-xs cursor-pointer min-h-[40px] disabled:opacity-45"
              >
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Suspendre l'adresse</span>
              </button>
            ) : report.addressStatus === 'SUSPENDED' ? (
              <button
                type="button"
                disabled={processing}
                onClick={onRequestOpenReinstateModal}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-success hover:bg-success-hover text-ink-inverse text-xs font-semibold transition-colors shadow-xs cursor-pointer min-h-[40px] disabled:opacity-45"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Rétablir l'adresse</span>
              </button>
            ) : null}
          </div>
        )
      }
    >
      {report && (
        <div className="space-y-5 text-xs">
          {/* Statuts courants */}
          <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl bg-surface border border-border">
            <span className="text-ink-muted font-medium">Signalement :</span>
            <StatusBadge status={report.status} size="sm" />
            <span className="text-border-strong" aria-hidden="true">·</span>
            <span className="text-ink-muted font-medium">Adresse :</span>
            <StatusBadge status={report.addressStatus} size="sm" />
          </div>

          {/* Motif & précisions du visiteur */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted block">
              Motif déclaré
            </span>
            <p className="text-sm font-bold text-ink">
              {REASON_LABELS[report.reason] || report.reason}
            </p>
            {report.comment ? (
              <div className="pt-2 border-t border-border">
                <span className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Précisions apportées
                </span>
                <p className="text-xs text-ink-secondary italic bg-surface-elevated p-3 rounded-lg border border-border leading-relaxed">
                  « {report.comment} »
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-muted italic">Aucun commentaire complémentaire.</p>
            )}
          </div>

          {/* Plaque officielle */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted block">
              Plaque de l'adresse
            </span>
            <AddressPlate
              code={report.addressCode}
              zone={report.addressZone}
              type={report.addressLocationType}
              showCopy={false}
            />
          </div>

          {/* Données publiques de l'adresse (aucune PII propriétaire) */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted block">
              Données publiques de l'adresse
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-ink-muted block text-[11px]">Quartier</span>
                <span className="font-bold text-ink">{report.addressQuartier}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Type de lieu</span>
                <span className="font-bold text-ink">
                  {getLocationTypeLabel(report.addressLocationType)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-ink-muted block text-[11px]">Description</span>
              <p className="text-ink-secondary mt-0.5 leading-relaxed">
                {report.addressDescription || 'Aucune description renseignée.'}
              </p>
            </div>

            {hasValidPhoto && photoSrc ? (
              <div className="pt-2.5 border-t border-border space-y-1.5">
                <span className="text-[11px] font-semibold text-ink-muted block">
                  Photo de façade
                </span>
                <img
                  src={photoSrc}
                  alt={`Façade ${report.addressCode}`}
                  className="w-full h-48 object-cover rounded-xl border border-border"
                  loading="lazy"
                  onError={() => setBrokenPhotoUrl(photoSrc)}
                />
              </div>
            ) : (
              <div className="pt-2 border-t border-border flex items-center gap-2 text-ink-muted">
                <ImageOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="italic">
                  {photoSrc
                    ? 'Impossible de charger la photo de façade.'
                    : 'Cette adresse ne possède aucune photo de façade.'}
                </span>
              </div>
            )}

            {report.addressStatus === 'ACTIVE' && (
              <div className="pt-2.5 border-t border-border">
                <Link
                  to={`/a/${report.addressCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-institution hover:text-institution-hover hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Ouvrir la fiche publique dans un nouvel onglet</span>
                </Link>
              </div>
            )}
          </div>

          {/* Action directe de suspension avec motif obligatoire (compatible lot4b) */}
          {report.addressStatus === 'ACTIVE' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onInlineSuspendSubmit();
              }}
              className="p-4 rounded-xl bg-danger-soft border border-danger-border space-y-3"
            >
              <div className="flex items-center gap-2 text-danger">
                <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-bold text-xs">Modération de l'adresse</span>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="suspend-reason-input"
                  className="block text-xs font-semibold text-ink"
                >
                  Motif de suspension (obligatoire pour suspendre)
                </label>
                <textarea
                  id="suspend-reason-input"
                  rows={2}
                  maxLength={300}
                  value={inlineSuspendReason}
                  onChange={(e) => onInlineSuspendReasonChange(e.target.value)}
                  placeholder="Indiquez la raison de la suspension…"
                  className="w-full px-3 py-2 rounded-xl border border-border-strong bg-canvas text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-institution focus:ring-2 focus:ring-institution-soft"
                />
              </div>
              {inlineSuspendError && (
                <p role="alert" className="text-xs font-semibold text-danger">
                  {inlineSuspendError}
                </p>
              )}
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-danger hover:bg-danger-hover text-ink-inverse text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-45 min-h-[40px]"
              >
                {processing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Suspendre l'adresse</span>
              </button>
            </form>
          )}

          {report.addressStatus === 'SUSPENDED' && (
            <div className="p-4 rounded-xl bg-danger-soft border border-danger-border space-y-3">
              <div className="flex items-center gap-2 text-danger text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Cette adresse est actuellement suspendue (HTTP 410 en public).</span>
              </div>
              <button
                type="button"
                disabled={processing}
                onClick={onRequestOpenReinstateModal}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-success hover:bg-success-hover text-ink-inverse text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-45 min-h-[40px]"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Rétablir l'adresse</span>
              </button>
            </div>
          )}
        </div>
      )}
    </SidePanel>
  );
};

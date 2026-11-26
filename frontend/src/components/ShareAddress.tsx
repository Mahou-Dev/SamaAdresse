import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Smartphone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Download,
  Printer,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { SmsShareForm } from './SmsShareForm';
import {
  buildPublicUrl,
  buildShareText,
  buildWhatsAppUrl,
  buildSmsSchemeUrl,
  copyToClipboard,
} from '../utils/share';

export interface ShareAddressProps {
  /** Code d'adresse (ex : ZIG-KBG-4271) */
  code: string;
  /** Description courte (pour le partage natif) */
  description?: string;
  /** Afficher le bloc QR Code et téléchargement à l'intérieur du panneau de partage */
  showQrCode?: boolean;
}

/**
 * Panneau de partage SamaAdresse 2.0 Clarté :
 * - Copie du code et du lien public canonique
 * - WhatsApp & partage natif (navigator.share ou repli sms:)
 * - QR Code réel (/api/addresses/{code}/qrcode) + téléchargement & impression (optionnel)
 * - Formulaire SMS serveur (utilisateurs connectés) ou lien SMS natif (visiteurs)
 */
export const ShareAddress: React.FC<ShareAddressProps> = ({
  code,
  description,
  showQrCode = false,
}) => {
  const { isAuthenticated } = useAuth();
  const { isOnline } = useOnlineStatus();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSmsForm, setShowSmsForm] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);

  const publicUrl = buildPublicUrl(code);
  const shareText = buildShareText(code);
  const whatsAppUrl = buildWhatsAppUrl(shareText);
  const smsUrl = buildSmsSchemeUrl(shareText);
  const qrEndpoint = `${import.meta.env.VITE_API_BASE_URL || ''}/api/addresses/${encodeURIComponent(code)}/qrcode`;

  const handleCopyCode = async () => {
    setCopyFeedback(null);
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopyFeedback(
        'Impossible de copier automatiquement : veuillez sélectionner et copier le code manuellement.'
      );
      window.setTimeout(() => setCopyFeedback(null), 5000);
    }
  };

  const handleCopyLink = async () => {
    setCopyFeedback(null);
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopyFeedback(
        "Impossible de copier automatiquement : veuillez copier le lien depuis la barre d'adresse."
      );
      window.setTimeout(() => setCopyFeedback(null), 5000);
    }
  };

  const handleNativeShare = async () => {
    setCopyFeedback(null);

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Adresse ${code} — SamaAdresse`,
          text: description
            ? `${description} — Code : ${code}`
            : `Mon adresse SamaAdresse : ${code}`,
          url: publicUrl,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    window.location.href = smsUrl;
  };

  const handleDownloadQrCode = () => {
    const link = document.createElement('a');
    link.href = qrEndpoint;
    link.download = `samaadresse-${code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="rounded-2xl bg-surface-elevated border border-border shadow-xs overflow-hidden"
      aria-label="Partager cette adresse"
    >
      {/* En-tête */}
      <div className="px-5 py-4 border-b border-border bg-surface flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-institution-soft border border-institution-border text-institution flex items-center justify-center shrink-0">
          <Share2 className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink">Partager cette adresse</h2>
          <p className="text-xs text-ink-muted truncate">
            {showQrCode ? 'Code, lien, QR code, WhatsApp, SMS' : 'Code, lien, WhatsApp, SMS'}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4" aria-live="polite">
        {/* Aperçu du lien public */}
        <div className="px-3.5 py-2.5 rounded-xl bg-surface border border-border flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-ink-secondary truncate select-all">
            {publicUrl}
          </span>
        </div>

        {/* Ligne 1 : Copier le code + Copier le lien */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            id="share-copy-code-btn"
            type="button"
            onClick={handleCopyCode}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-surface-elevated hover:bg-surface border border-border-strong text-xs sm:text-sm font-semibold text-ink transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-institution"
          >
            {copiedCode ? (
              <Check className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4 text-institution shrink-0" aria-hidden="true" />
            )}
            <span>{copiedCode ? 'Copié !' : 'Copier le code'}</span>
          </button>

          <button
            id="share-copy-link-btn"
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-surface-elevated hover:bg-surface border border-border-strong text-xs sm:text-sm font-semibold text-ink transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-institution"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
            )}
            <span>{copiedLink ? 'Lien copié !' : 'Copier le lien'}</span>
          </button>
        </div>

        {copyFeedback && (
          <p
            role="alert"
            className="text-xs font-medium text-warning bg-warning-soft p-3 rounded-xl border border-warning-border"
          >
            {copyFeedback}
          </p>
        )}

        {/* Ligne 2 : WhatsApp + Partage natif / SMS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            id="share-whatsapp-btn"
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-nature-soft hover:bg-nature/15 border border-nature-border text-xs sm:text-sm font-semibold text-nature transition-colors focus-visible:outline-2 focus-visible:outline-institution"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>

          <button
            id="share-native-btn"
            type="button"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-surface hover:bg-surface-hover border border-border text-xs sm:text-sm font-semibold text-ink transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-institution"
          >
            <Smartphone className="w-4 h-4 text-institution shrink-0" aria-hidden="true" />
            <span>Partager</span>
          </button>
        </div>

        {/* QR Code réel (uniquement monté si showQrCode=true) */}
        {showQrCode && (
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <QrCode className="w-4 h-4 text-institution" aria-hidden="true" />
              <span>QR Code de la fiche publique</span>
            </div>

            {!isOnline ? (
              <p className="text-xs text-ink-muted bg-surface border border-border rounded-xl p-3">
                La génération du QR Code nécessite une connexion Internet.
              </p>
            ) : qrFailed ? (
              <div
                role="alert"
                className="flex items-center gap-2 text-xs text-danger bg-danger-soft border border-danger-border rounded-xl p-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Impossible de charger l'image du QR Code pour le moment.</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-surface border border-border">
                <div className="p-2 bg-canvas border border-border rounded-xl shrink-0">
                  <img
                    src={qrEndpoint}
                    alt={`QR code de l'adresse ${code}`}
                    width={128}
                    height={128}
                    loading="lazy"
                    decoding="async"
                    onError={() => setQrFailed(true)}
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2.5">
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Scannable par toute caméra de smartphone pour ouvrir directement la fiche{' '}
                    <span className="font-mono font-bold text-institution">{code}</span>.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadQrCode}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-ink hover:bg-ink-secondary text-ink-inverse text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Télécharger le QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface-hover text-ink text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                      <span>Imprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Séparateur SMS serveur (connecté) ou SMS natif (visiteur) */}
        <div className="border-t border-border pt-4">
          {isAuthenticated ? (
            <div className="space-y-3">
              <button
                id="share-sms-toggle-btn"
                type="button"
                onClick={() => setShowSmsForm((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-nature-soft hover:bg-nature/15 border border-nature-border text-xs sm:text-sm font-semibold text-nature transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-institution"
                aria-expanded={showSmsForm}
                aria-controls="sms-share-panel"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Envoyer par SMS</span>
                </span>
                {showSmsForm ? (
                  <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
              </button>

              {showSmsForm && (
                <div id="sms-share-panel" className="pt-1">
                  <SmsShareForm addressCode={code} />
                </div>
              )}
            </div>
          ) : (
            <a
              href={smsUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-surface hover:bg-surface-hover border border-border text-xs sm:text-sm font-semibold text-ink transition-colors focus-visible:outline-2 focus-visible:outline-institution"
            >
              <MessageSquare className="w-4 h-4 text-nature shrink-0" aria-hidden="true" />
              <span>Envoyer par SMS (application téléphone)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

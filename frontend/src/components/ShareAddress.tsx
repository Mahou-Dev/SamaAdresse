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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SmsShareForm } from './SmsShareForm';
import {
  buildPublicUrl,
  buildShareText,
  buildWhatsAppUrl,
  buildSmsSchemeUrl,
  copyToClipboard,
} from '../utils/share';

interface ShareAddressProps {
  /** Code d'adresse (ex : ZIG-KBG-4271) */
  code: string;
  /** Description courte (pour le partage natif) */
  description?: string;
}

/**
 * Bloc de partage d'adresse avec :
 * - Copie du code
 * - Copie du lien
 * - WhatsApp
 * - Partage natif (navigator.share) ou lien sms: natif
 * - Formulaire SMS serveur (utilisateurs connectés)
 */
export const ShareAddress: React.FC<ShareAddressProps> = ({ code, description }) => {
  const { isAuthenticated } = useAuth();

  const [copiedCode, setCopiedCode]   = useState(false);
  const [copiedLink, setCopiedLink]   = useState(false);
  const [showSmsForm, setShowSmsForm] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const publicUrl   = buildPublicUrl(code);
  const shareText   = buildShareText(code);
  const whatsAppUrl = buildWhatsAppUrl(shareText);
  const smsUrl      = buildSmsSchemeUrl(shareText);

  const handleCopyCode = async () => {
    setCopyFeedback(null);
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopyFeedback("Impossible de copier automatiquement : veuillez sélectionner et copier le code manuellement.");
      setTimeout(() => setCopyFeedback(null), 5000);
    }
  };

  const handleCopyLink = async () => {
    setCopyFeedback(null);
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopyFeedback("Impossible de copier automatiquement : veuillez copier le lien depuis la barre d'adresse.");
      setTimeout(() => setCopyFeedback(null), 5000);
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
        return; // Partage réussi, fin du traitement
      } catch (err: any) {
        // Si l'utilisateur annule volontairement (AbortError), ne rien faire (aucun repli)
        if (err?.name === 'AbortError') {
          return;
        }
        // Pour toute autre erreur de partage, passage au repli SMS
      }
    }

    // Repli vers sms:?&body= uniquement si navigator.share est absent ou rejette avec une autre erreur
    window.location.href = smsUrl;
  };

  return (
    <div
      className="rounded-2xl bg-[#FFFFFF] border border-[#D4CEBF] shadow-sm overflow-hidden"
      aria-label="Partager cette adresse"
    >
      {/* En-tête */}
      <div className="px-5 py-4 border-b border-[#E6DDD0] flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-[#F2ECE1]">
          <Share2 className="w-4 h-4 text-[#1D528F]" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-[#231A15]">Partager cette adresse</h2>
          <p className="text-xs text-[#5C4D44]">Code, lien, WhatsApp, SMS</p>
        </div>
      </div>

      <div className="p-5 space-y-4" aria-live="polite">
        {/* Ligne 1 : Copier le code + Copier le lien */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="share-copy-code-btn"
            onClick={handleCopyCode}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
              bg-[#FBF9F5] hover:bg-[#F2ECE1] border border-[#D4CEBF] hover:border-[#1D528F]/40
              text-xs font-bold text-[#231A15] transition cursor-pointer"
          >
            {copiedCode
              ? <Check className="w-3.5 h-3.5 text-[#2A6B44]" />
              : <Copy className="w-3.5 h-3.5 text-[#1D528F]" />}
            <span>{copiedCode ? 'Copié !' : 'Copier le code'}</span>
          </button>

          <button
            id="share-copy-link-btn"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
              bg-[#FBF9F5] hover:bg-[#F2ECE1] border border-[#D4CEBF] hover:border-[#1D528F]/40
              text-xs font-bold text-[#231A15] transition cursor-pointer"
          >
            {copiedLink
              ? <Check className="w-3.5 h-3.5 text-[#2A6B44]" />
              : <Copy className="w-3.5 h-3.5 text-[#B84A24]" />}
            <span>{copiedLink ? 'Lien copié !' : 'Copier le lien'}</span>
          </button>
        </div>

        {copyFeedback && (
          <p role="alert" className="text-xs text-[#B84A24] bg-[#F2ECE1] p-2 rounded-lg border border-[#D4CEBF]">
            {copyFeedback}
          </p>
        )}

        {/* Ligne 2 : WhatsApp + Partage natif / SMS */}
        <div className="grid grid-cols-2 gap-2">
          <a
            id="share-whatsapp-btn"
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
              bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30
              text-xs font-bold text-[#128C2F] transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <button
            id="share-native-btn"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
              bg-[#F2ECE1] hover:bg-[#E6DDD0] border border-[#D4CEBF]
              text-xs font-bold text-[#231A15] transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#1D528F]" />
            <span>Partager</span>
          </button>
        </div>

        {/* Séparateur SMS serveur */}
        <div className="border-t border-[#E6DDD0] pt-3">
          {isAuthenticated ? (
            <div className="space-y-3">
              <button
                id="share-sms-toggle-btn"
                onClick={() => setShowSmsForm(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl
                  bg-[#2A6B44]/8 hover:bg-[#2A6B44]/15 border border-[#2A6B44]/25
                  text-xs font-bold text-[#1C4E30] transition cursor-pointer"
                aria-expanded={showSmsForm}
                aria-controls="sms-share-panel"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Envoyer par SMS
                </span>
                {showSmsForm
                  ? <ChevronUp className="w-3.5 h-3.5" />
                  : <ChevronDown className="w-3.5 h-3.5" />
                }
              </button>

              {showSmsForm && (
                <div id="sms-share-panel">
                  <SmsShareForm addressCode={code} />
                </div>
              )}
            </div>
          ) : (
            /* Utilisateur non connecté : lien SMS natif avec explication */
            <a
              href={smsUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                bg-[#F2ECE1] hover:bg-[#E6DDD0] border border-[#D4CEBF]
                text-xs font-bold text-[#231A15] transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#2A6B44]" />
              <span>Envoyer par SMS (app téléphone)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

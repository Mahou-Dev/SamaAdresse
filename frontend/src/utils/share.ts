/**
 * Utilitaires de partage d'adresse SamaAdresse.
 * Aucune dépendance externe : vanilla TypeScript.
 */

/** Construit l'URL publique de la fiche adresse. */
export function buildPublicUrl(code: string): string {
  const configuredBase = import.meta.env.VITE_FRONTEND_BASE_URL;
  if (configuredBase && typeof configuredBase === 'string' && configuredBase.trim().length > 0) {
    return `${configuredBase.trim().replace(/\/+$/, '')}/a/${code}`;
  }
  const base =
    typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : 'http://localhost:5173';
  return `${base}/a/${code}`;
}

/** Construit le texte du SMS / WhatsApp / partage natif. */
export function buildShareText(code: string): string {
  const url = buildPublicUrl(code);
  return `SamaAdresse : adresse ${code}. Voir la fiche et l'itinéraire : ${url}`;
}

/** Construit le lien SMS natif (iOS / Android). Compatibilité : sms:?&body= */
export function buildSmsSchemeUrl(text: string): string {
  return `sms:?&body=${encodeURIComponent(text)}`;
}

/** Construit le lien WhatsApp. */
export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Valide un numéro mobile sénégalais.
 * Accepte : +221(70|75|76|77|78)XXXXXXX (mobile uniquement — pas le 33 fixe).
 */
export function isValidSenegalMobile(phone: string): boolean {
  return /^\+221(70|75|76|77|78)[0-9]{7}$/.test(phone.trim());
}

/**
 * Copie du texte dans le presse-papiers.
 * Utilise l'API moderne Clipboard si disponible (contexte sécurisé HTTPS/localhost),
 * sinon repli sur document.execCommand (compatibilité anciens navigateurs / HTTP).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Repli vers execCommand si refus ou restriction
    }
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}

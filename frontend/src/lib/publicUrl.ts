/**
 * Adresse publique du site, utilisée dans le lien de partage et le QR code.
 *
 * Par défaut, c'est l'origine de la page (en production : le vrai nom de domaine). En développement,
 * VITE_PUBLIC_APP_URL permet d'indiquer une adresse joignable depuis un téléphone
 * (ex. http://192.168.1.20:5173) : « localhost » désigne toujours l'appareil qui ouvre le lien.
 */
export function publicAppBaseUrl() {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  return (configured || window.location.origin).replace(/\/+$/, '')
}

/** URL publique stable d'une adresse : c'est elle (et rien d'autre) que contient le QR code. */
export function publicAddressUrl(code: string) {
  return `${publicAppBaseUrl()}/a/${encodeURIComponent(code)}`
}

/** Vrai si le lien ne peut s'ouvrir que sur l'ordinateur qui l'a produit (localhost, 127.x, ::1). */
export function isLocalOnlyUrl(url: string) {
  try {
    const host = new URL(url).hostname
    return host === 'localhost' || host.endsWith('.localhost') || host.startsWith('127.') || host === '[::1]'
  } catch {
    return false
  }
}

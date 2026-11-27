/**
 * Règles métier du code public, alignées sur le backend (AddressCode, AddressCodeGenerator).
 * Le serveur reste l'autorité : ces fonctions servent au retour immédiat dans l'interface.
 */

/** Format accepté par GET /api/v1/addresses/{code}, après passage en majuscules. */
export const CODE_FORMAT = /^[A-Z0-9]{2,6}(?:-[A-Z0-9]{2,6})?-[0-9]{4,8}$/

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase()
}

export function isValidCode(raw: string) {
  return CODE_FORMAT.test(normalizeCode(raw))
}

/** Segment VIL ou QUA : 3 premiers caractères alphanumériques sans accents, « SN » si moins de 2. */
export function codeSegment(value: string) {
  const ascii = value.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return ascii.length < 2 ? 'SN' : ascii.slice(0, 3)
}

/** Préfixe du code : ville puis quartier (la suite dépend de la case de la grille, voir gridCell). */
export function codePrefix(city: string, district: string) {
  return `${codeSegment(city)}-${codeSegment(district)}`
}

/**
 * Numéro de case de la grille SamaAdresse (identique au serveur, AddressCodeGenerator) :
 * cases de 0,001° (≈ 110 m), blocs de 100 × 100 cases ; NNNN = ligne × 100 + colonne.
 * Les coordonnées sont d'abord arrondies à 6 décimales, comme sur le serveur.
 */
export function gridCell(latitude: number, longitude: number) {
  const index = (degrees: number) => {
    // Arrondi « demi vers l'extérieur » comme RoundingMode.HALF_UP de Java (y compris pour les négatifs).
    const micro = Math.sign(degrees) * Math.round(Math.abs(degrees) * 1_000_000)
    return Math.floor(micro / 1000)
  }
  const mod = (n: number) => ((n % 100) + 100) % 100
  return `${String(mod(index(latitude))).padStart(2, '0')}${String(mod(index(longitude))).padStart(2, '0')}`
}

/**
 * Code provisoire calculable hors connexion, en moins d'une seconde. Le serveur confirme le code
 * définitif : il ajoute un chiffre de départage si la case est déjà occupée (ex. ZIG-KAN-68261).
 */
export function provisionalCode(city: string, district: string, latitude: number, longitude: number) {
  return `${codePrefix(city, district)}-${gridCell(latitude, longitude)}`
}

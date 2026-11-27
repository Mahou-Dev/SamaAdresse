/**
 * Copie un texte dans le presse-papiers. L'API moderne n'existe que sur une page sécurisée
 * (https ou localhost) : sur http://192.168…, navigator.clipboard est absent. On se rabat alors
 * sur l'ancienne commande « copy » d'une zone de texte temporaire. Renvoie faux si rien n'a marché.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission refusée : on tente la méthode de secours.
    }
  }
  return legacyCopy(text)
}

function legacyCopy(text: string) {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}

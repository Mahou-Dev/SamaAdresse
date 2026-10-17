/**
 * Formate le sous-titre de la page /addresses/mine
 * Règle Lot 5 (0.3) : « N actives » et, s'il y en a, « · M archivée(s) ».
 * Jamais périmé après archivage/restauration.
 */
export function formatMyAddressesSubtitle(activeCount: number, archivedCount: number): string {
  const activePart = `${activeCount} active${activeCount > 1 ? 's' : ''}`;
  if (archivedCount > 0) {
    return `${activePart} · ${archivedCount} archivée${archivedCount > 1 ? 's' : ''}`;
  }
  return activePart;
}

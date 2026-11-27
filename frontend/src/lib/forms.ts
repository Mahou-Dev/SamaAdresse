/** Relie un champ à son message d'erreur ou, à défaut, à son aide (accessibilité). */
export function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`
  return hint ? `${id}-hint` : undefined
}

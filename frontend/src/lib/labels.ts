import type { AddressStatus, PlaceType, ReportReason } from './api'

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  MAISON: 'Maison',
  COMMERCE: 'Commerce',
  INSTITUTION: 'Institution',
}

export const STATUS_LABELS: Record<AddressStatus, string> = {
  ACTIVE: 'Active',
  SIGNALED: 'Signalée',
  SUSPENDED: 'Suspendue',
  ARCHIVED: 'Archivée',
}

export function visibilityLabel(address: { status: AddressStatus; listed: boolean; publiclyAccessible: boolean }) {
  if (address.status === 'ARCHIVED') return 'Archivée : fiche publique et QR code désactivés (restaurable)'
  if (address.status === 'SUSPENDED') return 'Suspendue par la modération : fiche publique inaccessible'
  if (address.listed) return 'Active · référencée dans l’annuaire public et accessible par son code'
  return 'Active · accessible uniquement aux personnes ayant le code ou le QR code'
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts.slice(0, 2).map((p) => p[0]).join('') || '?').toUpperCase()
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(value))
}

export const REPORT_REASONS: Record<ReportReason, string> = {
  POSITION_INCORRECTE: 'Position GPS incorrecte',
  CONTENU_INAPPROPRIE: 'Contenu ou description inappropriée',
  PHOTO_INAPPROPRIEE: 'Photo de façade inappropriée',
  AUTRE: 'Autre problème',
}

import { ChevronRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { OwnerAddress } from '../lib/api'
import { PLACE_TYPE_ICONS } from '../lib/placeIcons'
import { PLACE_TYPE_LABELS } from '../lib/labels'
import { StatusBadge } from './StatusBadge'

/** Ligne d'adresse cliquable (tableau de bord, listes). */
export function AddressRow({ address, compact = false }: { address: OwnerAddress; compact?: boolean }) {
  const Icon = PLACE_TYPE_ICONS[address.placeType] ?? MapPin
  return (
    <Link className={compact ? 'address-row address-row--compact' : 'address-row'} to={`/mes-adresses/${address.id}`}>
      <span className={`address-row__thumb address-row__thumb--${address.placeType.toLowerCase()}`}><Icon aria-hidden="true" /></span>
      <span className="address-row__text">
        <strong>{address.publicCode}</strong>
        <span>{address.title}</span>
        <small>{PLACE_TYPE_LABELS[address.placeType]} · {address.district}, {address.city}</small>
      </span>
      {!compact && <StatusBadge status={address.status} />}
      <ChevronRight className="address-row__chevron" aria-hidden="true" />
    </Link>
  )
}

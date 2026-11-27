import type { AddressStatus } from '../lib/api'
import { STATUS_LABELS } from '../lib/labels'

export function StatusBadge({ status }: { status: AddressStatus }) {
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{STATUS_LABELS[status]}</span>
}

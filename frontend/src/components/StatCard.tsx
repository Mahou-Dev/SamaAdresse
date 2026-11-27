import type { LucideIcon } from 'lucide-react'

export function StatCard({ icon: Icon, value, label, tone }: {
  icon: LucideIcon
  value: number | string
  label: string
  tone: 'blue' | 'teal' | 'green' | 'amber' | 'red'
}) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__icon"><Icon aria-hidden="true" /></span>
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </div>
  )
}

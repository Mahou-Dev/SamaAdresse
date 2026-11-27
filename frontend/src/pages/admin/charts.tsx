import type { PlaceType } from '../../lib/api'
import { PLACE_TYPE_LABELS } from '../../lib/labels'
import type { MonthlyBucket } from './adminData'

const TYPE_COLORS: Record<PlaceType, string> = {
  MAISON: '#1a7cff',
  COMMERCE: '#f2a33a',
  INSTITUTION: '#10c4d9',
}
const TYPES: PlaceType[] = ['MAISON', 'COMMERCE', 'INSTITUTION']

/** Répartition par type de lieu (anneau SVG). */
export function TypeDonut({ byType }: { byType: Record<PlaceType, number> }) {
  const types = TYPES.map((type) => ({ type, count: byType[type] ?? 0 }))
  const total = types.reduce((sum, t) => sum + t.count, 0)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  let offset = 0
  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" role="img" aria-label={`Répartition de ${total} adresses par type`}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#1f3b61" strokeWidth="18" />
        {total > 0 && types.filter((t) => t.count > 0).map(({ type, count }) => {
          const length = (count / total) * circumference
          const segment = (
            <circle key={type} cx="70" cy="70" r={radius} fill="none" stroke={TYPE_COLORS[type]} strokeWidth="18"
              strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
          )
          offset += length
          return segment
        })}
        <text x="70" y="76" textAnchor="middle" className="donut__total">{total}</text>
      </svg>
      <ul className="donut__legend">
        {types.map(({ type, count }) => (
          <li key={type}>
            <span style={{ background: TYPE_COLORS[type] }} />{PLACE_TYPE_LABELS[type]}
            <strong>{total ? Math.round((count / total) * 100) : 0} %</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

const W = 640
const H = 220
const PAD = { top: 12, right: 12, bottom: 28, left: 34 }

/** Adresses publiques créées par mois sur les douze derniers mois. SVG pur. */
export function EvolutionChart({ monthly }: { monthly: MonthlyBucket[] }) {
  const months = monthly.map((m) => new Date(Number(m.month.slice(0, 4)), Number(m.month.slice(5, 7)) - 1, 1))
  const totals = monthly.map((m) => m.total)
  const byType = TYPES.map((type) => ({ type, counts: monthly.map((m) => m.byType[type] ?? 0) }))
  const max = Math.max(1, ...totals)
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]
  const x = (i: number) => PAD.left + (i * (W - PAD.left - PAD.right)) / Math.max(1, months.length - 1)
  const y = (v: number) => H - PAD.bottom - (v / top) * (H - PAD.top - PAD.bottom)
  const line = (values: number[]) => values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line(totals)} L${x(months.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const fmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

  return (
    <figure className="evolution">
      <ul className="evolution__legend">
        <li><span style={{ background: '#4b9bff' }} />Toutes</li>
        {TYPES.map((t) => <li key={t}><span style={{ background: TYPE_COLORS[t] }} />{PLACE_TYPE_LABELS[t]}</li>)}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Adresses créées par mois : ${months.map((m, i) => `${fmt.format(m)} ${totals[i]}`).join(', ')}`}>
        <defs>
          <linearGradient id="evo-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a7cff" stopOpacity=".45" />
            <stop offset="1" stopColor="#10c4d9" stopOpacity=".03" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="evolution__grid" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="evolution__axis">{t}</text>
          </g>
        ))}
        <path d={area} fill="url(#evo-fill)" />
        {byType.map(({ type, counts }) => counts.some(Boolean) && (
          <path key={type} d={line(counts)} fill="none" stroke={TYPE_COLORS[type]} strokeWidth="1.6" strokeOpacity=".85" />
        ))}
        <path d={line(totals)} fill="none" stroke="#4b9bff" strokeWidth="2.4" />
        {totals.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={v ? 3 : 0} fill="#4b9bff" />)}
        {months.map((m, i) => (
          <text key={m.toISOString()} x={x(i)} y={H - 8} textAnchor="middle" className="evolution__axis">{fmt.format(m).replace('.', '')}</text>
        ))}
      </svg>
    </figure>
  )
}

function niceTicks(max: number) {
  const step = max <= 4 ? 1 : max <= 10 ? 2 : Math.pow(10, Math.floor(Math.log10(max))) * (max / Math.pow(10, Math.floor(Math.log10(max))) > 5 ? 2 : 1)
  const top = Math.ceil(max / step) * step
  return Array.from({ length: top / step + 1 }, (_, i) => i * step)
}

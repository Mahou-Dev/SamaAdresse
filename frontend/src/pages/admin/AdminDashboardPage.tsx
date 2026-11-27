import { ArrowRight, CheckCircle2, Flag, Globe, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../components/StatusBadge'
import { useApiResource } from '../../hooks/useApiResource'
import { listReports, searchDirectory } from '../../lib/api'
import { collectPages } from '../../lib/collect'
import { formatShortDate, PLACE_TYPE_LABELS, REPORT_REASONS } from '../../lib/labels'
import { AdminOnly } from './AdminOnly'
import { buildMonthlyBuckets, buildTypeCounts } from './adminData'
import { EvolutionChart, TypeDonut } from './charts'

export function AdminDashboardPage() {
  return <AdminOnly><Dashboard /></AdminOnly>
}

async function loadDashboard(token: string) {
  const [openReports, resolvedReports, dismissedReports, directory] = await Promise.all([
    listReports(token, 'OPEN', 0, 10),
    listReports(token, 'RESOLVED', 0, 1),
    listReports(token, 'DISMISSED', 0, 1),
    collectPages((page) => searchDirectory({}, page, 50)),
  ])
  return { openReports, resolvedReports, dismissedReports, directory }
}

function Dashboard() {
  const { state } = useApiResource(loadDashboard, [])
  const today = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())

  return (
    <main className="admin-page">
      <header className="admin-page__head">
        <h1>Tableau de bord</h1>
        <span>{today}</span>
      </header>

      {state.kind === 'loading' && <p className="loading" role="status">Chargement des données…</p>}
      {state.kind === 'error' && <p className="alert alert--error" role="alert">{state.message}</p>}
      {state.kind === 'ready' && (() => {
        const { openReports, resolvedReports, dismissedReports, directory } = state.data
        const byType = buildTypeCounts(directory.items)
        const monthly = buildMonthlyBuckets(directory.items)
        const thisMonth = monthly[monthly.length - 1]?.total ?? 0
        const latest = [...directory.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
        return (
          <>
            <div className="kpi-grid">
              <Kpi icon={Globe} tone="green" label="Adresses dans l’annuaire" value={directory.total} trend={`+${thisMonth} ce mois`} />
              <Kpi icon={Flag} tone="red" label="Signalements à traiter" value={openReports.totalElements} trend={openReports.totalElements ? 'Modération requise' : 'Aucun'} />
              <Kpi icon={CheckCircle2} tone="blue" label="Signalements résolus" value={resolvedReports.totalElements} trend="Traités / adresses suspendues" />
              <Kpi icon={XCircle} tone="amber" label="Signalements écartés" value={dismissedReports.totalElements} trend="Adresses maintenues actives" />
            </div>
            {directory.truncated && <p className="alert alert--warning">Graphiques calculés sur les 500 adresses publiques les plus récentes.</p>}

            <div className="admin-grid admin-grid--3">
              <section className="admin-panel admin-panel--span2" aria-labelledby="evolution-title">
                <h2 id="evolution-title">Évolution des adresses publiques (12 mois)</h2>
                <EvolutionChart monthly={monthly} />
              </section>
              <section className="admin-panel" aria-labelledby="types-title">
                <h2 id="types-title">Types de lieux (annuaire)</h2>
                <TypeDonut byType={byType} />
              </section>

              <section className="admin-panel admin-panel--span2" aria-labelledby="latest-title">
                <div className="admin-panel__head">
                  <h2 id="latest-title">Dernières adresses publiques</h2>
                  <Link className="admin-link" to="/admin/adresses">Voir tout</Link>
                </div>
                {latest.length === 0 ? <p className="admin-empty">Aucune adresse référencée dans l’annuaire public.</p> : (
                  <div className="table-scroll">
                    <table className="admin-table admin-table--compact">
                      <thead><tr><th scope="col">Code</th><th scope="col">Lieu</th><th scope="col">Type</th><th scope="col">Quartier</th><th scope="col">Date</th><th scope="col">Statut</th></tr></thead>
                      <tbody>
                        {latest.map((a) => (
                          <tr key={a.publicCode}>
                            <td className="admin-table__code"><Link className="admin-link" to={`/a/${encodeURIComponent(a.publicCode)}`}>{a.publicCode}</Link></td>
                            <td className="admin-table__title" title={a.title}>{a.title}</td>
                            <td>{PLACE_TYPE_LABELS[a.placeType]}</td>
                            <td className="admin-table__title">{a.district}</td>
                            <td>{formatShortDate(a.createdAt)}</td>
                            <td><StatusBadge status="ACTIVE" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="admin-panel" aria-labelledby="reports-title">
                <div className="admin-panel__head">
                  <h2 id="reports-title">Signalements ouverts</h2>
                  <Link className="admin-link" to="/admin/signalements">Voir tout</Link>
                </div>
                {openReports.items.length === 0 ? <p className="admin-empty">Aucun signalement en attente.</p> : (
                  <ul className="queue-list">
                    {openReports.items.slice(0, 5).map((r) => (
                      <li key={r.id}>
                        <Link to="/admin/signalements" className="queue-list__item">
                          <span className="queue-list__icon queue-list__icon--red"><Flag aria-hidden="true" /></span>
                          <span className="queue-list__text">
                            <strong>{r.publicCode}</strong>
                            <small>{REPORT_REASONS[r.reason]}</small>
                            <small>{formatShortDate(r.createdAt)} · {r.district}</small>
                          </span>
                          <span className="queue-list__tag">Traiter <ArrowRight aria-hidden="true" /></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )
      })()}
    </main>
  )
}

function Kpi({ icon: Icon, tone, label, value, trend }: { icon: LucideIcon; tone: 'blue' | 'amber' | 'green' | 'red'; label: string; value: number; trend: string }) {
  return (
    <div className={`kpi kpi--${tone}`}>
      <span className="kpi__icon"><Icon aria-hidden="true" /></span>
      <span className="kpi__body">
        <small>{label}</small>
        <strong>{value.toLocaleString('fr-FR')}</strong>
        <em>{trend}</em>
      </span>
    </div>
  )
}

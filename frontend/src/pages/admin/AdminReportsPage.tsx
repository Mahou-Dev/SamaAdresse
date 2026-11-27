import { CheckCircle2, CircleCheck, ClipboardList, Flag, RotateCcw, ShieldBan } from 'lucide-react'
import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import { StatusBadge } from '../../components/StatusBadge'
import { useApiResource } from '../../hooks/useApiResource'
import {
  ApiError, listAdminActions, listReports, reinstateAdminAddress, suspendAdminAddress, updateReportStatus,
  type AdminReport, type ReportStatus,
} from '../../lib/api'
import { errorMessage } from '../../lib/errors'
import { formatDate, REPORT_REASONS } from '../../lib/labels'
import { AdminOnly } from './AdminOnly'
import type { AdminOutletContext } from './adminData'

type ViewTab = ReportStatus | 'AUDIT'

const TABS: Array<{ id: ViewTab; label: string }> = [
  { id: 'OPEN', label: 'À traiter' },
  { id: 'RESOLVED', label: 'Résolus' },
  { id: 'DISMISSED', label: 'Écartés' },
  { id: 'AUDIT', label: 'Journal d’audit' },
]

const ACTION_LABELS: Record<string, string> = {
  SUSPEND: 'Suspension d’adresse',
  REINSTATE: 'Réactivation d’adresse',
  RESOLVE_REPORT: 'Signalement résolu',
  DISMISS_REPORT: 'Signalement écarté',
}

type ActionMode =
  | { id: string; kind: 'dismiss' | 'resolve' | 'suspend' | 'reinstate' }
  | null

export function AdminReportsPage() {
  return <AdminOnly><Reports /></AdminOnly>
}

/**
 * Modération des signalements & journal d'audit immuable (AdminModerationController) :
 * - PATCH /api/admin/reports/{id} (RESOLVED / DISMISSED)
 * - POST /api/admin/addresses/{id}/suspend (motif obligatoire, résout automatiquement les signalements ouverts)
 * - POST /api/admin/addresses/{id}/reinstate (réactive une adresse suspendue)
 * - GET /api/admin/actions (journal d'audit immuable admin_actions)
 */
function Reports() {
  const { token, logout, refresh } = useAuth()
  const outlet = useOutletContext<AdminOutletContext | undefined>()
  const [tab, setTab] = useState<ViewTab>('OPEN')
  const [page, setPage] = useState(0)
  const reportStatus: ReportStatus = tab === 'AUDIT' ? 'OPEN' : tab
  const { state, reload } = useApiResource((t) => listReports(t, reportStatus, page, 20), [reportStatus, page, tab])
  const auditResource = useApiResource(
    (t) => (tab === 'AUDIT' ? listAdminActions(t, page, 20) : Promise.resolve({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })),
    [tab, page],
  )
  const [confirming, setConfirming] = useState<ActionMode>(null)
  const [reasonInput, setReasonInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  async function executeAction(report: AdminReport, mode: NonNullable<ActionMode>) {
    if (!token) return
    if (mode.kind === 'suspend' && !reasonInput.trim()) {
      setMessage({ tone: 'error', text: 'Indiquez un motif de suspension obligatoire.' })
      return
    }
    setBusy(true)
    setMessage(null)

    const runWithToken = async (activeToken: string) => {
      if (mode.kind === 'dismiss') {
        await updateReportStatus(activeToken, report.id, 'DISMISSED', reasonInput.trim() || undefined)
        return `Signalement sur ${report.publicCode} écarté : l’adresse reste active.`
      }
      if (mode.kind === 'resolve') {
        await updateReportStatus(activeToken, report.id, 'RESOLVED', reasonInput.trim() || undefined)
        return `Signalement sur ${report.publicCode} marqué comme résolu.`
      }
      if (mode.kind === 'suspend') {
        await suspendAdminAddress(activeToken, report.addressId, reasonInput.trim())
        return `${report.publicCode} suspendue : fiche publique désactivée (410 Gone) et signalements ouverts résolus.`
      }
      await reinstateAdminAddress(activeToken, report.addressId, reasonInput.trim() || undefined)
      return `${report.publicCode} réactivée avec succès.`
    }

    try {
      const successMsg = await runWithToken(token)
      setMessage({ tone: 'success', text: successMsg })
      setConfirming(null)
      setReasonInput('')
      reload()
      outlet?.refreshPending()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const fresh = await refresh()
        if (fresh) {
          try {
            const successMsg = await runWithToken(fresh)
            setMessage({ tone: 'success', text: successMsg })
            setConfirming(null)
            setReasonInput('')
            reload()
            outlet?.refreshPending()
            return
          } catch (retryErr) {
            if (retryErr instanceof ApiError && retryErr.status === 401) { void logout(); return }
            setMessage({ tone: 'error', text: errorMessage(retryErr) })
            return
          }
        }
        void logout()
        return
      }
      setMessage({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-page__head"><h1>Signalements & Modération</h1><span>Adresses signalées par les utilisateurs</span></header>
      <div className="admin-toolbar">
        <div className="admin-tabs" role="group" aria-label="Statut des signalements et journal">
          {TABS.map((t) => (
            <button key={t.id} type="button" aria-pressed={tab === t.id}
              onClick={() => { setTab(t.id); setPage(0); setMessage(null); setConfirming(null) }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {message && <p className={`alert alert--${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</p>}

      {tab === 'AUDIT' ? (
        <section className="admin-panel" aria-label="Journal d’audit immuable">
          {auditResource.state.kind === 'loading' && <p className="loading" role="status">Chargement du journal d’audit…</p>}
          {auditResource.state.kind === 'error' && <p className="alert alert--error" role="alert">{auditResource.state.message}</p>}
          {auditResource.state.kind === 'ready' && auditResource.state.data.items.length === 0 && (
            <div className="state"><ClipboardList aria-hidden="true" /><h2>Aucune action enregistrée</h2><p>Les décisions de modération apparaîtront ici de manière immuable.</p></div>
          )}
          {auditResource.state.kind === 'ready' && auditResource.state.data.items.length > 0 && (
            <>
              <p className="admin-muted admin-count">{auditResource.state.data.totalElements} action{auditResource.state.data.totalElements > 1 ? 's' : ''} tracée{auditResource.state.data.totalElements > 1 ? 's' : ''}</p>
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Action</th>
                      <th scope="col">Adresse</th>
                      <th scope="col">Administrateur</th>
                      <th scope="col">Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditResource.state.data.items.map((a) => (
                      <tr key={a.id}>
                        <td>{formatDate(a.createdAt)}</td>
                        <td><span className="audit-action-badge">{ACTION_LABELS[a.action] ?? a.action}</span></td>
                        <td className="admin-table__code">{a.addressCode}</td>
                        <td>{a.adminEmail}</td>
                        <td>{a.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {auditResource.state.data.totalPages > 1 && (
                <nav className="pager pager--dark" aria-label="Pagination du journal d’audit">
                  <button className="button button-ghost-dark button-sm" type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button>
                  <span>Page {page + 1} sur {auditResource.state.data.totalPages}</span>
                  <button className="button button-ghost-dark button-sm" type="button" disabled={page + 1 >= auditResource.state.data.totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
                </nav>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          {state.kind === 'loading' && <p className="loading" role="status">Chargement…</p>}
          {state.kind === 'error' && <p className="alert alert--error" role="alert">{state.message}</p>}
          {state.kind === 'ready' && state.data.items.length === 0 && (
            <section className="admin-panel state"><CircleCheck aria-hidden="true" className="state__ok" /><h2>Aucun signalement</h2><p>Rien à afficher pour ce statut.</p></section>
          )}
          {state.kind === 'ready' && state.data.items.length > 0 && (
            <ul className="report-cards">
              {state.data.items.map((r) => (
                <li key={r.id} className="admin-panel report-card">
                  <div className="report-card__head">
                    <span className="queue-list__icon queue-list__icon--red"><Flag aria-hidden="true" /></span>
                    <div>
                      <h2>{REPORT_REASONS[r.reason]} — <span className="admin-table__code">{r.publicCode}</span></h2>
                      <p className="admin-muted">{r.addressTitle} · {r.district}, {r.city} · signalé le {formatDate(r.createdAt)}</p>
                    </div>
                    <StatusBadge status={r.addressStatus} />
                  </div>
                  {r.comment && <blockquote className="report-card__comment">« {r.comment} »</blockquote>}

                  <div className="moderation__actions">
                    {r.addressStatus === 'ACTIVE' && <Link className="admin-link" to={`/a/${encodeURIComponent(r.publicCode)}`}>Voir la fiche publique</Link>}
                    {confirming?.id === r.id ? (
                      <div className="stack-form stack-form--full">
                        <label htmlFor={`reason-${r.id}`} className="admin-muted">
                          {confirming.kind === 'suspend'
                            ? 'Motif de suspension (obligatoire, tracé dans admin_actions)'
                            : 'Commentaire de modération (facultatif)'}
                        </label>
                        <input
                          id={`reason-${r.id}`}
                          className="input"
                          value={reasonInput}
                          maxLength={500}
                          placeholder={confirming.kind === 'suspend' ? 'Ex. Coordonnées erronées confirmées' : 'Note interne (facultative)'}
                          onChange={(e) => setReasonInput(e.target.value)}
                        />
                        <div className="manage__actions">
                          <button
                            className={confirming.kind === 'suspend' ? 'button button-danger' : 'button button-success'}
                            type="button"
                            disabled={busy}
                            onClick={() => void executeAction(r, confirming)}
                          >
                            {busy ? 'Enregistrement…' : confirming.kind === 'suspend'
                              ? 'Confirmer la suspension'
                              : confirming.kind === 'reinstate'
                                ? 'Confirmer la réactivation'
                                : confirming.kind === 'resolve'
                                  ? 'Confirmer : résolu'
                                  : 'Confirmer : écarter'}
                          </button>
                          <button className="button button-ghost-dark" type="button" disabled={busy}
                            onClick={() => { setConfirming(null); setReasonInput('') }}>Annuler</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {r.status === 'OPEN' && (
                          <>
                            <button className="button button-ghost-dark" type="button"
                              onClick={() => { setConfirming({ id: r.id, kind: 'dismiss' }); setReasonInput('') }}
                              aria-label={`Écarter le signalement sur ${r.publicCode}`}>
                              <CircleCheck aria-hidden="true" />Écarter
                            </button>
                            <button className="button button-secondary" type="button"
                              onClick={() => { setConfirming({ id: r.id, kind: 'resolve' }); setReasonInput('') }}
                              aria-label={`Marquer résolu le signalement sur ${r.publicCode}`}>
                              <CheckCircle2 aria-hidden="true" />Résolu
                            </button>
                            {r.addressStatus !== 'SUSPENDED' && (
                              <button className="button button-danger" type="button"
                                onClick={() => { setConfirming({ id: r.id, kind: 'suspend' }); setReasonInput('') }}
                                aria-label={`Suspendre l’adresse ${r.publicCode}`}>
                                <ShieldBan aria-hidden="true" />Suspendre l’adresse
                              </button>
                            )}
                          </>
                        )}
                        {r.addressStatus === 'SUSPENDED' && (
                          <button className="button button-success" type="button"
                            onClick={() => { setConfirming({ id: r.id, kind: 'reinstate' }); setReasonInput('') }}
                            aria-label={`Réactiver l’adresse ${r.publicCode}`}>
                            <RotateCcw aria-hidden="true" />Réactiver l’adresse
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {state.kind === 'ready' && state.data.totalPages > 1 && (
            <nav className="pager pager--dark" aria-label="Pagination">
              <button className="button button-ghost-dark button-sm" type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button>
              <span>Page {page + 1} sur {state.data.totalPages}</span>
              <button className="button button-ghost-dark button-sm" type="button" disabled={page + 1 >= state.data.totalPages} onClick={() => setPage(page + 1)}>Suivant</button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}

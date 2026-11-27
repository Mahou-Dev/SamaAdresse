import { Eye, RotateCcw, Search, ShieldBan } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/authContext'
import { StatusBadge } from '../../components/StatusBadge'
import { useApiResource } from '../../hooks/useApiResource'
import {
  ApiError, listReports, reinstateAdminAddress, searchDirectory, suspendAdminAddress,
  type AddressStatus, type PlaceType,
} from '../../lib/api'
import { collectPages } from '../../lib/collect'
import { errorMessage } from '../../lib/errors'
import { formatShortDate, PLACE_TYPE_LABELS } from '../../lib/labels'
import { AdminOnly } from './AdminOnly'
import type { AdminOutletContext } from './adminData'

interface AdminAddressRow {
  key: string
  addressId: string | null
  publicCode: string
  title: string
  placeType: PlaceType
  district: string
  city: string
  createdAt: string
  status: AddressStatus
  source: 'directory' | 'report'
}

export function AdminAddressesPage() {
  return <AdminOnly><Addresses /></AdminOnly>
}

async function loadRegistry(token: string): Promise<AdminAddressRow[]> {
  const [dir, reports] = await Promise.all([
    collectPages((p) => searchDirectory({}, p, 50)),
    collectPages((p) => listReports(token, undefined, p, 50)),
  ])
  const byCode = new Map<string, AdminAddressRow>()
  for (const d of dir.items) {
    byCode.set(d.publicCode, {
      key: d.publicCode,
      addressId: null,
      publicCode: d.publicCode,
      title: d.title,
      placeType: d.placeType,
      district: d.district,
      city: d.city,
      createdAt: d.createdAt,
      status: 'ACTIVE',
      source: 'directory',
    })
  }
  // Enrichit ou ajoute les adresses présentes dans les signalements (avec leur UUID réel pour suspend/reinstate).
  for (const r of reports.items) {
    const existing = byCode.get(r.publicCode)
    byCode.set(r.publicCode, {
      key: r.addressId,
      addressId: r.addressId,
      publicCode: r.publicCode,
      title: existing?.title || r.addressTitle,
      placeType: r.locationType,
      district: r.district,
      city: r.city,
      createdAt: existing?.createdAt || r.createdAt,
      status: r.addressStatus,
      source: 'report',
    })
  }
  return Array.from(byCode.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function Addresses() {
  const { token, logout } = useAuth()
  const outlet = useOutletContext<AdminOutletContext | undefined>()
  const { state, reload } = useApiResource(loadRegistry, [])
  const [statusFilter, setStatusFilter] = useState<'ALL' | AddressStatus>('ALL')
  const [filter, setFilter] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const rows = useMemo(() => {
    if (state.kind !== 'ready') return []
    const q = filter.trim().toLowerCase()
    return state.data.filter((a) =>
      (statusFilter === 'ALL' || a.status === statusFilter)
      && (!q || [a.publicCode, a.title, a.district, a.city].some((v) => v.toLowerCase().includes(q))))
  }, [state, statusFilter, filter])

  async function toggleSuspension(row: AdminAddressRow) {
    if (!token || !row.addressId) return
    setBusyId(row.addressId)
    setMessage(null)
    try {
      if (row.status === 'SUSPENDED') {
        await reinstateAdminAddress(token, row.addressId, 'Réactivation depuis le registre administrateur')
        setMessage({ tone: 'success', text: `${row.publicCode} réactivée.` })
      } else {
        await suspendAdminAddress(token, row.addressId, 'Suspension par la modération administrateur')
        setMessage({ tone: 'success', text: `${row.publicCode} suspendue.` })
      }
      reload()
      outlet?.refreshPending()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) void logout()
      setMessage({ tone: 'error', text: errorMessage(error) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-page__head">
        <h1>Adresses</h1>
        <span>Annuaire public et adresses signalées / modérées</span>
      </header>
      <div className="admin-toolbar">
        <div className="admin-tabs" role="group" aria-label="Statut">
          {([
            ['ALL', 'Toutes'],
            ['ACTIVE', 'Actives'],
            ['SIGNALED', 'Signalées'],
            ['SUSPENDED', 'Suspendues'],
            ['ARCHIVED', 'Archivées'],
          ] as const).map(([s, label]) => (
            <button key={s} type="button" aria-pressed={s === statusFilter} onClick={() => setStatusFilter(s)}>{label}</button>
          ))}
        </div>
        <div className="admin-search">
          <Search aria-hidden="true" />
          <label className="visually-hidden" htmlFor="admin-filter">Filtrer les adresses</label>
          <input id="admin-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer : code, lieu, quartier…" />
        </div>
      </div>

      {message && <p className={`alert alert--${message.tone}`} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</p>}

      <section className="admin-panel" aria-label="Registre des adresses">
        {state.kind === 'loading' && <p className="loading" role="status">Chargement…</p>}
        {state.kind === 'error' && <p className="alert alert--error" role="alert">{state.message}</p>}
        {state.kind === 'ready' && (
          <>
            <p className="admin-muted admin-count">{rows.length} adresse{rows.length > 1 ? 's' : ''} affichée{rows.length > 1 ? 's' : ''}</p>
            {rows.length === 0 ? <p className="admin-empty">Aucune adresse ne correspond à ce filtre.</p> : (
              <div className="table-scroll">
                <table className="admin-table">
                  <thead><tr><th scope="col">Code</th><th scope="col">Lieu</th><th scope="col">Type</th><th scope="col">Quartier · Zone</th><th scope="col">Date</th><th scope="col">Statut</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
                  <tbody>
                    {rows.map((a) => (
                      <tr key={a.key}>
                        <td className="admin-table__code">{a.publicCode}</td>
                        <td>{a.title}</td>
                        <td>{PLACE_TYPE_LABELS[a.placeType]}</td>
                        <td>{a.district}, {a.city}</td>
                        <td>{formatShortDate(a.createdAt)}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td className="admin-table__actions">
                          {a.status === 'ACTIVE' && (
                            <Link className="button button-ghost-dark button-sm" to={`/a/${encodeURIComponent(a.publicCode)}`} aria-label={`Fiche publique de ${a.publicCode}`}>
                              <Eye aria-hidden="true" />Fiche
                            </Link>
                          )}
                          {a.addressId && (
                            <button
                              className={a.status === 'SUSPENDED' ? 'button button-success button-sm' : 'button button-danger button-sm'}
                              type="button"
                              disabled={busyId === a.addressId}
                              onClick={() => void toggleSuspension(a)}
                            >
                              {a.status === 'SUSPENDED' ? <><RotateCcw aria-hidden="true" />Réactiver</> : <><ShieldBan aria-hidden="true" />Suspendre</>}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

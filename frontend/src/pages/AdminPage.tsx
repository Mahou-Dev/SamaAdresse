import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminReports,
  suspendAddressAdmin,
  reinstateAddressAdmin,
  updateReportStatusAdmin,
} from '../api/addressApi';
import type { AdminReportResponse, ReportStatus, ReportReason } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import { AddressPlate } from '../components/AddressPlate';
import { useToast } from '../components/Toast';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { useAuth } from '../context/AuthContext';
import { ConnectedLayout } from '../components/ConnectedLayout';
import {
  Card,
  StatTile,
  StatusBadge,
  Tabs,
  TabPanel,
  DataTable,
  SidePanel,
  EmptyState,
} from '../components/ui';
import { getLocationTypeLabel } from '../utils/locationTypes';
import {
  ShieldAlert,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  WifiOff,
  Search,
  FileText,
  History,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

const REASON_LABELS: Record<ReportReason, string> = {
  POSITION_INCORRECTE: 'Position GPS incorrecte',
  CONTENU_INAPPROPRIE: 'Description inappropriée',
  PHOTO_INAPPROPRIEE: 'Photo inappropriée',
  AUTRE: 'Autre motif',
};

export interface LocalAuditAction {
  id: string;
  actionType: 'SUSPEND' | 'REINSTATE' | 'RESOLVE' | 'DISMISS';
  actionLabel: string;
  addressCode: string;
  adminEmail: string;
  reason?: string;
  timestamp: string;
}

export const AdminPage: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'moderation' | 'audit'>('moderation');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('OPEN');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reports, setReports] = useState<AdminReportResponse[]>([]);
  const [totalReportsCount, setTotalReportsCount] = useState<number>(0);
  const [openCount, setOpenCount] = useState<number>(0);
  const [resolvedCount, setResolvedCount] = useState<number>(0);
  const [dismissedCount, setDismissedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Panneau latéral et sélection
  const [selectedReport, setSelectedReport] = useState<AdminReportResponse | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);

  // Modales d'actions
  const [showSuspendModal, setShowSuspendModal] = useState<boolean>(false);
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [showReinstateModal, setShowReinstateModal] = useState<boolean>(false);
  const [reinstateReason, setReinstateReason] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);

  // Tri de la table
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Journal d'audit de session
  const [sessionAuditLogs, setSessionAuditLogs] = useState<LocalAuditAction[]>([]);
  const [auditFilterType, setAuditFilterType] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  const fetchReports = async (filter: ReportStatus | 'ALL') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Charger la page de signalements selon le filtre
      const page = await getAdminReports(filter === 'ALL' ? undefined : filter, 0, 50);
      setReports(page.content);
      setTotalReportsCount(page.totalElements);

      // Calculer également les compteurs pour les 3 statuts
      const [openPage, resolvedPage, dismissedPage] = await Promise.all([
        getAdminReports('OPEN', 0, 1),
        getAdminReports('RESOLVED', 0, 1),
        getAdminReports('DISMISSED', 0, 1),
      ]);
      setOpenCount(openPage.totalElements);
      setResolvedCount(resolvedPage.totalElements);
      setDismissedCount(dismissedPage.totalElements);

      if (selectedReport) {
        const refreshed = page.content.find((r) => r.id === selectedReport.id);
        if (refreshed) setSelectedReport(refreshed);
      }
    } catch (err: any) {
      setErrorMsg(err instanceof ApiError ? err.message : 'Impossible de charger les signalements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(statusFilter);
  }, [statusFilter]);

  const addAuditLog = (
    type: 'SUSPEND' | 'REINSTATE' | 'RESOLVE' | 'DISMISS',
    label: string,
    code: string,
    reason?: string
  ) => {
    const entry: LocalAuditAction = {
      id: String(Date.now()),
      actionType: type,
      actionLabel: label,
      addressCode: code,
      adminEmail: user?.email || 'admin@samaadresse.sn',
      reason,
      timestamp: new Date().toISOString(),
    };
    setSessionAuditLogs((prev) => [entry, ...prev]);
  };

  const handleOpenDetail = (report: AdminReportResponse) => {
    setSelectedReport(report);
    setIsSidePanelOpen(true);
    setSuspendReason('');
    setSuspendError(null);
  };

  const handleCloseDetail = () => {
    setIsSidePanelOpen(false);
  };

  const handleConfirmSuspend = async () => {
    if (!selectedReport) return;
    if (!suspendReason.trim()) {
      setSuspendError('Le motif de suspension est obligatoire.');
      return;
    }

    setProcessing(true);
    setSuspendError(null);
    try {
      await suspendAddressAdmin(selectedReport.addressId, suspendReason.trim());
      addAuditLog('SUSPEND', "Suspension d'adresse", selectedReport.addressCode, suspendReason.trim());
      showToast(`Adresse ${selectedReport.addressCode} suspendue.`, 'success');
      setShowSuspendModal(false);
      setSuspendReason('');
      await fetchReports(statusFilter);
    } catch (err: any) {
      setSuspendError(
        err instanceof ApiError ? err.message : "Impossible de suspendre l'adresse."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReinstate = async () => {
    if (!selectedReport) return;
    setProcessing(true);
    try {
      await reinstateAddressAdmin(selectedReport.addressId, reinstateReason.trim());
      addAuditLog(
        'REINSTATE',
        "Rétablissement d'adresse",
        selectedReport.addressCode,
        reinstateReason.trim() || undefined
      );
      showToast(`Adresse ${selectedReport.addressCode} rétablie avec succès.`, 'success');
      setShowReinstateModal(false);
      setReinstateReason('');
      await fetchReports(statusFilter);
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : "Impossible de rétablir l'adresse.", 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDismissReport = async (report: AdminReportResponse) => {
    setProcessing(true);
    try {
      await updateReportStatusAdmin(report.id, 'DISMISSED');
      addAuditLog('DISMISS', 'Signalement classé sans suite', report.addressCode);
      showToast('Signalement classé sans suite.', 'info');
      await fetchReports(statusFilter);
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : 'Impossible de mettre à jour ce signalement.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleResolveReport = async (report: AdminReportResponse) => {
    setProcessing(true);
    try {
      await updateReportStatusAdmin(report.id, 'RESOLVED');
      addAuditLog('RESOLVE', 'Signalement marqué traité', report.addressCode);
      showToast('Signalement marqué comme traité.', 'success');
      await fetchReports(statusFilter);
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : 'Impossible de mettre à jour ce signalement.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Filtrage et tri de la file de modération
  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.addressCode.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortKey === 'createdAt') {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? tA - tB : tB - tA;
      }
      if (sortKey === 'addressCode') {
        return sortDirection === 'asc'
          ? a.addressCode.localeCompare(b.addressCode)
          : b.addressCode.localeCompare(a.addressCode);
      }
      return 0;
    });

    return result;
  }, [reports, searchQuery, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Filtrage du journal d'audit
  const filteredAuditLogs = useMemo(() => {
    let list = [...sessionAuditLogs];

    if (auditFilterType !== 'ALL') {
      list = list.filter((l) => l.actionType === auditFilterType);
    }

    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.addressCode.toLowerCase().includes(q) ||
          l.actionLabel.toLowerCase().includes(q) ||
          l.reason?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [sessionAuditLogs, auditFilterType, auditSearchQuery]);

  if (!isOnline) {
    return (
      <ConnectedLayout
        title="Administration & Modération"
        subtitle="Connexion Internet requise pour accéder aux signalements."
      >
        <div className="p-8 text-center rounded-xl bg-[#FBF7EF] border border-[#766B5B] shadow-sm space-y-3 max-w-md mx-auto">
          <WifiOff className="w-8 h-8 text-[#8A3112] mx-auto" />
          <h2 className="text-base font-bold text-[#231A15]">Mode hors ligne actif</h2>
          <p className="text-xs text-[#5C4D44] leading-relaxed">
            La modération et la consultation des signalements nécessitent une connexion réseau active.
          </p>
        </div>
      </ConnectedLayout>
    );
  }

  return (
    <ConnectedLayout
      title="Administration & Modération des signalements"
      subtitle="Examen des signalements publics, modération des adresses et journal des actions."
    >
      {/* =========================================================================
       * 1. Indicateurs Réels (4 Tuiles métriques issues de l'API)
       * ========================================================================= */}
      <section aria-label="Indicateurs de modération">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile
            label="Signalements ouverts"
            value={openCount}
            sublabel={openCount === 0 ? 'Aucun en attente' : 'Action requise'}
            icon={ShieldAlert}
            onClick={() => setStatusFilter('OPEN')}
            variant={openCount > 0 ? 'alert' : 'neutral'}
            dataTestId="admin-stat-open"
          />
          <StatTile
            label="Traités"
            value={resolvedCount}
            sublabel="Signalements résolus"
            icon={CheckCircle2}
            onClick={() => setStatusFilter('RESOLVED')}
            variant="success"
            dataTestId="admin-stat-resolved"
          />
          <StatTile
            label="Classés sans suite"
            value={dismissedCount}
            sublabel="Signalements rejetés"
            icon={XCircle}
            onClick={() => setStatusFilter('DISMISSED')}
            variant="neutral"
            dataTestId="admin-stat-dismissed"
          />
          <StatTile
            label="Total des signalements"
            value={openCount + resolvedCount + dismissedCount}
            sublabel="Tous statuts confondus"
            icon={FileText}
            onClick={() => setStatusFilter('ALL')}
            variant="default"
            dataTestId="admin-stat-total"
          />
        </div>
      </section>

      {/* =========================================================================
       * 2. Onglets Modération & Journal d'Audit
       * ========================================================================= */}
      <Tabs
        tabs={[
          { id: 'moderation', label: 'File de modération', icon: ShieldAlert, count: openCount },
          { id: 'audit', label: "Journal d'audit de session", icon: History, count: sessionAuditLogs.length },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as any)}
        ariaLabel="Sections d'administration"
      />

      {/* =========================================================================
       * TAB 1 : File de Modération
       * ========================================================================= */}
      <TabPanel id="moderation" activeTab={activeTab}>
        <div className="space-y-4">
          {/* Barre de filtres et recherche */}
          <Card padding="sm" className="space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Filtres par état WAI-ARIA */}
              <div
                role="tablist"
                aria-label="Filtrer les signalements par état"
                className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F2ECE1] border border-[#766B5B]"
              >
                {[
                  { id: 'OPEN', label: 'Ouverts', count: openCount },
                  { id: 'RESOLVED', label: 'Traités', count: resolvedCount },
                  { id: 'DISMISSED', label: 'Classés sans suite', count: dismissedCount },
                  { id: 'ALL', label: 'Tous', count: totalReportsCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === tab.id}
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-[#12304F] text-[#FBF7EF] shadow-sm'
                        : 'text-[#5C4D44] hover:text-[#231A15]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-xs font-semibold ${statusFilter === tab.id ? 'text-[#FBF7EF]' : 'text-[#5C4D44]'}`}>({tab.count})</span>
                  </button>
                ))}
              </div>

              {/* Recherche par code */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C4D44]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrer par code (ex: ZIG-KBG)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15] placeholder-[#5C4D44] focus:outline-none focus:border-[#12304F]"
                />
              </div>
            </div>
          </Card>

          {/* Tableau DataTable / Cartes mobiles */}
          {loading ? (
            <div className="p-10 text-center rounded-xl bg-[#FBF7EF] border border-[#766B5B] space-y-3 min-h-[460px] flex flex-col items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#12304F] mx-auto" />
              <p className="text-xs text-[#5C4D44]">Chargement de la file de modération...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 rounded-xl bg-[#FBF7EF] border border-[#8A3112]/40 text-[#8A3112] text-xs sm:text-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchReports(statusFilter)}
                className="px-3 py-1.5 rounded-lg bg-[#8A3112] text-[#FBF7EF] text-xs font-bold hover:bg-[#9A3816] transition cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          ) : filteredReports.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Aucun signalement correspondant"
              description="La file de modération ne contient aucun élément pour ce filtre."
            />
          ) : (
            <DataTable<AdminReportResponse>
              data={filteredReports}
              keyExtractor={(r) => r.id}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              onRowClick={handleOpenDetail}
              selectedId={selectedReport?.id}
              columns={[
                {
                  key: 'addressCode',
                  header: 'Code adresse',
                  sortable: true,
                  render: (r) => (
                    <span className="font-mono font-bold text-[#12304F] hover:underline">
                      {r.addressCode}
                    </span>
                  ),
                },
                {
                  key: 'reason',
                  header: 'Motif du signalement',
                  render: (r) => (
                    <div>
                      <span className="font-semibold text-[#231A15] block">
                        {REASON_LABELS[r.reason] || r.reason}
                      </span>
                      {r.comment && (
                        <span className="text-[11px] text-[#5C4D44] line-clamp-1">
                          « {r.comment} »
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'addressStatus',
                  header: 'Statut adresse',
                  render: (r) => <StatusBadge status={r.addressStatus} size="sm" />,
                },
                {
                  key: 'status',
                  header: 'Statut signalement',
                  render: (r) => <StatusBadge status={r.status} size="sm" />,
                },
                {
                  key: 'createdAt',
                  header: 'Date',
                  sortable: true,
                  render: (r) => (
                    <span className="font-mono text-[#5C4D44]">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Action',
                  className: 'text-right',
                  render: (r) => (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(r);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#12304F] font-bold text-xs cursor-pointer"
                    >
                      <span>Examiner</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ),
                },
              ]}
              renderMobileCard={(r) => (
                <div
                  onClick={() => handleOpenDetail(r)}
                  className="p-4 rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm space-y-2.5 cursor-pointer active:bg-[#F2ECE1]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-[#12304F]">
                      {r.addressCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5C4D44] font-medium">Motif :</span>
                      <span className="font-bold text-[#231A15]">
                        {REASON_LABELS[r.reason] || r.reason}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-[#5C4D44] italic bg-[#F2ECE1] p-2 rounded text-[11px]">
                        « {r.comment} »
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[#5C4D44]">Adresse :</span>
                      <StatusBadge status={r.addressStatus} size="sm" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#766B5B]/30 flex items-center justify-between text-xs font-mono text-[#5C4D44]">
                    <span>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span className="text-[#12304F] font-bold inline-flex items-center gap-0.5">
                      Examiner <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </TabPanel>

      {/* =========================================================================
       * TAB 2 : Journal d'Audit de Session
       * ========================================================================= */}
      <TabPanel id="audit" activeTab={activeTab}>
        <div className="space-y-4">
          <Card padding="sm" className="space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#5C4D44]">Type d'action :</span>
                <select
                  aria-label="Filtrer par type d'action"
                  value={auditFilterType}
                  onChange={(e) => setAuditFilterType(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15]"
                >
                  <option value="ALL">Toutes les actions</option>
                  <option value="SUSPEND">Suspensions</option>
                  <option value="REINSTATE">Rétablissements</option>
                  <option value="RESOLVE">Résolutions</option>
                  <option value="DISMISS">Classements sans suite</option>
                </select>
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C4D44]" />
                <input
                  type="search"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Rechercher par code ou motif..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15] placeholder-[#5C4D44] focus:outline-none focus:border-[#12304F]"
                />
              </div>
            </div>
          </Card>

          {/* Note informative de transparence sur l'audit backend */}
          <div className="p-3.5 rounded-lg bg-[#F2ECE1] border border-[#766B5B] flex items-start gap-2.5 text-xs text-[#5C4D44]">
            <Info className="w-4 h-4 text-[#12304F] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-[#231A15] block">
                Traçabilité des actions administratives
              </span>
              <p>
                Toutes vos actions de modération sont enregistrées et persistées côté serveur dans la table PostgreSQL <code className="font-mono bg-[#EADFC8] px-1 rounded">admin_actions</code>. Ce journal affiche les actions réalisées pendant votre session de travail actuelle. L'endpoint de consultation globale paginée de l'historique complet est reporté au Lot 11B.
              </p>
            </div>
          </div>

          {filteredAuditLogs.length === 0 ? (
            <EmptyState
              icon={History}
              title="Aucune action enregistrée dans cette session"
              description="Les suspensions d'adresses, réactivations et clôtures de signalements effectuées s'afficheront ici."
            />
          ) : (
            <DataTable<LocalAuditAction>
              data={filteredAuditLogs}
              keyExtractor={(l) => l.id}
              columns={[
                {
                  key: 'actionLabel',
                  header: 'Action',
                  render: (l) => (
                    <span className="font-semibold text-[#231A15]">{l.actionLabel}</span>
                  ),
                },
                {
                  key: 'addressCode',
                  header: 'Code adresse',
                  render: (l) => (
                    <span className="font-mono font-bold text-[#12304F]">{l.addressCode}</span>
                  ),
                },
                {
                  key: 'reason',
                  header: 'Motif renseigné',
                  render: (l) => (
                    <span className="text-[#5C4D44] line-clamp-1">{l.reason || '—'}</span>
                  ),
                },
                {
                  key: 'adminEmail',
                  header: 'Administrateur',
                  render: (l) => (
                    <span className="font-mono text-[11px] text-[#5C4D44]">{l.adminEmail}</span>
                  ),
                },
                {
                  key: 'timestamp',
                  header: 'Date & heure',
                  render: (l) => (
                    <span className="font-mono text-[11px] text-[#5C4D44]">
                      {new Date(l.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  ),
                },
              ]}
              renderMobileCard={(l) => (
                <div className="p-3.5 rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#231A15]">{l.actionLabel}</span>
                    <span className="font-mono font-bold text-[#12304F]">{l.addressCode}</span>
                  </div>
                  {l.reason && (
                    <p className="text-[#5C4D44] bg-[#F2ECE1] p-2 rounded text-[11px]">
                      Motif : {l.reason}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-[#5C4D44] pt-1">
                    <span>{l.adminEmail}</span>
                    <span className="font-mono">
                      {new Date(l.timestamp).toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </TabPanel>

      {/* =========================================================================
       * Tiroir Latéral SidePanel (Détail complet du signalement)
       * ========================================================================= */}
      <SidePanel
        isOpen={isSidePanelOpen && !!selectedReport}
        onClose={handleCloseDetail}
        title={`Signalement — ${selectedReport?.addressCode || ''}`}
        subtitle={`Reçu le ${
          selectedReport ? new Date(selectedReport.createdAt).toLocaleDateString('fr-FR') : ''
        }`}
        width="md"
        footer={
          selectedReport && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              {selectedReport.status === 'OPEN' && (
                <>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleDismissReport(selectedReport)}
                    className="px-3.5 py-2 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15] text-xs font-bold transition cursor-pointer touch-target"
                  >
                    Classer sans suite
                  </button>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleResolveReport(selectedReport)}
                    className="px-3.5 py-2 rounded-lg bg-[#2A6B44] hover:bg-[#1E5234] text-[#FBF7EF] text-xs font-bold transition shadow-sm cursor-pointer touch-target"
                  >
                    Marquer traité
                  </button>
                </>
              )}

              {selectedReport.addressStatus === 'ACTIVE' ? (
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setShowSuspendModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#8A3112] hover:bg-[#9A3816] text-[#FBF7EF] text-xs font-bold transition shadow-sm cursor-pointer touch-target"
                >
                  Suspendre l'adresse
                </button>
              ) : selectedReport.addressStatus === 'SUSPENDED' ? (
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => setShowReinstateModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-[#2A6B44] hover:bg-[#1E5234] text-[#FBF7EF] text-xs font-bold transition shadow-sm cursor-pointer touch-target"
                >
                  Rétablir l'adresse
                </button>
              ) : null}
            </div>
          )
        }
      >
        {selectedReport && (
          <div className="space-y-5 text-xs">
            {/* Statuts en en-tête */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-[#F2ECE1] border border-[#766B5B]">
              <span className="text-[#5C4D44] font-medium">Statut du signalement :</span>
              <StatusBadge status={selectedReport.status} size="sm" />
              <span className="text-[#766B5B]">•</span>
              <span className="text-[#5C4D44] font-medium">Adresse :</span>
              <StatusBadge status={selectedReport.addressStatus} size="sm" />
            </div>

            {/* Motif & Commentaire */}
            <div className="p-4 rounded-xl bg-[#F2ECE1] border border-[#766B5B] space-y-2">
              <span className="text-[11px] font-bold text-[#5C4D44] block">
                Motif déclaré par le visiteur :
              </span>
              <p className="text-sm font-bold text-[#231A15]">
                {REASON_LABELS[selectedReport.reason] || selectedReport.reason}
              </p>
              {selectedReport.comment ? (
                <div className="pt-2 border-t border-[#766B5B]/30">
                  <span className="text-[11px] font-semibold text-[#5C4D44] block mb-1">
                    Précisions apportées :
                  </span>
                  <p className="text-xs text-[#231A15] italic bg-[#FBF7EF] p-2.5 rounded-lg border border-[#766B5B]/40 leading-relaxed">
                    « {selectedReport.comment} »
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-[#5C4D44] italic">Aucun commentaire complémentaire.</p>
              )}
            </div>

            {/* Plaque d'adresse */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#5C4D44] block">
                Plaque de l'adresse :
              </span>
              <AddressPlate
                code={selectedReport.addressCode}
                zone={selectedReport.addressZone}
                type={selectedReport.addressLocationType}
                showCopy={false}
              />
            </div>

            {/* Fiche détaillée de l'adresse */}
            <div className="p-4 rounded-xl bg-[#F2ECE1] border border-[#766B5B] space-y-2.5">
              <span className="text-[11px] font-bold text-[#5C4D44] block">
                Données de l'adresse :
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#5C4D44] block text-[11px]">Quartier :</span>
                  <span className="font-bold text-[#231A15]">{selectedReport.addressQuartier}</span>
                </div>
                <div>
                  <span className="text-[#5C4D44] block text-[11px]">Type de lieu :</span>
                  <span className="font-bold text-[#231A15]">
                    {getLocationTypeLabel(selectedReport.addressLocationType)}
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-[#5C4D44] block text-[11px]">Description :</span>
                <p className="text-[#231A15] mt-0.5">
                  {selectedReport.addressDescription || 'Aucune description'}
                </p>
              </div>

              {selectedReport.addressPhotoUrl ? (
                <div className="pt-2 border-t border-[#766B5B]/30 space-y-1">
                  <span className="text-[11px] font-bold text-[#5C4D44] block">
                    Photo de façade :
                  </span>
                  <img
                    src={selectedReport.addressPhotoUrl}
                    alt={`Façade ${selectedReport.addressCode}`}
                    className="w-full h-48 object-cover rounded-lg border border-[#766B5B]"
                    loading="lazy"
                  />
                </div>
              ) : (
                <p className="text-[11px] text-[#5C4D44] italic pt-1">
                  Cette adresse ne possède aucune photo de façade.
                </p>
              )}

              <div className="pt-2 border-t border-[#766B5B]/30">
                <Link
                  to={`/a/${selectedReport.addressCode}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#12304F] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir la fiche publique dans un nouvel onglet</span>
                </Link>
              </div>
            </div>

            {/* Action de suspension avec motif obligatoire */}
            {selectedReport.addressStatus === 'ACTIVE' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleConfirmSuspend();
                }}
                className="p-4 rounded-xl bg-[#FBF7EF] border border-[#8A3112]/40 space-y-3"
              >
                <div className="flex items-center gap-2 text-[#8A3112]">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-xs">Modération de l'adresse</span>
                </div>
                <div className="space-y-1">
                  <label htmlFor="suspend-reason-input" className="block text-xs font-bold text-[#231A15]">
                    Motif de suspension (obligatoire pour suspendre)
                  </label>
                  <textarea
                    id="suspend-reason-input"
                    rows={2}
                    maxLength={300}
                    value={suspendReason}
                    onChange={(e) => {
                      setSuspendReason(e.target.value);
                      setSuspendError(null);
                    }}
                    placeholder="Indiquez la raison de la suspension..."
                    className="w-full px-3 py-2 rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-xs text-[#231A15] placeholder:text-[#5C4D44] focus:outline-none focus:border-[#12304F]"
                  />
                </div>
                {suspendError && (
                  <p className="text-[11px] font-bold text-[#8A3112]">{suspendError}</p>
                )}
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#8A3112] hover:bg-[#9A3816] text-[#FBF7EF] text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 touch-target"
                >
                  {processing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  <span>Suspendre l'adresse</span>
                </button>
              </form>
            )}

            {selectedReport.addressStatus === 'SUSPENDED' && (
              <div className="p-4 rounded-xl bg-[#FBF7EF] border border-[#8A3112]/40 space-y-3">
                <div className="flex items-center gap-2 text-[#8A3112] text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Cette adresse est actuellement suspendue par la modération.</span>
                </div>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleConfirmReinstate}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#2A6B44] hover:bg-[#1E5234] text-[#FBF7EF] text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 touch-target"
                >
                  {processing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Rétablir l'adresse</span>
                </button>
              </div>
            )}
          </div>
        )}
      </SidePanel>

      {/* =========================================================================
       * Modale de Confirmation de Suspension (Motif obligatoire)
       * ========================================================================= */}
      {showSuspendModal && selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="suspend-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <div className="bg-[#FBF7EF] rounded-2xl border border-[#766B5B] shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full border border-[#8A3112]/40 bg-[#FBF7EF] flex items-center justify-center text-[#8A3112] shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 id="suspend-dialog-title" className="text-base font-bold text-[#231A15]">
                  Suspendre l'adresse {selectedReport.addressCode} ?
                </h2>
                <p className="text-xs text-[#5C4D44]">
                  L'adresse passera en statut suspendu. Sa fiche publique et son QR code renverront immédiatement une réponse 410 Gone.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="suspend-reason-input" className="text-xs font-bold text-[#231A15] block">
                Motif de la suspension (obligatoire) :
              </label>
              <textarea
                id="suspend-reason-input"
                rows={3}
                value={suspendReason}
                onChange={(e) => {
                  setSuspendReason(e.target.value);
                  setSuspendError(null);
                }}
                placeholder="Précisez la raison (ex: position GPS erronée, photo non conforme...)"
                className="w-full p-2.5 text-xs rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15] placeholder-[#5C4D44] focus:outline-none focus:border-[#12304F]"
              />
              {suspendError && (
                <p className="text-[11px] font-bold text-[#8A3112]">{suspendError}</p>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#766B5B]/30">
              <button
                type="button"
                disabled={processing}
                onClick={() => setShowSuspendModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] text-[#231A15] hover:bg-[#F2ECE1] text-xs font-bold transition min-h-[44px] cursor-pointer touch-target"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmSuspend}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#8A3112] hover:bg-[#9A3816] text-[#FBF7EF] text-xs font-bold transition min-h-[44px] cursor-pointer touch-target shadow-sm disabled:opacity-50"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirmer la suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * Modale de Confirmation de Rétablissement
       * ========================================================================= */}
      {showReinstateModal && selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reinstate-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <div className="bg-[#FBF7EF] rounded-2xl border border-[#766B5B] shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full border border-[#2A6B44]/30 bg-[#2A6B44]/10 flex items-center justify-center text-[#2A6B44] shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 id="reinstate-dialog-title" className="text-base font-bold text-[#231A15]">
                  Rétablir l'adresse {selectedReport.addressCode} ?
                </h2>
                <p className="text-xs text-[#5C4D44]">
                  L'adresse repassera en statut actif et sa fiche publique sera de nouveau consultable.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reinstate-reason-input" className="text-xs font-bold text-[#231A15] block">
                Motif du rétablissement (optionnel) :
              </label>
              <input
                id="reinstate-reason-input"
                type="text"
                value={reinstateReason}
                onChange={(e) => setReinstateReason(e.target.value)}
                placeholder="Ex: Correction validée par le propriétaire"
                className="w-full p-2.5 text-xs rounded-lg border border-[#766B5B] bg-[#F2ECE1] text-[#231A15] placeholder-[#5C4D44] focus:outline-none focus:border-[#12304F]"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#766B5B]/30">
              <button
                type="button"
                disabled={processing}
                onClick={() => setShowReinstateModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] text-[#231A15] hover:bg-[#F2ECE1] text-xs font-bold transition min-h-[44px] cursor-pointer touch-target"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={handleConfirmReinstate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#2A6B44] hover:bg-[#1E5234] text-[#FBF7EF] text-xs font-bold transition min-h-[44px] cursor-pointer touch-target shadow-sm disabled:opacity-50"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirmer le rétablissement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ConnectedLayout>
  );
};

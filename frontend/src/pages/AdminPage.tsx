import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AdminReportResponse, ReportStatus } from '../api/addressApi';
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
  EmptyState,
  ErrorState,
  Modal,
  ConfirmDialog,
  Button,
} from '../components/ui';
import { useAdminModeration } from '../features/admin/useAdminModeration';
import { ReportDetailPanel } from '../features/admin/ReportDetailPanel';
import { ModerationAuditTab } from '../features/admin/ModerationAuditTab';
import { REASON_LABELS } from '../features/admin/types';
import { cn } from '../utils/cn';
import {
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  WifiOff,
  Search,
  FileText,
  History,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export type { LocalAuditAction } from '../features/admin/types';

export const AdminPage: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    statusFilter,
    setStatusFilter,
    pageNumber,
    setPageNumber,
    totalPages,
    reports,
    totalReportsCount,
    openCount,
    resolvedCount,
    dismissedCount,
    loading,
    errorMsg,
    errorStatus,
    processing,
    selectedReport,
    setSelectedReport,
    sessionAuditLogs,
    reload,
    suspendAddress,
    reinstateAddress,
    updateReportStatus,
  } = useAdminModeration({
    isOnline,
    adminEmail: user?.email || '',
    showToast,
  });

  const [activeTab, setActiveTab] = useState<'moderation' | 'audit'>('moderation');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Panneau latéral & dialogues de confirmation
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);
  const [inlineSuspendReason, setInlineSuspendReason] = useState<string>('');
  const [inlineSuspendError, setInlineSuspendError] = useState<string | null>(null);

  const [showSuspendModal, setShowSuspendModal] = useState<boolean>(false);
  const [modalSuspendReason, setModalSuspendReason] = useState<string>('');
  const [modalSuspendError, setModalSuspendError] = useState<string | null>(null);

  const [showReinstateModal, setShowReinstateModal] = useState<boolean>(false);
  const [reinstateReason, setReinstateReason] = useState<string>('');

  const [reportActionConfirm, setReportActionConfirm] = useState<{
    report: AdminReportResponse;
    status: 'RESOLVED' | 'DISMISSED';
  } | null>(null);

  const handleOpenDetail = (report: AdminReportResponse) => {
    setSelectedReport(report);
    setIsSidePanelOpen(true);
    setInlineSuspendReason('');
    setInlineSuspendError(null);
  };

  const handleInlineSuspendSubmit = async () => {
    if (!selectedReport) return;
    const result = await suspendAddress(selectedReport, inlineSuspendReason);
    if (result.ok) {
      setInlineSuspendReason('');
      setInlineSuspendError(null);
    } else if (result.error) {
      setInlineSuspendError(result.error);
    }
  };

  const handleModalSuspendSubmit = async () => {
    if (!selectedReport) return;
    const result = await suspendAddress(selectedReport, modalSuspendReason);
    if (result.ok) {
      setShowSuspendModal(false);
      setModalSuspendReason('');
      setModalSuspendError(null);
    } else if (result.error) {
      setModalSuspendError(result.error);
    }
  };

  const handleConfirmReinstate = async () => {
    if (!selectedReport) return;
    const result = await reinstateAddress(selectedReport, reinstateReason);
    if (result.ok) {
      setShowReinstateModal(false);
      setReinstateReason('');
    }
  };

  const handleConfirmReportStatus = async () => {
    if (!reportActionConfirm) return;
    const ok = await updateReportStatus(reportActionConfirm.report, reportActionConfirm.status);
    if (ok) {
      setReportActionConfirm(null);
    }
  };

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.addressCode.toLowerCase().includes(q) ||
          r.comment?.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          (REASON_LABELS[r.reason] || '').toLowerCase().includes(q)
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

  if (!isOnline) {
    return (
      <ConnectedLayout
        title="Administration & Modération des signalements"
        subtitle="Connexion Internet requise pour accéder aux signalements."
        maxWidth="wide"
      >
        <div className="p-8 text-center rounded-2xl bg-surface-elevated border border-border shadow-xs space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-warning-soft border border-warning-border text-warning flex items-center justify-center mx-auto">
            <WifiOff className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-base font-bold text-ink">Mode hors ligne actif</h2>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
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
      maxWidth="wide"
    >
      {/* 1. Indicateurs réels issus de l'API */}
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

      {/* 2. Onglets File de modération & Journal d'audit */}
      <Tabs
        variant="underline"
        tabs={[
          { id: 'moderation', label: 'File de modération', icon: ShieldAlert, count: openCount },
          {
            id: 'audit',
            label: "Journal d'audit de session",
            icon: History,
            count: sessionAuditLogs.length,
          },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as 'moderation' | 'audit')}
        ariaLabel="Sections d'administration"
      />

      {/* TAB 1 : File de modération */}
      <TabPanel id="moderation" activeTab={activeTab}>
        <div className="space-y-4">
          <Card padding="sm">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div
                role="tablist"
                aria-label="Filtrer les signalements par état"
                className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-surface border border-border"
              >
                {(
                  [
                    { id: 'OPEN', label: 'Ouverts', count: openCount },
                    { id: 'RESOLVED', label: 'Traités', count: resolvedCount },
                    { id: 'DISMISSED', label: 'Classés sans suite', count: dismissedCount },
                    {
                      id: 'ALL',
                      label: 'Tous',
                      count: openCount + resolvedCount + dismissedCount || totalReportsCount,
                    },
                  ] as { id: ReportStatus | 'ALL'; label: string; count: number }[]
                ).map((tab) => {
                  const active = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStatusFilter(tab.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[36px]',
                        active
                          ? 'bg-ink text-ink-inverse shadow-xs'
                          : 'text-ink-muted hover:text-ink hover:bg-surface-hover'
                      )}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={cn(
                          'font-mono text-[11px]',
                          active ? 'text-ink-inverse/80' : 'text-ink-subtle'
                        )}
                      >
                        ({tab.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[240px]">
                <Search
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrer par code (ex: ZIG-KBG)…"
                  className="w-full pl-9 pr-3 py-2 min-h-[38px] text-xs rounded-xl border border-border-strong bg-canvas text-ink placeholder:text-ink-subtle focus:outline-none focus:border-institution focus:ring-2 focus:ring-institution-soft"
                />
              </div>
            </div>
          </Card>

          {loading ? (
            <div
              className="p-10 text-center rounded-2xl bg-surface-elevated border border-border space-y-3 min-h-[420px] flex flex-col items-center justify-center"
              aria-busy="true"
            >
              <Loader2 className="w-7 h-7 animate-spin text-institution" aria-hidden="true" />
              <p className="text-xs sm:text-sm text-ink-muted">
                Chargement de la file de modération…
              </p>
            </div>
          ) : errorMsg ? (
            <ErrorState
              errorCode={errorStatus ?? undefined}
              title={
                errorStatus === 401
                  ? 'Session expirée'
                  : errorStatus === 403
                  ? 'Autorisation refusée'
                  : 'Impossible de charger les signalements'
              }
              description={errorMsg}
              onRetry={
                errorStatus === 401
                  ? () => navigate('/login', { state: { from: location, sessionExpired: true } })
                  : errorStatus === 403
                  ? undefined
                  : reload
              }
              retryLabel={errorStatus === 401 ? 'Se reconnecter' : 'Réessayer'}
              homeTo="/tableau-de-bord"
              homeLabel="Tableau de bord"
            />
          ) : filteredReports.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Aucun signalement correspondant"
              description="La file de modération ne contient aucun élément pour ce filtre."
            />
          ) : (
            <>
              <DataTable<AdminReportResponse>
                data={filteredReports}
                keyExtractor={(r) => r.id}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
                onRowClick={handleOpenDetail}
                selectedId={selectedReport?.id}
                ariaLabel="Tableau de données"
                columns={[
                  {
                    key: 'addressCode',
                    header: 'Code adresse',
                    sortable: true,
                    render: (r) => (
                      <span className="font-mono font-bold text-institution hover:underline whitespace-nowrap">
                        {r.addressCode}
                      </span>
                    ),
                  },
                  {
                    key: 'reason',
                    header: 'Motif du signalement',
                    render: (r) => (
                      <div className="min-w-0">
                        <span className="font-semibold text-ink block">
                          {REASON_LABELS[r.reason] || r.reason}
                        </span>
                        {r.comment && (
                          <span className="text-xs text-ink-muted line-clamp-1">
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
                      <span className="font-mono text-xs text-ink-muted whitespace-nowrap">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-strong bg-surface-elevated hover:bg-surface text-institution font-semibold text-xs cursor-pointer transition-colors"
                      >
                        <span>Examiner</span>
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    ),
                  },
                ]}
                renderMobileCard={(r) => (
                  <div className="p-4 rounded-2xl border border-border bg-surface-elevated shadow-xs space-y-2.5 cursor-pointer active:bg-surface">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm text-institution">
                        {r.addressCode}
                      </span>
                      <StatusBadge status={r.status} size="sm" />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-ink-muted font-medium">Motif :</span>
                        <span className="font-semibold text-ink text-right">
                          {REASON_LABELS[r.reason] || r.reason}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="text-ink-secondary italic bg-surface p-2.5 rounded-xl border border-border text-xs">
                          « {r.comment} »
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-ink-muted">Statut adresse :</span>
                        <StatusBadge status={r.addressStatus} size="sm" />
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-border flex items-center justify-between text-xs text-ink-muted">
                      <span className="font-mono">
                        {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="text-institution font-semibold inline-flex items-center gap-0.5">
                        Examiner <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                )}
              />

              {/* Pagination réelle serveur (si > 1 page) */}
              {totalPages > 1 && (
                <nav
                  aria-label="Pagination des signalements"
                  className="flex items-center justify-between gap-3 pt-2"
                >
                  <span className="text-xs text-ink-muted">
                    Page <strong className="text-ink">{pageNumber + 1}</strong> sur{' '}
                    <strong className="text-ink">{totalPages}</strong> ({totalReportsCount}{' '}
                    signalements)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageNumber === 0}
                      onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                      leftIcon={ChevronLeft}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageNumber + 1 >= totalPages}
                      onClick={() => setPageNumber((p) => p + 1)}
                      rightIcon={ChevronRight}
                    >
                      Suivant
                    </Button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </TabPanel>

      {/* TAB 2 : Journal d'audit de session */}
      <TabPanel id="audit" activeTab={activeTab}>
        <ModerationAuditTab logs={sessionAuditLogs} />
      </TabPanel>

      {/* Tiroir latéral de détail d'un signalement */}
      <ReportDetailPanel
        report={selectedReport}
        isOpen={isSidePanelOpen}
        processing={processing}
        inlineSuspendReason={inlineSuspendReason}
        inlineSuspendError={inlineSuspendError}
        onInlineSuspendReasonChange={(val) => {
          setInlineSuspendReason(val);
          setInlineSuspendError(null);
        }}
        onInlineSuspendSubmit={handleInlineSuspendSubmit}
        onClose={() => setIsSidePanelOpen(false)}
        onRequestDismiss={(r) => setReportActionConfirm({ report: r, status: 'DISMISSED' })}
        onRequestResolve={(r) => setReportActionConfirm({ report: r, status: 'RESOLVED' })}
        onRequestOpenSuspendModal={() => {
          setModalSuspendReason(inlineSuspendReason);
          setModalSuspendError(null);
          setShowSuspendModal(true);
        }}
        onRequestOpenReinstateModal={() => {
          setReinstateReason('');
          setShowReinstateModal(true);
        }}
      />

      {/* Modale P01 accessible : confirmation de suspension avec motif obligatoire */}
      <Modal
        isOpen={showSuspendModal && Boolean(selectedReport)}
        onClose={() => !processing && setShowSuspendModal(false)}
        title={`Suspendre l'adresse ${selectedReport?.addressCode || ''} ?`}
        description="L'adresse passera en statut suspendu. Sa fiche publique et son QR code renverront immédiatement HTTP 410 Gone."
        size="md"
        closeOnBackdrop={!processing}
        closeOnEscape={!processing}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              disabled={processing}
              onClick={() => setShowSuspendModal(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={processing}
              onClick={handleModalSuspendSubmit}
              leftIcon={ShieldAlert}
              className="w-full sm:w-auto"
            >
              Confirmer la suspension
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <label
            htmlFor="modal-suspend-reason-input"
            className="text-xs font-semibold text-ink block"
          >
            Motif de la suspension (obligatoire)
          </label>
          <textarea
            id="modal-suspend-reason-input"
            rows={3}
            maxLength={300}
            value={modalSuspendReason}
            onChange={(e) => {
              setModalSuspendReason(e.target.value);
              setModalSuspendError(null);
            }}
            placeholder="Précisez la raison (ex : position GPS erronée, photo non conforme…)"
            className="w-full p-3 text-xs sm:text-sm rounded-xl border border-border-strong bg-canvas text-ink placeholder:text-ink-subtle focus:outline-none focus:border-institution focus:ring-2 focus:ring-institution-soft"
          />
          {modalSuspendError && (
            <p role="alert" className="text-xs font-semibold text-danger">
              {modalSuspendError}
            </p>
          )}
        </div>
      </Modal>

      {/* Modale P01 accessible : confirmation de rétablissement */}
      <Modal
        isOpen={showReinstateModal && Boolean(selectedReport)}
        onClose={() => !processing && setShowReinstateModal(false)}
        title={`Rétablir l'adresse ${selectedReport?.addressCode || ''} ?`}
        description="L'adresse repassera en statut actif et sa fiche publique sera de nouveau consultable."
        size="md"
        closeOnBackdrop={!processing}
        closeOnEscape={!processing}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              disabled={processing}
              onClick={() => setShowReinstateModal(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={processing}
              onClick={handleConfirmReinstate}
              leftIcon={RotateCcw}
              className="w-full sm:w-auto !bg-success hover:!bg-success-hover"
            >
              Confirmer le rétablissement
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <label
            htmlFor="reinstate-reason-input"
            className="text-xs font-semibold text-ink block"
          >
            Motif du rétablissement (optionnel)
          </label>
          <input
            id="reinstate-reason-input"
            type="text"
            maxLength={300}
            value={reinstateReason}
            onChange={(e) => setReinstateReason(e.target.value)}
            placeholder="Ex : Vérification effectuée, adresse conforme"
            className="w-full p-3 text-xs sm:text-sm rounded-xl border border-border-strong bg-canvas text-ink placeholder:text-ink-subtle focus:outline-none focus:border-institution focus:ring-2 focus:ring-institution-soft"
          />
        </div>
      </Modal>

      {/* Modale de confirmation : traiter / classer sans suite un signalement */}
      <ConfirmDialog
        isOpen={Boolean(reportActionConfirm)}
        onClose={() => !processing && setReportActionConfirm(null)}
        onConfirm={handleConfirmReportStatus}
        isLoading={processing}
        title={
          reportActionConfirm?.status === 'RESOLVED'
            ? `Marquer le signalement ${reportActionConfirm.report.addressCode} comme traité ?`
            : `Classer sans suite le signalement ${reportActionConfirm?.report.addressCode || ''} ?`
        }
        description={
          reportActionConfirm?.status === 'RESOLVED'
            ? "Le signalement passera au statut « Traité » et cette décision sera journalisée dans l'audit serveur."
            : "Le signalement sera classé sans suite sans modifier le statut de l'adresse et cette décision sera journalisée côté serveur."
        }
        confirmLabel={
          reportActionConfirm?.status === 'RESOLVED'
            ? 'Confirmer comme traité'
            : 'Confirmer le classement'
        }
        cancelLabel="Annuler"
        variant={reportActionConfirm?.status === 'RESOLVED' ? 'info' : 'warning'}
      />
    </ConnectedLayout>
  );
};

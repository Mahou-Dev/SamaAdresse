import React, { useEffect, useState } from 'react';
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
import {
  ShieldAlert,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  X,
  WifiOff,
} from 'lucide-react';
import { useOnlineStatus } from '../context/OnlineStatusContext';

const REASON_LABELS: Record<ReportReason, string> = {
  POSITION_INCORRECTE: 'Position GPS incorrecte',
  CONTENU_INAPPROPRIE: 'Description inappropriée ou trompeuse',
  PHOTO_INAPPROPRIEE: 'Photo inappropriée ou sans rapport',
  AUTRE: 'Autre motif',
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: 'Ouvert',
  RESOLVED: 'Traité',
  DISMISSED: 'Classé sans suite',
};

export const AdminPage: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('OPEN');
  const [reports, setReports] = useState<AdminReportResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminReportResponse | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  const { showToast } = useToast();

  const fetchReports = async (filter: ReportStatus | 'ALL') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const page = await getAdminReports(filter === 'ALL' ? undefined : filter, 0, 50);
      setReports(page.content);
      if (selectedReport) {
        const refreshed = page.content.find((r) => r.id === selectedReport.id);
        setSelectedReport(refreshed || null);
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

  const handleSelectReport = (report: AdminReportResponse) => {
    setSelectedReport(report);
    setSuspendReason('');
    setSuspendError(null);
  };

  const handleSuspendAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    if (!suspendReason.trim()) {
      setSuspendError('Le motif est obligatoire');
      return;
    }

    setProcessing(true);
    setSuspendError(null);
    try {
      await suspendAddressAdmin(selectedReport.addressId, suspendReason.trim());
      showToast(`Adresse ${selectedReport.addressCode} suspendue.`, 'success');
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

  const handleDismissReport = async (report: AdminReportResponse) => {
    setProcessing(true);
    setSuspendError(null);
    try {
      await updateReportStatusAdmin(report.id, 'DISMISSED');
      showToast('Signalement classé sans suite.', 'info');
      await fetchReports(statusFilter);
    } catch (err: any) {
      showToast(
        err instanceof ApiError ? err.message : 'Impossible de mettre à jour ce signalement.',
        'error'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleReinstateAddress = async (report: AdminReportResponse) => {
    setProcessing(true);
    setSuspendError(null);
    try {
      await reinstateAddressAdmin(report.addressId);
      showToast(`Adresse ${report.addressCode} rétablie.`, 'success');
      await fetchReports(statusFilter);
    } catch (err: any) {
      showToast(
        err instanceof ApiError ? err.message : "Impossible de rétablir l'adresse.",
        'error'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col items-center justify-center text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#FFFFFF] border border-[#8C8272] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-3">
          <WifiOff className="w-8 h-8 text-[#8A3112] mx-auto" />
          <h1 className="text-lg font-bold text-[#231A15]">Connexion requise pour afficher cette page</h1>
          <p className="text-xs text-[#5C4D44] leading-relaxed">
            Le panneau de modération des signalements nécessite une connexion réseau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 font-sans space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E6DDD0]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
            Modération des signalements
          </h1>
          <p className="text-xs sm:text-sm text-[#5C4D44] mt-1">
            Examen des signalements publics et gestion des adresses signalées.
          </p>
        </div>

        {/* Filtres par état */}
        <div
          role="tablist"
          aria-label="Filtrer les signalements par état"
          className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF]"
        >
          {(
            [
              { id: 'OPEN', label: 'Ouverts' },
              { id: 'RESOLVED', label: 'Traités' },
              { id: 'DISMISSED', label: 'Classés sans suite' },
              { id: 'ALL', label: 'Tous' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab.id}
              onClick={() => {
                setSelectedReport(null);
                setStatusFilter(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#231A15] text-[#FFFFFF]'
                  : 'text-[#5C4D44] hover:text-[#231A15]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center rounded-xl bg-[#FFFFFF] border border-[#D4CEBF] space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#1D528F] mx-auto" />
          <p className="text-xs text-[#5C4D44]">Chargement des signalements...</p>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-10 text-center rounded-xl bg-[#FFFFFF] border border-[#D4CEBF] text-xs sm:text-sm text-[#5C4D44]">
          Aucun signalement correspondant à ce filtre.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Liste des signalements : Table dense sur desktop, Cartes propres sur mobile */}
          <div className={selectedReport ? 'lg:col-span-7' : 'lg:col-span-12'}>
            {/* Vue Table Desktop */}
            <div className="hidden md:block rounded-xl border border-[#8C8272] bg-[#FFFFFF] shadow-[0_2px_0_rgba(35,26,21,0.06)] overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F2ECE1] border-b border-[#8C8272]/40 text-[#231A15] font-bold">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Motif</th>
                    <th className="py-3 px-4">État adresse</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DDD0]">
                  {reports.map((report) => {
                    const isSelected = selectedReport?.id === report.id;
                    return (
                      <tr
                        key={report.id}
                        className={`transition ${
                          isSelected ? 'bg-[#F2ECE1]/70' : 'hover:bg-[#FBF9F5]'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#231A15]">
                          {report.addressCode}
                        </td>
                        <td className="py-3 px-4 text-[#231A15]">
                          <span className="font-semibold block">
                            {REASON_LABELS[report.reason] || report.reason}
                          </span>
                          {report.comment && (
                            <span className="text-[#5C4D44] line-clamp-1">{report.comment}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                              report.addressStatus === 'SUSPENDED'
                                ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#DC2626]/30'
                                : report.addressStatus === 'ARCHIVED'
                                ? 'bg-[#F2ECE1] text-[#5C4D44]'
                                : 'bg-[#2A6B44]/10 text-[#2A6B44]'
                            }`}
                          >
                            {report.addressStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#5C4D44]">
                          {STATUS_LABELS[report.status] || report.status}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#5C4D44]">
                          {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleSelectReport(report)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#1D528F] font-bold text-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Examiner</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vue Cartes Mobile */}
            <div className="md:hidden space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-xl border border-[#8C8272] bg-[#FFFFFF] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-[#231A15]">
                      {report.addressCode}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F2ECE1] text-[#231A15]">
                      {STATUS_LABELS[report.status] || report.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#231A15]">
                    {REASON_LABELS[report.reason] || report.reason}
                  </p>
                  {report.comment && (
                    <p className="text-xs text-[#5C4D44] line-clamp-2">{report.comment}</p>
                  )}
                  <div className="pt-2 border-t border-[#E6DDD0] flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[#5C4D44]">
                      {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectReport(report)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#1D528F] font-bold text-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Examiner</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panneau de détail d'un signalement */}
          {selectedReport && (
            <div className="lg:col-span-5 p-5 rounded-xl border border-[#8C8272] bg-[#FFFFFF] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-[#E6DDD0] pb-3">
                <h2 className="text-base font-bold text-[#231A15]">
                  Détail du signalement
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 rounded-lg text-[#5C4D44] hover:bg-[#F2ECE1] cursor-pointer"
                  aria-label="Fermer le détail"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AddressPlate
                code={selectedReport.addressCode}
                zone={selectedReport.addressCode.split('-')[0] || 'ZIG'}
                type="MAISON"
                size="sm"
                showCopy={false}
              />

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-[#FBF9F5] border border-[#D4CEBF] space-y-1">
                  <span className="text-[#5C4D44] font-semibold block">
                    Description de l'adresse :
                  </span>
                  <p className="text-[#231A15] font-medium">
                    {selectedReport.addressDescription}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#FBF9F5] border border-[#D4CEBF] space-y-1">
                  <span className="text-[#5C4D44] font-semibold block">
                    Motif du signalement :
                  </span>
                  <p className="text-[#231A15] font-bold">
                    {REASON_LABELS[selectedReport.reason] || selectedReport.reason}
                  </p>
                  {selectedReport.comment && (
                    <p className="text-[#231A15] pt-1 border-t border-[#E6DDD0]">
                      « {selectedReport.comment} »
                    </p>
                  )}
                </div>
              </div>

              {selectedReport.addressStatus === 'SUSPENDED' ? (
                <div className="space-y-3 pt-2 border-t border-[#E6DDD0]">
                  <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Cette adresse est actuellement suspendue.</span>
                  </div>
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handleReinstateAddress(selectedReport)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#1D528F] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#1D528F] text-xs font-bold transition cursor-pointer disabled:opacity-50 touch-target"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Rétablir l'adresse</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSuspendAddress} className="space-y-3 pt-2 border-t border-[#E6DDD0]">
                  <div className="space-y-1">
                    <label
                      htmlFor="suspend-reason-input"
                      className="block text-xs font-bold text-[#231A15]"
                    >
                      Motif de suspension (obligatoire pour suspendre)
                    </label>
                    <textarea
                      id="suspend-reason-input"
                      rows={2}
                      maxLength={300}
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Indiquez la raison de la suspension..."
                      className="w-full px-3 py-2 rounded-lg border border-[#8C8272] bg-[#FFFFFF] text-xs text-[#231A15] placeholder:text-[#5C4D44] focus:outline-none focus:ring-2 focus:ring-[#1D528F]"
                    />
                  </div>

                  {suspendError && (
                    <div
                      role="alert"
                      className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs font-medium"
                    >
                      {suspendError}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="submit"
                      disabled={processing}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] cursor-pointer disabled:opacity-50 touch-target"
                    >
                      {processing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      )}
                      <span>Suspendre l'adresse</span>
                    </button>

                    {selectedReport.status === 'OPEN' && (
                      <button
                        type="button"
                        disabled={processing}
                        onClick={() => handleDismissReport(selectedReport)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#8C8272] bg-[#FFFFFF] hover:bg-[#F2ECE1] text-[#231A15] text-xs font-bold transition cursor-pointer disabled:opacity-50 touch-target"
                      >
                        <XCircle className="w-3.5 h-3.5 text-[#5C4D44]" />
                        <span>Classer sans suite</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {selectedReport.status !== 'OPEN' && (
                <div className="p-2.5 rounded-lg bg-[#F2ECE1] text-xs text-[#231A15] flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#2A6B44] shrink-0" />
                  <span>Statut du signalement : {STATUS_LABELS[selectedReport.status]}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAdminReports,
  suspendAddressAdmin,
  reinstateAddressAdmin,
  updateReportStatusAdmin,
} from '../../api/addressApi';
import type { AdminReportResponse, ReportStatus } from '../../api/addressApi';
import { ApiError } from '../../api/apiClient';
import type { ToastType } from '../../components/Toast';
import type { LocalAuditAction } from './types';

const PAGE_SIZE = 20;

export interface UseAdminModerationOptions {
  isOnline: boolean;
  adminEmail: string;
  showToast: (message: string, type?: ToastType) => void;
}

export function useAdminModeration({
  isOnline,
  adminEmail,
  showToast,
}: UseAdminModerationOptions) {
  const [statusFilter, setStatusFilterState] = useState<ReportStatus | 'ALL'>('OPEN');
  const [pageNumber, setPageNumber] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [reports, setReports] = useState<AdminReportResponse[]>([]);
  const [totalReportsCount, setTotalReportsCount] = useState<number>(0);
  const [openCount, setOpenCount] = useState<number>(0);
  const [resolvedCount, setResolvedCount] = useState<number>(0);
  const [dismissedCount, setDismissedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<AdminReportResponse | null>(null);
  const [sessionAuditLogs, setSessionAuditLogs] = useState<LocalAuditAction[]>([]);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  const inFlightRef = useRef<boolean>(false);
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const setStatusFilter = useCallback((next: ReportStatus | 'ALL') => {
    setStatusFilterState(next);
    setPageNumber(0);
  }, []);

  const reload = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    let cancelled = false;

    const loadReports = async () => {
      setLoading(true);
      setErrorMsg(null);
      setErrorStatus(null);
      try {
        const [page, openPage, resolvedPage, dismissedPage] = await Promise.all([
          getAdminReports(statusFilter === 'ALL' ? undefined : statusFilter, pageNumber, PAGE_SIZE),
          getAdminReports('OPEN', 0, 1),
          getAdminReports('RESOLVED', 0, 1),
          getAdminReports('DISMISSED', 0, 1),
        ]);

        if (cancelled) return;

        setReports(page.content);
        setTotalReportsCount(page.totalElements);
        setTotalPages(page.totalPages);
        setOpenCount(openPage.totalElements);
        setResolvedCount(resolvedPage.totalElements);
        setDismissedCount(dismissedPage.totalElements);

        setSelectedReport((prev) => {
          if (!prev) return null;
          return page.content.find((r) => r.id === prev.id) ?? prev;
        });
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setErrorStatus(err.status);
          if (err.status === 401) {
            setErrorMsg('Votre session a expiré. Reconnectez-vous pour accéder à la modération.');
          } else if (err.status === 403) {
            setErrorMsg(
              "Accès refusé par le serveur : des droits d'administrateur valides sont requis."
            );
          } else {
            setErrorMsg(err.message);
          }
        } else {
          setErrorMsg('Impossible de charger les signalements.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReports();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, pageNumber, isOnline, refreshTick]);

  const appendAudit = useCallback(
    (
      actionType: LocalAuditAction['actionType'],
      actionLabel: string,
      addressCode: string,
      reason?: string
    ) => {
      const entry: LocalAuditAction = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actionType,
        actionLabel,
        addressCode,
        adminEmail: adminEmail || 'admin@samaadresse.sn',
        reason,
        timestamp: new Date().toISOString(),
      };
      setSessionAuditLogs((prev) => [entry, ...prev]);
    },
    [adminEmail]
  );

  const suspendAddress = useCallback(
    async (report: AdminReportResponse, reason: string): Promise<{ ok: boolean; error?: string }> => {
      const trimmed = reason.trim();
      if (!trimmed) {
        return { ok: false, error: 'Le motif de suspension est obligatoire.' };
      }
      if (inFlightRef.current) return { ok: false };
      inFlightRef.current = true;
      setProcessing(true);
      try {
        const updatedAddress = await suspendAddressAdmin(report.addressId, trimmed);
        appendAudit('SUSPEND', "Suspension d'adresse", report.addressCode, trimmed);
        setSelectedReport((prev) =>
          prev && prev.id === report.id
            ? { ...prev, addressStatus: updatedAddress.status }
            : prev
        );
        showToastRef.current(`Adresse ${report.addressCode} suspendue.`, 'success');
        setRefreshTick((t) => t + 1);
        return { ok: true };
      } catch (err: unknown) {
        const msg =
          err instanceof ApiError ? err.message : "Impossible de suspendre l'adresse.";
        showToastRef.current(msg, 'error');
        return { ok: false, error: msg };
      } finally {
        inFlightRef.current = false;
        setProcessing(false);
      }
    },
    [appendAudit]
  );

  const reinstateAddress = useCallback(
    async (
      report: AdminReportResponse,
      reason?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (inFlightRef.current) return { ok: false };
      inFlightRef.current = true;
      setProcessing(true);
      const trimmed = reason?.trim() || '';
      try {
        const updatedAddress = await reinstateAddressAdmin(report.addressId, trimmed);
        appendAudit(
          'REINSTATE',
          "Rétablissement d'adresse",
          report.addressCode,
          trimmed || undefined
        );
        setSelectedReport((prev) =>
          prev && prev.id === report.id
            ? { ...prev, addressStatus: updatedAddress.status }
            : prev
        );
        showToastRef.current(`Adresse ${report.addressCode} rétablie avec succès.`, 'success');
        setRefreshTick((t) => t + 1);
        return { ok: true };
      } catch (err: unknown) {
        const msg =
          err instanceof ApiError ? err.message : "Impossible de rétablir l'adresse.";
        showToastRef.current(msg, 'error');
        return { ok: false, error: msg };
      } finally {
        inFlightRef.current = false;
        setProcessing(false);
      }
    },
    [appendAudit]
  );

  const updateReportStatus = useCallback(
    async (
      report: AdminReportResponse,
      status: 'RESOLVED' | 'DISMISSED'
    ): Promise<boolean> => {
      if (inFlightRef.current) return false;
      inFlightRef.current = true;
      setProcessing(true);
      try {
        const updated = await updateReportStatusAdmin(report.id, status);
        appendAudit(
          status === 'RESOLVED' ? 'RESOLVE' : 'DISMISS',
          status === 'RESOLVED' ? 'Signalement marqué traité' : 'Signalement classé sans suite',
          report.addressCode
        );
        setSelectedReport((prev) => (prev && prev.id === report.id ? updated : prev));
        showToastRef.current(
          status === 'RESOLVED'
            ? 'Signalement marqué comme traité.'
            : 'Signalement classé sans suite.',
          status === 'RESOLVED' ? 'success' : 'info'
        );
        setRefreshTick((t) => t + 1);
        return true;
      } catch (err: unknown) {
        showToastRef.current(
          err instanceof ApiError ? err.message : 'Impossible de mettre à jour ce signalement.',
          'error'
        );
        return false;
      } finally {
        inFlightRef.current = false;
        setProcessing(false);
      }
    },
    [appendAudit]
  );

  return {
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
    loading: isOnline ? loading : false,
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
  };
}

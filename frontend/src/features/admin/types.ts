import type { ReportReason } from '../../api/addressApi';

export const REASON_LABELS: Record<ReportReason, string> = {
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

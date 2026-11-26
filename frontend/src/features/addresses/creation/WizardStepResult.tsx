import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  WifiOff,
  Check,
  Download,
  Printer,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { AddressResponse } from '../../../api/addressApi';
import { AddressPlate } from '../../../components/AddressPlate';
import { ShareAddress } from '../../../components/ShareAddress';
import { syncManager } from '../../../utils/syncManager';

export interface WizardStepResultProps {
  createdAddress: AddressResponse;
  isOfflineCreated: boolean;
  hasTemporaryCode: boolean;
  onDownloadQrCode: (code: string) => void;
  onReset: () => void;
}

type LiveSyncState = 'pending' | 'syncing' | 'synced' | 'failed';

export const WizardStepResult: React.FC<WizardStepResultProps> = ({
  createdAddress,
  isOfflineCreated,
  hasTemporaryCode,
  onDownloadQrCode,
  onReset,
}) => {
  const [liveSyncState, setLiveSyncState] = useState<LiveSyncState>(
    isOfflineCreated ? 'pending' : 'synced'
  );
  const [syncedAddress, setSyncedAddress] = useState<AddressResponse | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);

  // Écouter le gestionnaire de synchronisation si le brouillon vient d'être créé hors ligne
  useEffect(() => {
    if (!isOfflineCreated) return;

    const unsubscribe = syncManager.subscribe((event) => {
      if (event.draftId && event.draftId !== createdAddress.id) return;

      if (event.type === 'SYNC_PROGRESS') {
        setLiveSyncState('syncing');
        setSyncErrorMsg(null);
      } else if (event.type === 'SYNC_SUCCESS' && event.address) {
        setLiveSyncState('synced');
        setSyncedAddress(event.address);
        setSyncErrorMsg(null);
      } else if (event.type === 'SYNC_ERROR') {
        setLiveSyncState('failed');
        setSyncErrorMsg(event.message || 'Échec de synchronisation. Nouvelle tentative au retour réseau.');
      }
    });

    return () => unsubscribe();
  }, [isOfflineCreated, createdAddress.id]);

  const effectiveAddress = syncedAddress ?? createdAddress;
  const isConfirmedOnServer = !isOfflineCreated || liveSyncState === 'synced';
  const qrEndpoint = `${import.meta.env.VITE_API_BASE_URL || ''}/api/addresses/${encodeURIComponent(effectiveAddress.code)}/qrcode`;

  return (
    <article aria-labelledby="step4-title" className="space-y-6 sa-animate-fade-in">
      {/* En-tête de statut distinguant clairement création locale vs serveur */}
      <div className="text-center space-y-2.5">
        {!isConfirmedOnServer ? (
          liveSyncState === 'syncing' ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-institution-soft border border-institution-border text-institution text-xs font-bold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Synchronisation en cours…</span>
            </div>
          ) : liveSyncState === 'failed' ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-danger-soft border border-danger-border text-danger text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Échec de synchronisation · conservée localement</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-warning-soft border border-warning-border text-warning text-xs font-bold">
              <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Enregistrée sur cet appareil · en attente d'envoi</span>
            </div>
          )
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-success-soft border border-success-border text-success text-xs font-bold">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
            <span>Adresse créée et enregistrée</span>
          </div>
        )}

        <h1
          id="step4-title"
          className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight"
        >
          {isConfirmedOnServer
            ? "Votre plaque d'adresse numérique"
            : "Votre plaque d'adresse"}
        </h1>

        <p className="text-xs sm:text-sm text-ink-secondary max-w-md mx-auto leading-relaxed">
          {!isConfirmedOnServer
            ? hasTemporaryCode
              ? 'Code temporaire attribué hors ligne. Le code définitif sera attribué lors de la synchronisation avec le serveur.'
              : 'Adresse enregistrée hors ligne sur votre appareil. Elle sera automatiquement transmise dès votre retour en ligne.'
            : 'Ce code est confirmé par le serveur et ne changera plus. Vous pouvez le partager, imprimer la plaque ou télécharger son QR Code.'}
        </p>

        {syncErrorMsg && (
          <p
            role="alert"
            className="text-xs font-medium text-danger bg-danger-soft border border-danger-border rounded-xl p-3 max-w-md mx-auto"
          >
            {syncErrorMsg}
          </p>
        )}
      </div>

      {/* Plaque d'adresse héro */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-secondary border border-border flex flex-col items-center justify-center">
        <AddressPlate
          code={effectiveAddress.code}
          zone={effectiveAddress.zone}
          type={effectiveAddress.locationType}
          size="lg"
          showCopy={isConfirmedOnServer}
          className="w-full"
        />
      </div>

      {/* QR Code & Partage (uniquement lorsque confirmée sur le serveur) */}
      {isConfirmedOnServer && (
        <div className="space-y-5">
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-elevated border border-border shadow-xs text-center space-y-4">
            <h2 className="text-sm font-bold text-ink">QR code d'accès rapide</h2>
            {qrFailed ? (
              <p className="text-xs text-ink-muted">
                L'aperçu du QR Code est temporairement indisponible. Vous pouvez réessayer ou ouvrir la fiche publique.
              </p>
            ) : (
              <div className="inline-block p-2.5 bg-canvas border border-border rounded-2xl shadow-xs">
                <img
                  src={qrEndpoint}
                  alt={`QR code pour l'adresse ${effectiveAddress.code}`}
                  width={144}
                  height={144}
                  onError={() => setQrFailed(true)}
                  className="w-36 h-36 mx-auto object-contain"
                />
              </div>
            )}
            <p className="text-xs text-ink-muted">
              Scannable par toute caméra de smartphone sans application requise.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onDownloadQrCode(effectiveAddress.code)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-ink hover:bg-ink-secondary text-ink-inverse text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-brand-border" aria-hidden="true" />
                <span>Télécharger le QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-xs font-semibold text-ink transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
                <span>Imprimer la plaque</span>
              </button>
            </div>
          </div>

          <ShareAddress
            code={effectiveAddress.code}
            description={effectiveAddress.description}
            showQrCode={false}
          />
        </div>
      )}

      {/* Actions de fin de parcours */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-xs sm:text-sm font-semibold text-ink transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-ink-muted" aria-hidden="true" />
          <span>
            {isConfirmedOnServer ? 'Créer une autre adresse' : 'Enregistrer une autre adresse'}
          </span>
        </button>

        {!isConfirmedOnServer ? (
          <Link
            to="/addresses/mine"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-xs sm:text-sm font-semibold transition-colors shadow-xs"
          >
            <span>Voir mes adresses</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            to={`/a/${effectiveAddress.code}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] rounded-xl bg-institution hover:bg-institution-hover text-ink-inverse text-xs sm:text-sm font-semibold transition-colors shadow-xs"
          >
            <span>Voir la fiche publique</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
};

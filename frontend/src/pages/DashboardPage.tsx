import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { getMyAddresses } from '../api/addressApi';
import type { AddressResponse } from '../api/addressApi';
import { getDrafts } from '../utils/offlineDb';
import type { OfflineDraft } from '../utils/offlineDb';
import { syncManager } from '../utils/syncManager';
import { useToast } from '../components/Toast';
import { ConnectedLayout } from '../components/ConnectedLayout';
import {
  Card,
  StatTile,
  StatusBadge,
  Skeleton,
} from '../components/ui';
import { AddressPlate } from '../components/AddressPlate';
import { getLocationTypeLabel } from '../utils/locationTypes';
import {
  Plus,
  MapPin,
  ShieldAlert,
  Archive,
  Clock,
  Camera,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const firstName = user?.fullName ? user.fullName.trim().split(' ')[0] : 'vous';

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const [addrList, draftList] = await Promise.all([
        getMyAddresses().catch(() => [] as AddressResponse[]),
        getDrafts().catch(() => [] as OfflineDraft[]),
      ]);
      setAddresses(addrList);
      setDrafts(draftList);
    } catch {
      setErrorMsg('Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);

    const unsubscribe = syncManager.subscribe((event) => {
      if (event.type === 'SYNC_START') {
        setIsSyncing(true);
      } else if (event.type === 'SYNC_COMPLETE' || event.type === 'SYNC_SUCCESS') {
        setIsSyncing(false);
        loadData(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncManager.syncNow();
    await loadData(true);
    showToast('Synchronisation terminée.', 'info');
  };

  // Calculs métriques réels
  const activeCount = addresses.filter((a) => a.status === 'ACTIVE').length;
  const suspendedCount = addresses.filter((a) => a.status === 'SUSPENDED').length;
  const archivedCount = addresses.filter((a) => a.status === 'ARCHIVED').length;
  const pendingCount = drafts.filter((d) => d.status === 'PENDING').length;

  // Éléments à traiter
  const suspendedAddresses = addresses.filter((a) => a.status === 'SUSPENDED');
  const addressesWithoutPhoto = addresses.filter((a) => a.status === 'ACTIVE' && !a.photoUrl);
  const hasThingsToProcess =
    suspendedAddresses.length > 0 || addressesWithoutPhoto.length > 0 || pendingCount > 0;

  // Adresses récentes (triées par date de création descendante)
  const recentAddresses = [...addresses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <ConnectedLayout>
      {/* Salutation et En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#766B5B]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
            Bonjour, {firstName} !
          </h1>
          <p className="text-xs sm:text-sm text-[#5C4D44] leading-relaxed">
            Vue d'ensemble de vos adresses géolocalisées et de vos actions en cours.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/addresses/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#8A3112] text-white text-xs font-bold transition shadow-sm touch-target"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nouvelle adresse</span>
          </Link>
          <Link
            to="/addresses/mine"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15] text-xs font-bold transition shadow-sm touch-target"
          >
            <span>Voir mes adresses</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#5C4D44]" />
          </Link>
        </div>
      </div>

      {/* État de chargement avec hauteur réservée pour CLS */}
      {loading ? (
        <div className="space-y-6 min-h-[500px]" aria-label="Chargement du tableau de bord">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28" count={4} />
          </div>
          <Skeleton className="h-44" />
          <Skeleton className="h-64" />
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs sm:text-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(false)}
            className="px-3 py-1.5 rounded-lg bg-[#991B1B] text-white text-xs font-bold shrink-0 hover:bg-[#7F1D1D] transition"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* =========================================================================
           * 1. Tuiles Métriques (4 indicateurs réels)
           * ========================================================================= */}
          <section aria-label="Indicateurs clés">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatTile
                label="Adresses actives"
                value={activeCount}
                sublabel={activeCount <= 1 ? 'Adresse validée' : 'Adresses validées'}
                icon={MapPin}
                to="/addresses/mine?status=ACTIVE"
                variant="success"
                dataTestId="stat-active"
              />
              <StatTile
                label="Signalées"
                value={suspendedCount}
                sublabel={suspendedCount === 0 ? 'Aucun signalement' : 'Action requise'}
                icon={ShieldAlert}
                to="/addresses/mine?status=SUSPENDED"
                variant={suspendedCount > 0 ? 'alert' : 'neutral'}
                dataTestId="stat-suspended"
              />
              <StatTile
                label="Archivées"
                value={archivedCount}
                sublabel="Non visibles en public"
                icon={Archive}
                to="/addresses/mine?status=ARCHIVED"
                variant="neutral"
                dataTestId="stat-archived"
              />
              <StatTile
                label="En attente synchro"
                value={pendingCount}
                sublabel={
                  pendingCount === 0 ? 'Toutes synchronisées' : 'Enregistrées localement'
                }
                icon={Clock}
                to="/addresses/mine?filter=pending"
                variant={pendingCount > 0 ? 'warning' : 'neutral'}
                dataTestId="stat-pending"
              />
            </div>
          </section>

          {/* =========================================================================
           * 2. Bloc « À traiter »
           * ========================================================================= */}
          <section aria-label="Actions à traiter">
            <Card padding="md" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#766B5B]/30">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#231A15]">
                    À traiter
                  </h2>
                  {hasThingsToProcess && (
                    <span className="w-2 h-2 rounded-full bg-[#B84A24] animate-pulse" />
                  )}
                </div>
                <span className="text-xs text-[#5C4D44] font-medium">
                  {hasThingsToProcess
                    ? 'Points nécessitant votre attention'
                    : 'Aucune action requise'}
                </span>
              </div>

              {!hasThingsToProcess ? (
                <div className="p-4 sm:p-5 rounded-lg bg-[#F2ECE1] border border-[#766B5B]/30 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#2A6B44]/10 text-[#2A6B44] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#231A15]">
                      Tout est à jour !
                    </p>
                    <p className="text-xs text-[#5C4D44]">
                      Toutes vos adresses sont actives, illustrées et synchronisées avec le serveur.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Alerte 1 : Adresses suspendues / modérées */}
                  {suspendedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3.5 sm:p-4 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#DC2626]/10 text-[#991B1B] flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#231A15]">
                              {addr.code}
                            </span>
                            <StatusBadge status="SUSPENDED" size="sm" />
                          </div>
                          <p className="text-[#991B1B] leading-relaxed">
                            {addr.moderationNotice
                              ? `Motif de modération : ${addr.moderationNotice}`
                              : "Cette adresse est suspendue suite à un signalement. Elle n'est plus accessible en public."}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/addresses/${addr.id}/edit`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DC2626]/40 bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#991B1B] font-bold shrink-0 touch-target"
                      >
                        <span>Corriger l'adresse</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}

                  {/* Alerte 2 : Adresses sans photo */}
                  {addressesWithoutPhoto.slice(0, 2).map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3.5 sm:p-4 rounded-lg bg-[#F2ECE1] border border-[#766B5B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#12304F]/10 text-[#12304F] flex items-center justify-center shrink-0 mt-0.5">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#231A15]">
                              {addr.code}
                            </span>
                            <span className="text-[#5C4D44] font-medium">
                              — {getLocationTypeLabel(addr.locationType)} à {addr.quartier}
                            </span>
                          </div>
                          <p className="text-[#5C4D44]">
                            Aucune photo de façade. Une photo facilite l'identification sur le terrain par les livreurs et visiteurs.
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/addresses/${addr.id}/edit`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15] font-bold shrink-0 touch-target"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ajouter une photo</span>
                      </Link>
                    </div>
                  ))}

                  {/* Alerte 3 : Brouillons hors ligne en attente de synchro */}
                  {pendingCount > 0 && (
                    <div className="p-3.5 sm:p-4 rounded-lg bg-[#FFF7ED] border border-[#8A3112]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#8A3112]/10 text-[#8A3112] flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-[#231A15]">
                            {pendingCount === 1
                              ? '1 adresse enregistrée hors ligne en attente'
                              : `${pendingCount} adresses enregistrées hors ligne en attente`}
                          </p>
                          <p className="text-[#5C4D44]">
                            {isOnline
                              ? 'Vous êtes connecté à Internet. Vous pouvez synchroniser vos adresses dès maintenant.'
                              : 'Rebranchez votre connexion Internet pour transmettre vos adresses au serveur.'}
                          </p>
                        </div>
                      </div>
                      {isOnline && (
                        <button
                          type="button"
                          disabled={isSyncing}
                          onClick={handleSyncNow}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#B84A24] hover:bg-[#8A3112] text-white font-bold shrink-0 touch-target disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                          />
                          <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </section>

          {/* =========================================================================
           * 3. Adresses Récentes (avec plaques réelles)
           * ========================================================================= */}
          <section aria-label="Adresses récentes">
            <Card padding="md" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#766B5B]/30">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#231A15]">
                    Adresses récentes
                  </h2>
                  <p className="text-xs text-[#5C4D44]">
                    Dernières adresses enregistrées sur votre compte
                  </p>
                </div>
                {addresses.length > 0 && (
                  <Link
                    to="/addresses/mine"
                    className="text-xs font-bold text-[#12304F] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Voir l'ensemble ({addresses.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {recentAddresses.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[#F2ECE1] border border-[#766B5B]/30 space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-[#231A15]">
                    Vous n'avez pas encore créé d'adresse.
                  </p>
                  <p className="text-xs text-[#5C4D44]">
                    Commencez par géolocaliser votre maison, commerce ou institution en quelques clics.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/addresses/new"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B84A24] hover:bg-[#8A3112] text-white text-xs font-bold transition shadow-sm touch-target"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Créer ma première adresse</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {recentAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl border border-[#766B5B] bg-[#F2ECE1] flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <StatusBadge status={addr.status} size="sm" />
                          <span className="text-[11px] text-[#5C4D44] font-medium">
                            {new Date(addr.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {/* Plaque miniature */}
                        <div className="my-2">
                          <AddressPlate
                            code={addr.code}
                            zone={addr.zone}
                            type={addr.locationType}
                            size="sm"
                            showCopy={false}
                          />
                        </div>
                        <p className="text-xs text-[#5C4D44] line-clamp-2 mt-2">
                          {addr.description || 'Aucune description'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#766B5B]/30 flex items-center justify-between text-xs">
                        <Link
                          to={`/a/${addr.code}`}
                          className="font-bold text-[#12304F] hover:underline inline-flex items-center gap-1 touch-target"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Fiche publique</span>
                        </Link>
                        <Link
                          to={`/addresses/${addr.id}/edit`}
                          className="font-semibold text-[#5C4D44] hover:text-[#231A15] touch-target"
                        >
                          Modifier
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </div>
      )}
    </ConnectedLayout>
  );
};

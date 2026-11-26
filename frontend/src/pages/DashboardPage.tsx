import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { useToast } from '../components/Toast';
import { ConnectedLayout } from '../components/ConnectedLayout';
import {
  Card,
  StatTile,
  StatusBadge,
  Skeleton,
  ErrorState,
  EmptyState,
} from '../components/ui';
import { AddressPlate } from '../components/AddressPlate';
import { NeighborhoodTag } from '../components/shared/NeighborhoodTag';
import { useDashboardData } from '../features/dashboard/useDashboardData';
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
  ExternalLink,
  WifiOff,
  Database,
  Globe,
  Lock,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    addresses,
    drafts,
    activeReservedCodesCount,
    loading,
    isSyncing,
    errorMsg,
    isSessionExpired,
    reload,
    triggerSync,
  } = useDashboardData();

  const firstName = user?.fullName ? user.fullName.trim().split(' ')[0] : 'vous';

  const handleSyncNow = async () => {
    await triggerSync();
    showToast('Synchronisation terminée.', 'info');
  };

  // Métriques 100 % réelles issues de l'API et d'IndexedDB
  const activeCount = addresses.filter((a) => a.status === 'ACTIVE').length;
  const suspendedCount = addresses.filter((a) => a.status === 'SUSPENDED').length;
  const archivedCount = addresses.filter((a) => a.status === 'ARCHIVED').length;
  const pendingCount = drafts.filter((d) => d.status === 'PENDING' || d.status === 'FAILED').length;

  // Points réels nécessitant une attention
  const suspendedAddresses = addresses.filter((a) => a.status === 'SUSPENDED');
  const addressesWithoutPhoto = addresses.filter((a) => a.status === 'ACTIVE' && !a.photoUrl);
  const hasThingsToProcess =
    suspendedAddresses.length > 0 || addressesWithoutPhoto.length > 0 || pendingCount > 0;

  // 3 dernières adresses créées
  const recentAddresses = [...addresses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <ConnectedLayout>
      {/* En-tête personnalisé */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight">
              Tableau de bord — Bonjour, {firstName} !
            </h1>
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-soft border border-warning-border text-warning text-xs font-semibold">
                <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Hors ligne</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            Vue d'ensemble de vos adresses géolocalisées, de vos brouillons hors ligne et de vos actions en cours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            to="/addresses/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse text-xs sm:text-sm font-semibold transition-colors shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            <span>Nouvelle adresse</span>
          </Link>
          <Link
            to="/addresses/mine"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
          >
            <span>Voir mes adresses</span>
            <ArrowRight className="w-4 h-4 text-ink-muted" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Chargement / Erreur / Contenu */}
      {loading ? (
        <div
          className="space-y-6 min-h-[680px]"
          aria-busy="true"
          aria-label="Chargement du tableau de bord"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Skeleton className="h-28 rounded-2xl" count={4} />
          </div>
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : errorMsg ? (
        <div className="space-y-5">
          <ErrorState
            errorCode={isSessionExpired ? 401 : undefined}
            title={isSessionExpired ? 'Session expirée' : 'Impossible de charger vos adresses'}
            description={errorMsg}
            onRetry={
              isSessionExpired
                ? () => navigate('/login', { state: { from: location, sessionExpired: true } })
                : reload
            }
            retryLabel={isSessionExpired ? 'Se reconnecter' : 'Réessayer'}
            homeTo="/"
          />

          {/* Même en cas d'erreur API, afficher les brouillons locaux en attente s'il y en a */}
          {pendingCount > 0 && (
            <div className="p-4 rounded-2xl bg-warning-soft border border-warning-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5 text-warning">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Vous avez <strong>{pendingCount}</strong>{' '}
                  {pendingCount > 1 ? 'adresses enregistrées' : 'adresse enregistrée'} localement sur cet appareil en attente d'envoi.
                </span>
              </div>
              <Link
                to="/addresses/mine?filter=pending"
                className="inline-flex items-center gap-1.5 font-semibold text-warning hover:underline shrink-0"
              >
                <span>Consulter la file locale</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Indicateurs clés réels (4 StatTiles) */}
          <section aria-label="Indicateurs clés">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatTile
                label="Adresses actives"
                value={activeCount}
                sublabel={activeCount <= 1 ? 'Visible via son code' : 'Visibles via leur code'}
                icon={MapPin}
                to="/addresses/mine?status=ACTIVE"
                variant="success"
                dataTestId="stat-active"
              />
              <StatTile
                label="Suspendues"
                value={suspendedCount}
                sublabel="Retirées de la vue publique"
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
                sublabel={pendingCount === 0 ? 'Toutes synchronisées' : 'Enregistrées localement'}
                icon={Clock}
                to="/addresses/mine?filter=pending"
                variant={pendingCount > 0 ? 'warning' : 'neutral'}
                dataTestId="stat-pending"
              />
            </div>
          </section>

          {/* 2. Bloc « À traiter » */}
          <section aria-label="Actions à traiter">
            <Card padding="md" className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border flex-wrap">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-ink">À traiter</h2>
                  {hasThingsToProcess && (
                    <span
                      className="w-2 h-2 rounded-full bg-brand"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="text-xs text-ink-muted font-medium">
                  {hasThingsToProcess
                    ? 'Points nécessitant votre attention'
                    : addresses.length === 0
                    ? 'Prêt à enregistrer votre première adresse'
                    : 'Aucune action requise'}
                </span>
              </div>

              {!hasThingsToProcess ? (
                <div className="p-4 sm:p-5 rounded-xl bg-surface border border-border flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-success-soft border border-success-border text-success flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-ink">
                      {addresses.length === 0
                        ? 'Votre compte est prêt'
                        : 'Tout est à jour !'}
                    </p>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {addresses.length === 0
                        ? 'Créez votre première adresse géolocalisée pour obtenir une plaque numérique et un QR Code.'
                        : 'Toutes vos adresses sont actives, illustrées et synchronisées avec le serveur.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Brouillons hors ligne en attente */}
                  {pendingCount > 0 && (
                    <div className="p-4 rounded-xl bg-warning-soft border border-warning-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-warning-border text-warning flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-ink">
                            {pendingCount === 1
                              ? '1 adresse enregistrée hors ligne en attente'
                              : `${pendingCount} adresses enregistrées hors ligne en attente`}
                          </p>
                          <p className="text-xs text-ink-secondary">
                            {isOnline
                              ? 'Vous êtes connecté à Internet. Vous pouvez synchroniser vos adresses maintenant.'
                              : 'Reconnectez-vous à Internet pour transmettre vos adresses au serveur.'}
                          </p>
                        </div>
                      </div>
                      {isOnline ? (
                        <button
                          type="button"
                          disabled={isSyncing}
                          onClick={handleSyncNow}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-ink-inverse text-xs font-semibold shrink-0 min-h-[40px] disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                            aria-hidden="true"
                          />
                          <span>{isSyncing ? 'Synchronisation…' : 'Synchroniser maintenant'}</span>
                        </button>
                      ) : (
                        <Link
                          to="/addresses/mine?filter=pending"
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-warning-border bg-surface-elevated text-warning text-xs font-semibold shrink-0 min-h-[40px]"
                        >
                          <span>Voir la file</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Adresses suspendues par la modération */}
                  {suspendedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl bg-danger-soft border border-danger-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-danger-border text-danger flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-ink">{addr.code}</span>
                            <StatusBadge status="SUSPENDED" size="sm" />
                          </div>
                          <p className="text-xs text-danger leading-relaxed">
                            {addr.moderationNotice
                              ? `Motif de modération : ${addr.moderationNotice}`
                              : "Cette adresse est suspendue suite à un signalement. Elle n'est plus accessible en public."}
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/addresses/mine?status=SUSPENDED"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-danger-border bg-surface-elevated hover:bg-surface text-danger text-xs font-semibold shrink-0 min-h-[40px] transition-colors"
                      >
                        <span>Voir les détails</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  ))}

                  {/* Adresses actives sans photo de façade (2 max pour éviter la surcharge) */}
                  {addressesWithoutPhoto.slice(0, 2).map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-institution-soft border border-institution-border text-institution flex items-center justify-center shrink-0">
                          <Camera className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-ink">{addr.code}</span>
                            <span className="text-xs text-ink-muted font-medium">
                              · {getLocationTypeLabel(addr.locationType)} à {addr.quartier}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted leading-relaxed">
                            Aucune photo de façade. Une photo aide les visiteurs et livreurs à reconnaître votre entrée.
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/addresses/${addr.id}/edit`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-strong bg-surface-elevated hover:bg-surface text-ink text-xs font-semibold shrink-0 min-h-[40px] transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-institution" aria-hidden="true" />
                        <span>Ajouter une photo</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* 3. Adresses récentes */}
          <section aria-label="Adresses récentes">
            <Card padding="md" className="space-y-4">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-border flex-wrap">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-ink">Adresses récentes</h2>
                  <p className="text-xs text-ink-muted">
                    Dernières adresses enregistrées sur votre compte
                  </p>
                </div>
                {addresses.length > 0 && (
                  <Link
                    to="/addresses/mine"
                    className="text-xs sm:text-sm font-semibold text-institution hover:text-institution-hover inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Voir l'ensemble ({addresses.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>

              {recentAddresses.length === 0 ? (
                <EmptyState
                  illustration="/images/etat-vide-144w.webp"
                  illustrationSrcSet="/images/etat-vide-144w.webp 144w, /images/etat-vide-320w.webp 320w, /images/etat-vide-480w.webp 480w"
                  illustrationSizes="(max-width: 640px) 112px, 144px"
                  title="Vous n'avez pas encore créé d'adresse"
                  description="Géolocalisez votre maison, commerce ou institution pour recevoir une plaque d'adresse permanente et un QR Code."
                  action={{
                    label: 'Créer ma première adresse',
                    to: '/addresses/new',
                    icon: Plus,
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {recentAddresses.map((addr) => {
                    const isActive = addr.status === 'ACTIVE';
                    return (
                      <article
                        key={addr.id}
                        className="p-4 rounded-2xl border border-border bg-surface hover:border-border-strong transition-colors flex flex-col justify-between gap-3.5"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <StatusBadge status={addr.status} size="sm" />
                            <span className="text-[11px] text-ink-muted font-mono">
                              {new Date(addr.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>

                          <AddressPlate
                            code={addr.code}
                            zone={addr.zone}
                            type={addr.locationType}
                            size="sm"
                            showCopy={false}
                          />

                          <div className="flex items-center gap-2 flex-wrap">
                            <NeighborhoodTag
                              quartierCode={addr.quartier}
                              zoneCode={addr.zone}
                              showIcon={false}
                            />
                            {addr.listed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-institution-soft border border-institution-border text-institution text-[11px] font-semibold">
                                <Globe className="w-3 h-3" aria-hidden="true" />
                                <span>Annuaire</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-elevated border border-border text-ink-muted text-[11px] font-medium">
                                <Lock className="w-3 h-3" aria-hidden="true" />
                                <span>Privée</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                            {addr.description || 'Aucune description renseignée.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
                          {isActive ? (
                            <Link
                              to={`/a/${addr.code}`}
                              className="font-semibold text-institution hover:text-institution-hover inline-flex items-center gap-1 py-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Fiche publique</span>
                            </Link>
                          ) : (
                            <span className="text-ink-subtle font-medium">Fiche indisponible</span>
                          )}

                          {isActive && (
                            <Link
                              to={`/addresses/${addr.id}/edit`}
                              className="font-semibold text-ink-secondary hover:text-ink py-1"
                            >
                              Modifier
                            </Link>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </Card>
          </section>

          {/* 4. Accès rapides utiles (Mode hors ligne & Administration si rôle ADMIN) */}
          <section aria-label="Accès rapides" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-elevated border border-border shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-institution-soft border border-institution-border text-institution flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-sm font-bold text-ink">Préparation hors ligne</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    <span className="font-mono font-bold text-ink">{activeReservedCodesCount}</span>{' '}
                    {activeReservedCodesCount > 1 ? 'codes pré-réservés disponibles' : 'code pré-réservé disponible'} sur cet appareil.
                  </p>
                </div>
              </div>
              <Link
                to="/account?tab=offline"
                className="inline-flex items-center gap-1 text-xs font-semibold text-institution hover:text-institution-hover shrink-0 py-1.5 px-2.5 rounded-lg hover:bg-surface transition-colors"
              >
                <span>Gérer</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            {user?.role === 'ADMIN' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-elevated border border-institution-border shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-border text-brand flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm font-bold text-ink">Modération des signalements</h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Accédez à la file des signalements publics et aux actions administratives.
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover shrink-0 py-1.5 px-2.5 rounded-lg hover:bg-brand-soft transition-colors"
                >
                  <span>Ouvrir</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>
        </div>
      )}
    </ConnectedLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AddressPlate } from '../components/AddressPlate';
import { getMyAddresses } from '../api/addressApi';
import type { AddressResponse } from '../api/addressApi';
import {
  Plus,
  ExternalLink,
  Compass,
  FileCode,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  BookOpen,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [recentAddresses, setRecentAddresses] = useState<AddressResponse[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const demoCode = import.meta.env.VITE_DEMO_CODE || 'ZIG-KBG-8454';
  const apiDocsUrl = import.meta.env.VITE_API_DOCS_URL || '';

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingAddresses(true);
      getMyAddresses()
        .then((data) => {
          setRecentAddresses(data.slice(0, 3));
          setAddressError(null);
        })
        .catch(() => {
          setAddressError('Impossible de charger vos adresses récentes.');
        })
        .finally(() => {
          setLoadingAddresses(false);
        });
    }
  }, [isAuthenticated]);

  const runtimeBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '');
  const curlCommand = `curl -s ${runtimeBaseUrl}/api/addresses/${demoCode}`;

  const handleCopyCurl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(curlCommand);
    }
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  /* =========================================================================
   * B) VUE UTILISATEUR CONNECTÉ : PAS DE PAGE DE VENTE
   * ========================================================================= */
  if (isAuthenticated) {
    const firstName = user?.fullName?.split(' ')[0] || 'vous';

    return (
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* En-tête de bienvenue */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-[#766B5B]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
              Bonjour {firstName}
            </h1>
            <p className="text-sm text-[#5C4D44] mt-1">
              Retrouvez vos adresses récentes et gérez vos plaques de repérage.
            </p>
          </div>

          <Link
            to="/addresses/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-sm touch-target shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle adresse</span>
          </Link>
        </div>

        {/* Section Adresses Récentes */}
        <section aria-labelledby="recent-addresses-heading" className="space-y-6">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <h2 id="recent-addresses-heading" className="text-base sm:text-lg font-bold text-[#231A15] truncate">
              Vos adresses récentes
            </h2>
            <Link
              to="/addresses/mine"
              className="text-xs sm:text-sm font-bold text-[#1D528F] hover:underline shrink-0"
            >
              Tout voir
            </Link>
          </div>

          {loadingAddresses ? (
            <div className="p-8 rounded-xl bg-[#FBF7EF] border border-[#766B5B] text-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#1D528F] mx-auto" />
              <p className="text-xs text-[#5C4D44]">Chargement de vos adresses...</p>
            </div>
          ) : addressError ? (
            <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{addressError}</span>
            </div>
          ) : recentAddresses.length === 0 ? (
            /* État vide connecté identique */
            <div className="p-8 sm:p-12 text-center rounded-xl bg-[#FBF7EF] border border-[#766B5B] shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#F2ECE1] border border-[#766B5B] flex items-center justify-center text-[#8A3112] mx-auto">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#231A15]">Vous n'avez pas encore d'adresse.</h3>
                <p className="text-xs text-[#5C4D44] max-w-sm mx-auto">
                  Pour réussir votre enregistrement, placez-vous devant l'entrée de votre bâtiment et assurez-vous que le GPS de votre appareil est actif.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm flex flex-col justify-between gap-3"
                >
                  <AddressPlate
                    code={addr.code}
                    zone={addr.zone}
                    type={addr.locationType}
                    size="sm"
                    className="w-full"
                  />
                  <p className="text-xs text-[#231A15] font-medium line-clamp-2 leading-relaxed">
                    {addr.description}
                  </p>
                  <div className="pt-2 border-t border-[#766B5B] flex items-center justify-between text-xs">
                    <span className="text-[#5C4D44] text-[11px]">
                      {new Date(addr.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <Link
                      to={`/a/${addr.code}`}
                      className="text-[#1D528F] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Voir la fiche</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  /* =========================================================================
   * A) VUE VISITEUR NON CONNECTÉ : PAGE DE PRÉSENTATION COMPLÈTE
   * ========================================================================= */
  return (
    <div className="flex-1 w-full flex flex-col">
      {/* ---------------------------------------------------------------------
       * 1. BANDEAU D'OUVERTURE : Bleu nuit avec image d'ambiance et plaque d'adresse
       * --------------------------------------------------------------------- */}
      <section className="relative w-full border-b border-[#766B5B] bg-[#12304F] text-[#FBF7EF] overflow-hidden">
        {/* Image héros WebP d'ambiance responsive */}
        <img
          src="/images/hero-accueil-800w.webp"
          srcSet="/images/hero-accueil-480w.webp 480w, /images/hero-accueil-800w.webp 800w, /images/hero-accueil-1280w.webp 1280w"
          sizes="100vw"
          width="1280"
          height="853"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-right md:object-center pointer-events-none"
        />

        {/* Voile uni Bleu nuit d'opacité minimale garantissant WCAG AA >= 4.5:1 sur zone réelle */}
        <div className="absolute inset-0 bg-[#12304F]/65 pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Texte et actions du bandeau d'ouverture */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#FBF7EF] leading-tight">
                Une adresse pour votre maison, même sans nom de rue
              </h1>
              <p className="text-xs sm:text-sm text-[#EADFC8] leading-relaxed">
                Transformez vos repères oraux du quotidien en un code d'adresse clair, mémorisable et géolocalisé. Partagez votre position en un instant avec vos proches et vos livreurs.
              </p>
              
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Bouton principal sur fond sombre : jaune soleil avec texte encre */}
                <Link
                  to="/addresses/new"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#F2B233] hover:bg-[#DDA025] text-[#231A15] text-xs sm:text-sm font-bold transition shadow-sm touch-target cursor-pointer"
                >
                  <span>Créer mon adresse</span>
                </Link>

                {demoCode && (
                  <Link
                    to={`/a/${demoCode}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#FBF7EF]/40 bg-[#FBF7EF]/10 hover:bg-[#FBF7EF]/20 text-[#FBF7EF] text-xs sm:text-sm font-bold transition touch-target"
                  >
                    <ExternalLink className="w-4 h-4 text-[#FBF7EF]" />
                    <span>Voir une fiche d'exemple</span>
                  </Link>
                )}

                <Link
                  to="/annuaire"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#FBF7EF]/40 bg-[#FBF7EF]/10 hover:bg-[#FBF7EF]/20 text-[#FBF7EF] text-xs sm:text-sm font-bold transition touch-target"
                >
                  <BookOpen className="w-4 h-4 text-[#FBF7EF]" />
                  <span>Consulter l'annuaire</span>
                </Link>
              </div>

              <p className="text-xs text-[#EADFC8] pt-1">
                Fonctionne aussi hors ligne : capturez vos adresses sur le terrain, elles seront transmises dès votre retour sur le réseau.
              </p>
            </div>

            {/* Plaque d'adresse mise en valeur avec bague crème pour la détacher du fond bleu nuit */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF7EF] border-2 border-[#766B5B] shadow-md inline-flex flex-col items-center">
                <AddressPlate
                  code="ZIG-KBG-4271"
                  zone="ZIG"
                  type="MAISON"
                  size="lg"
                  isExample={true}
                  animated={true}
                  className="w-full max-w-sm"
                />
                <span className="text-[11px] font-semibold text-[#5C4D44] mt-2.5">
                  Plaque de repérage géolocalisée · Ziguinchor
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
       * 2. CADRE AVANT / APRÈS : Le repère oral vs la plaque numérique
       * --------------------------------------------------------------------- */}
      <section className="w-full border-b border-[#766B5B] bg-[#EADFC8] py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#231A15] tracking-tight">
              Avant &amp; Après SamaAdresse
            </h2>
            <p className="text-xs sm:text-sm text-[#5C4D44]">
              Remplacer les repères oraux approximatifs par une identification claire et permanente.
            </p>
          </div>

          <div className="rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#766B5B] items-stretch">
              {/* Moitié gauche : Avant, le repère oral */}
              <div className="p-4 sm:p-5 bg-[#F2ECE1] flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#5C4D44]">
                    Avant : le repère oral
                  </span>
                  <span className="text-xs text-[#8A3112] font-semibold bg-[#FBF7EF] px-2 py-0.5 rounded border border-[#766B5B]">
                    Approximatif
                  </span>
                </div>

                <blockquote className="text-sm sm:text-base font-medium text-[#231A15] italic leading-relaxed border-l-2 border-[#766B5B] pl-3.5 my-auto py-1">
                  « Après la grande mosquée, troisième maison à gauche, portail métallique vert. »
                </blockquote>

                <p className="text-xs text-[#5C4D44] leading-relaxed">
                  Imprécis, difficile à transmettre par message, introuvable dans les applications de navigation et sujet aux erreurs de guidage.
                </p>
              </div>

              {/* Moitié droite : Après, la plaque SamaAdresse */}
              <div className="p-4 sm:p-5 bg-[#FBF7EF] flex flex-col justify-between gap-3">
                <div className="w-full flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#1D528F]">
                    Après : la plaque SamaAdresse
                  </span>
                  <span className="text-[11px] sm:text-xs text-[#2A6B44] font-semibold bg-[#2A6B44]/10 px-2 py-0.5 rounded border border-[#2A6B44]/30 shrink-0 whitespace-nowrap">
                    Géolocalisé &amp; Permanent
                  </span>
                </div>

                <div className="w-full py-1 flex justify-center my-auto min-h-[120px] items-center">
                  <AddressPlate
                    code="ZIG-KBG-4271"
                    zone="ZIG"
                    type="MAISON"
                    size="md"
                    isExample={true}
                    className="w-full max-w-xs"
                  />
                </div>

                <p className="text-xs text-[#5C4D44] leading-relaxed text-center">
                  Lisible sur votre façade, utilisable directement avec GPS et partageable en un clic par lien ou QR code.
                </p>
              </div>
            </div>

            {/* Barre d'actions intégrée au bas du cadre */}
            <div className="px-4 py-3.5 sm:px-5 bg-[#F2ECE1] border-t border-[#766B5B] flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/addresses/new"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs sm:text-sm font-bold transition shadow-sm touch-target cursor-pointer"
                >
                  <span>Créer mon adresse</span>
                </Link>

                {demoCode && (
                  <Link
                    to={`/a/${demoCode}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#1D528F] text-xs sm:text-sm font-bold transition touch-target"
                  >
                    <ExternalLink className="w-4 h-4 text-[#1D528F]" />
                    <span>Voir une fiche d'exemple</span>
                  </Link>
                )}

                <Link
                  to="/annuaire"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#5C4D44] hover:text-[#231A15] text-xs sm:text-sm font-bold transition touch-target"
                >
                  <BookOpen className="w-4 h-4 text-[#1D528F]" />
                  <span>Consulter l'annuaire</span>
                </Link>
              </div>

              <p className="text-xs text-[#5C4D44] pt-0.5">
                Fonctionne aussi hors ligne : capturez vos adresses sur le terrain, elles seront transmises dès votre retour sur le réseau.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
       * 3. COMMENT ÇA MARCHE : 3 étapes simples et reliées
       * --------------------------------------------------------------------- */}
      <section className="w-full border-b border-[#766B5B] bg-[#FBF7EF] py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#231A15] tracking-tight">
              Comment ça marche
            </h2>
            <p className="text-xs sm:text-sm text-[#5C4D44]">
              Trois étapes simples et ordonnées pour obtenir et utiliser votre adresse.
            </p>
          </div>

          {/* 3 cartes d'étapes avec visuels d'ambiance et texte réel */}
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Étape 1 */}
            <li className="flex flex-col rounded-2xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm overflow-hidden">
              <div className="h-44 sm:h-48 bg-[#F2ECE1] overflow-hidden border-b border-[#766B5B]/30">
                <img
                  src="/images/etape-1-localiser-480w.webp"
                  srcSet="/images/etape-1-localiser-320w.webp 320w, /images/etape-1-localiser-480w.webp 480w, /images/etape-1-localiser-800w.webp 800w"
                  sizes="(max-width: 768px) 100vw, 320px"
                  width="480"
                  height="480"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-5 flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#B84A24] text-[#FBF7EF] font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-[#231A15] leading-snug">
                    Capturer la position
                  </h3>
                </div>
                <p className="text-xs text-[#5C4D44] leading-relaxed">
                  Relevez votre position par signal GPS directement devant l'entrée de votre bâtiment ou saisissez vos coordonnées manuellement.
                </p>
              </div>
            </li>

            {/* Étape 2 */}
            <li className="flex flex-col rounded-2xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm overflow-hidden">
              <div className="h-44 sm:h-48 bg-[#F2ECE1] overflow-hidden border-b border-[#766B5B]/30">
                <img
                  src="/images/etape-2-plaque-480w.webp"
                  srcSet="/images/etape-2-plaque-320w.webp 320w, /images/etape-2-plaque-480w.webp 480w, /images/etape-2-plaque-800w.webp 800w"
                  sizes="(max-width: 768px) 100vw, 320px"
                  width="480"
                  height="480"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-5 flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#1D528F] text-[#FBF7EF] font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-[#231A15] leading-snug">
                    Obtenir un code et une plaque avec QR
                  </h3>
                </div>
                <p className="text-xs text-[#5C4D44] leading-relaxed">
                  Le système associe un code unique rattaché à votre quartier et génère une plaque de repérage numérique prête à l'emploi.
                </p>
              </div>
            </li>

            {/* Étape 3 */}
            <li className="flex flex-col rounded-2xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm overflow-hidden">
              <div className="h-44 sm:h-48 bg-[#F2ECE1] overflow-hidden border-b border-[#766B5B]/30">
                <img
                  src="/images/etape-3-partager-480w.webp"
                  srcSet="/images/etape-3-partager-320w.webp 320w, /images/etape-3-partager-480w.webp 480w, /images/etape-3-partager-800w.webp 800w"
                  sizes="(max-width: 768px) 100vw, 320px"
                  width="480"
                  height="480"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-5 flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#2A6B44] text-[#FBF7EF] font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-[#231A15] leading-snug">
                    Partager le lien ou le QR pour être retrouvé
                  </h3>
                </div>
                <p className="text-xs text-[#5C4D44] leading-relaxed">
                  Transmettez votre fiche en un clic par lien direct ou QR code imprimé pour guider vos visiteurs jusqu'au pas de votre porte.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
       * 4. À QUOI SERT VOTRE ADRESSE : 3 usages différenciés
       * --------------------------------------------------------------------- */}
      <section className="w-full border-b border-[#766B5B] bg-[#EADFC8] py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#231A15] tracking-tight">
              À quoi sert votre adresse
            </h2>
            <p className="text-xs sm:text-sm text-[#5C4D44]">
              Des situations concrètes où un code lisible remplace avantageusement de longues explications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
            {/* Usage 1 */}
            <div className="md:col-span-2 p-4 sm:p-5 rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm flex flex-col justify-between space-y-2.5">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#1D528F] bg-[#1D528F]/10 px-2 py-0.5 rounded border border-[#1D528F]/20 inline-block">
                  Usage principal
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#231A15] tracking-tight">
                  Se faire livrer à domicile
                </h3>
                <p className="text-xs sm:text-sm text-[#5C4D44] leading-relaxed">
                  Recevez vos commandes, colis et achats directement devant votre porte. En fournissant votre code SamaAdresse, le livreur accède à vos coordonnées GPS et à la photo de votre façade, sans avoir à vous rappeler plusieurs fois pour s'orienter.
                </p>
              </div>

              <div className="pt-2 border-t border-[#766B5B] flex items-center gap-2 text-xs font-medium text-[#231A15]">
                <CheckCircle2 className="w-4 h-4 text-[#2A6B44]" />
                <span>Gain de temps pour vous et votre livreur</span>
              </div>
            </div>

            {/* Usage 2 & 3 */}
            <div className="flex flex-col gap-3">
              <div className="p-3.5 sm:p-4 rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm flex-1 flex flex-col justify-between space-y-1.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#231A15] mb-0.5">
                    Indiquer sa position à un proche, un taxi ou un prestataire
                  </h3>
                  <p className="text-[11px] text-[#5C4D44] leading-relaxed">
                    Un simple code de 10 caractères sans les tirets (12 avec) suffit pour guider n'importe quel visiteur avec un itinéraire direct.
                  </p>
                </div>
                <div className="text-[11px] text-[#1D528F] font-semibold pt-1 border-t border-[#766B5B]">
                  Itinéraire calculé en un clic
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm flex-1 flex flex-col justify-between space-y-1.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#231A15] mb-0.5">
                    Renseigner son adresse lors d'une inscription en ligne
                  </h3>
                  <p className="text-[11px] text-[#5C4D44] leading-relaxed">
                    Remplissez les formulaires administratifs ou commerciaux demandant une référence d'adresse locale.
                  </p>
                </div>
                <div className="text-[11px] text-[#1D528F] font-semibold pt-1 border-t border-[#766B5B]">
                  Format textuel compact et pérenne
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
       * 5. LIRE UN CODE : La plaque annotée
       * --------------------------------------------------------------------- */}
      <section className="w-full border-b border-[#766B5B] bg-[#FBF7EF] py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="max-w-2xl space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
              Lire un code
            </h2>
            <p className="text-sm text-[#5C4D44]">
              Chaque adresse est découpée en 3 segments clairs et immédiatement identifiables.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#F2ECE1] border border-[#766B5B] shadow-sm space-y-5">
            {/* Décomposition visuelle */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center">
              <div className="p-3.5 rounded-xl bg-[#FBF7EF] border-2 border-[#1D528F] min-w-[140px] shadow-sm">
                <div className="text-2xl font-mono font-extrabold text-[#1D528F]">ZIG</div>
                <div className="text-xs font-bold text-[#231A15] mt-1">la zone (la ville)</div>
              </div>

              <span className="text-xl font-mono text-[#766B5B] hidden sm:inline">-</span>

              <div className="p-3.5 rounded-xl bg-[#FBF7EF] border-2 border-[#1D528F] min-w-[140px] shadow-sm">
                <div className="text-2xl font-mono font-extrabold text-[#1D528F]">KBG</div>
                <div className="text-xs font-bold text-[#231A15] mt-1">le quartier</div>
              </div>

              <span className="text-xl font-mono text-[#766B5B] hidden sm:inline">-</span>

              <div className="p-3.5 rounded-xl bg-[#FBF7EF] border-2 border-[#1D528F] min-w-[140px] shadow-sm">
                <div className="text-2xl font-mono font-extrabold text-[#1D528F]">4271</div>
                <div className="text-xs font-bold text-[#231A15] mt-1">un numéro propre à l'adresse, tiré au hasard</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#FBF7EF] border border-[#766B5B] text-center max-w-xl mx-auto">
              <p className="text-xs sm:text-sm text-[#231A15] font-medium leading-relaxed">
                Le code ne change jamais une fois créé : il reste attaché de manière permanente à la position physique du lieu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
       * 6. CE QUE VOUS OBTENEZ : Liste simple
       * --------------------------------------------------------------------- */}
      <section className="w-full border-b border-[#766B5B] bg-[#EADFC8] py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#231A15] tracking-tight">
              Ce que vous obtenez
            </h2>
            <p className="text-xs sm:text-sm text-[#5C4D44]">
              Des outils pratiques et directement utilisables pour chaque adresse enregistrée.
            </p>
          </div>

          <ul className="divide-y divide-[#766B5B] sm:divide-y-0 sm:grid sm:grid-cols-2 sm:gap-3 text-xs list-none p-0 m-0">
            <li className="py-3 sm:p-3 sm:rounded-lg sm:border sm:border-[#766B5B] sm:bg-[#FBF7EF] flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#2A6B44] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#231A15] block text-xs">Photo de la façade</strong>
                <span className="text-[#5C4D44] text-[11px]">Identification visuelle immédiate du lieu à l'arrivée.</span>
              </div>
            </li>

            <li className="py-3 sm:p-3 sm:rounded-lg sm:border sm:border-[#766B5B] sm:bg-[#FBF7EF] flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#2A6B44] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#231A15] block text-xs">Carte avec guidage GPS</strong>
                <span className="text-[#5C4D44] text-[11px]">Itinéraire calculé en un clic vers la position du lieu.</span>
              </div>
            </li>

            <li className="py-3 sm:p-3 sm:rounded-lg sm:border sm:border-[#766B5B] sm:bg-[#FBF7EF] flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#2A6B44] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#231A15] block text-xs">QR code téléchargeable</strong>
                <span className="text-[#5C4D44] text-[11px]">Scannable instantanément par tout smartphone sans application.</span>
              </div>
            </li>

            <li className="py-3 sm:p-3 sm:rounded-lg sm:border sm:border-[#766B5B] sm:bg-[#FBF7EF] flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#2A6B44] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#231A15] block text-xs">Plaque imprimable A4</strong>
                <span className="text-[#5C4D44] text-[11px]">Mise en page nette sans aplats d'encre pour impression de bureau.</span>
              </div>
            </li>

            <li className="py-3 sm:p-3 sm:rounded-lg sm:border sm:border-[#766B5B] sm:bg-[#FBF7EF] flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#2A6B44] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#231A15] block text-xs">Partage multicanal (WhatsApp, SMS, lien)</strong>
                <span className="text-[#5C4D44] text-[11px]">Transmission instantanée sans obliger le destinataire à créer un compte.</span>
              </div>
            </li>

            <li className="py-3 sm:p-3 sm:rounded-lg sm:border sm:border-[#766B5B] sm:bg-[#FBF7EF] flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#2A6B44] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#231A15] block text-xs">Consultation hors ligne</strong>
                <span className="text-[#5C4D44] text-[11px]">Les fiches que vous avez consultées restent lisibles sans connexion (position, description, photo).</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------------------
       * 7. POUR LES DÉVELOPPEURS : Requête curl et réponse JSON publique
       * --------------------------------------------------------------------- */}
      <section className="w-full border-b border-[#766B5B] bg-[#FBF7EF] py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#231A15] tracking-tight">
              Pour les développeurs
            </h2>
            <p className="text-xs sm:text-sm text-[#5C4D44]">
              Intégrez la résolution d'adresses géolocalisées directement dans vos applications via notre API REST publique.
            </p>
          </div>

          <div className="rounded-xl border border-[#766B5B] bg-[#231A15] text-[#FBF7EF] p-3.5 sm:p-4 space-y-2.5 overflow-hidden font-mono text-xs shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#5C4D44]">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#EADFC8]" />
                <span className="text-[#FBF7EF] font-sans font-bold text-xs">Requête API publique</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCurl}
                className="px-2 py-1 rounded bg-[#5C4D44] hover:bg-[#766B5B] text-[#FBF7EF] text-[11px] font-sans transition flex items-center gap-1 cursor-pointer"
                title="Copier la commande curl"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3 h-3 text-[#2A6B44]" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copier curl</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[#EADFC8] overflow-x-auto whitespace-nowrap pb-1 text-[11px]">
              <code>{curlCommand}</code>
            </div>

            <div className="pt-2 border-t border-[#5C4D44]">
              <div className="text-[11px] text-[#EADFC8] font-sans font-semibold mb-1">Exemple de réponse</div>
              <pre className="text-[#FBF7EF] overflow-x-auto whitespace-pre leading-tight text-[11px]">
{`{"code":"ZIG-KBG-8454","latitude":12.5785,"longitude":-16.2712,"zone":"ZIG","quartier":"KBG","description":"Boutique alimentation générale Chez Amadou, face au marché Saint-Maur","locationType":"COMMERCE","photoUrl":"/uploads/c9fff102-789d-453c-b1d2-4c1757278960.jpg","createdAt":"2026-10-15T10:09:29.236159Z"}`}
              </pre>
            </div>
          </div>

          {apiDocsUrl && (
            <div>
              <a
                href={apiDocsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#1D528F] hover:underline inline-flex items-center gap-1.5"
              >
                <span>Consulter la documentation interactive de l'API (Swagger)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------------
       * 8. APPEL FINAL : "Créer mon adresse" + "Se connecter"
       * --------------------------------------------------------------------- */}
      <section className="w-full bg-[#EADFC8] py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#231A15] tracking-tight">
            Prêt à créer l'adresse de votre logement ou commerce ?
          </h2>
          <p className="text-xs sm:text-sm text-[#5C4D44] max-w-xl mx-auto leading-relaxed">
            Obtenez votre code de localisation dès aujourd'hui en moins de deux minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/addresses/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs sm:text-sm font-bold transition shadow-sm touch-target cursor-pointer"
            >
              <span>Créer mon adresse</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15] text-xs sm:text-sm font-bold transition touch-target"
            >
              <span>Se connecter</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

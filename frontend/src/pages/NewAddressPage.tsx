import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { createAddress } from '../api/addressApi';
import type { LocationType, AddressResponse } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import { AddressMap } from '../components/AddressMap';
import { AddressPlate } from '../components/AddressPlate';
import { ShareAddress } from '../components/ShareAddress';
import { SegmentedPicker } from '../components/SegmentedPicker';
import { compressImage, formatFileSize } from '../utils/imageCompressor';
import {
  validateStep1Position,
  validateStep2Details,
  validateStep3Photo,
} from '../utils/formValidation';
import {
  Navigation,
  Loader2,
  Check,
  AlertCircle,
  AlertTriangle,
  Camera,
  Trash2,
  Download,
  Printer,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  WifiOff,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveQuartier } from '../utils/geoGrid';
import {
  getDraftsCount,
  saveDraft,
  getAvailableReservedCode,
  MAX_DRAFTS,
} from '../utils/offlineDb';
import type { OfflineDraft } from '../utils/offlineDb';
import { useOnlineStatus } from '../context/OnlineStatusContext';

const STEP_TITLES = [
  'Emplacement',
  'Informations du lieu',
  'Photo de façade',
  'Votre plaque d’adresse',
];

export const NewAddressPage: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // Étape 1 : Coordonnées
  const [latitude, setLatitude] = useState<string>('12.578333');
  const [longitude, setLongitude] = useState<string>('-16.271944');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAcquired, setGpsAcquired] = useState<boolean>(false);

  // Étape 2 : Détails & Visibilité
  const [locationType, setLocationType] = useState<LocationType>('MAISON');
  const [description, setDescription] = useState<string>('');
  const [listed, setListed] = useState<boolean>(false);
  const [showOwnerName, setShowOwnerName] = useState<boolean>(false);

  // Étape 3 : Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reductionPercentage: number;
  } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Étape 4 & Soumission
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAddress, setCreatedAddress] = useState<AddressResponse | null>(null);
  const [isOfflineCreated, setIsOfflineCreated] = useState<boolean>(false);
  const [hasTemporaryCode, setHasTemporaryCode] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();

  // Déplacement du focus lors du changement d'étape pour l'accessibilité
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // Capture GPS
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setLoadingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setGpsAccuracy(accuracy);
        setGpsAcquired(true);
        setLoadingGps(false);
        setSubmitError(null);
        showToast('Position GPS capturée !', 'success');
      },
      (err) => {
        setLoadingGps(false);
        if (err.code === 1) {
          setGpsError('Autorisation refusée. Vous pouvez positionner le repère sur la carte.');
        } else if (err.code === 2) {
          setGpsError('Position indisponible. Vérifiez votre signal GPS.');
        } else {
          setGpsError('Délai dépassé lors de la capture GPS. Réessayez.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Mise à jour de la position via déplacement du repère sur la carte ou clic
  const handleMapPositionChange = (lat: number, lng: number) => {
    setLatitude((prev) => (Math.abs(parseFloat(prev) - lat) < 0.000001 ? prev : lat.toFixed(6)));
    setLongitude((prev) => (Math.abs(parseFloat(prev) - lng) < 0.000001 ? prev : lng.toFixed(6)));
    setSubmitError(null);
  };

  // Traitement et compression de la photo
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateStep3Photo(file);
    if (!validation.isValid) {
      setPhotoError(validation.error || 'Fichier invalide');
      return;
    }

    try {
      setCompressing(true);
      const result = await compressImage(file, 800, 0.8);
      setPhotoFile(result.file);
      setPhotoPreview(result.previewUrl);
      setCompressionStats({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        reductionPercentage: result.reductionPercentage,
      });
      showToast('Photo optimisée pour le chargement mobile', 'info');
    } catch {
      setPhotoError("Impossible de traiter l'image. Veuillez réessayer.");
    } finally {
      setCompressing(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setCompressionStats(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Navigation entre étapes
  const handleGoToStep2 = () => {
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    const val = validateStep1Position(latNum, lonNum);
    if (!val.isValid) {
      setSubmitError(val.error || 'Coordonnées invalides');
      return;
    }
    // Validation immédiate de la zone de couverture
    try {
      resolveQuartier(latNum, lonNum);
    } catch {
      setSubmitError("Ces coordonnées sont hors des zones couvertes (Ziguinchor, Dakar). Déplacez le repère ou saisissez d'autres coordonnées.");
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    setSubmitError(null);
    setStep(2);
  };

  const handleGoToStep3 = () => {
    const val = validateStep2Details(locationType, description);
    if (!val.isValid) {
      setSubmitError(val.error || 'Description requise');
      return;
    }
    setSubmitError(null);
    setStep(3);
  };

  // Soumission finale
  const handleFinalSubmit = async (includePhoto = true) => {
    setSubmitError(null);
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    setSubmitting(true);

    const executeLocalOfflineSave = async (fromLostConnection = false) => {
      try {
        const count = await getDraftsCount();
        if (count >= MAX_DRAFTS) {
          setSubmitError("File d'attente pleine (20 adresses). Veuillez vous reconnecter pour les transmettre.");
          setSubmitting(false);
          return;
        }

        performance.mark('offline-address-create-start');

        let quartier;
        try {
          quartier = resolveQuartier(latNum, lonNum);
        } catch {
          setSubmitError("Ces coordonnées sont hors des zones couvertes (Ziguinchor, Dakar). Déplacez le repère ou saisissez d'autres coordonnées.");
          setStep(1);
          setSubmitting(false);
          return;
        }

        const clientRequestId = crypto.randomUUID();
        const draftId = crypto.randomUUID();

        // Récupérer un code réservé local
        const reservedCode = await getAvailableReservedCode(quartier.zoneCode, quartier.code);
        const isTemp = !reservedCode;
        const assignedCode = reservedCode || `${quartier.zoneCode}-${quartier.code}-????`;

        let photoBlob: Blob | null = null;
        if (includePhoto && photoFile) {
          photoBlob = photoFile;
        }

        const draft: OfflineDraft = {
          id: draftId,
          clientRequestId,
          latitude: latNum,
          longitude: lonNum,
          zone: quartier.zoneCode,
          quartier: quartier.code,
          description: description.trim(),
          locationType,
          photoBlob,
          reservedCode: reservedCode || null,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          attempts: 0,
        };

        await saveDraft(draft);

        const offlineResp: AddressResponse = {
          id: draftId,
          code: assignedCode,
          latitude: latNum,
          longitude: lonNum,
          zone: quartier.zoneCode,
          quartier: quartier.code,
          description: description.trim(),
          locationType,
          status: 'ACTIVE',
          createdAt: draft.createdAt,
          owner: {
            id: user?.id || 'offline',
            fullName: user?.fullName || 'Propriétaire',
            email: user?.email || '',
            phoneNumber: user?.phoneNumber || '',
            role: 'PROPRIETAIRE',
          },
        };

        setCreatedAddress(offlineResp);
        setIsOfflineCreated(true);
        setHasTemporaryCode(isTemp);
        setStep(4);

        performance.mark('offline-address-create-end');
        try {
          performance.measure(
            'offline-address-create-time',
            'offline-address-create-start',
            'offline-address-create-end'
          );
        } catch {
          // ignore
        }

        if (fromLostConnection) {
          showToast('Connexion perdue · adresse enregistrée sur cet appareil', 'info');
        } else {
          showToast('Adresse enregistrée sur cet appareil', 'success');
        }
      } catch (err: any) {
        setSubmitError(err?.message || "Erreur lors de l'enregistrement local de l'adresse.");
      } finally {
        setSubmitting(false);
      }
    };

    if (!isOnline) {
      await executeLocalOfflineSave(false);
      return;
    }

    // Tentative en ligne avec timeout de 8 secondes
    try {
      const clientReqId = crypto.randomUUID();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_8S')), 8000)
      );

      const onlinePromise = createAddress(
        {
          latitude: latNum,
          longitude: lonNum,
          description: description.trim(),
          locationType,
          listed,
          showOwnerName: listed ? showOwnerName : false,
          clientRequestId: clientReqId,
        },
        includePhoto && photoFile ? photoFile : undefined
      );

      const result = await Promise.race([onlinePromise, timeoutPromise]);
      setCreatedAddress(result);
      setIsOfflineCreated(false);
      setHasTemporaryCode(false);
      setStep(4);
      showToast(`Adresse ${result.code} créée avec succès !`, 'success');
      setSubmitting(false);
    } catch (err: any) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        if (err.status === 422) {
          setSubmitError('Coordonnées hors zone couverte');
          setStep(1);
        } else {
          setSubmitError(err.message || 'Données invalides.');
        }
        setSubmitting(false);
        return;
      }

      // Échec réseau, timeout 8s ou erreur 5xx : bascule automatique sur l'enregistrement local
      await executeLocalOfflineSave(true);
    }
  };

  // Réinitialisation pour créer une autre adresse
  const handleReset = () => {
    setCreatedAddress(null);
    setIsOfflineCreated(false);
    setHasTemporaryCode(false);
    setDescription('');
    setLocationType('MAISON');
    setPhotoFile(null);
    setPhotoPreview(null);
    setCompressionStats(null);
    setSubmitError(null);
    setStep(1);
  };

  const handleDownloadQrCode = (addressCode: string) => {
    const link = document.createElement('a');
    link.href = `/api/addresses/${addressCode}/qrcode`;
    link.download = `samaadresse-${addressCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Téléchargement du QR Code démarré', 'success');
  };

  const numLat = parseFloat(latitude) || 12.578333;
  const numLng = parseFloat(longitude) || -16.271944;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
      {/* Lien retour léger */}
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D528F] hover:text-[#153C6B] hover:underline transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à l'accueil</span>
        </Link>
      </div>

      {/* Annonce d'étape pour lecteurs d'écran */}
      <div className="sr-only" aria-live="polite">
        Étape {step} sur 4 : {STEP_TITLES[step - 1]}
      </div>

      {/* Barre de progression des 4 étapes */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[#5C4D44]">
          <span
            ref={headingRef}
            tabIndex={-1}
            className="text-sm font-bold text-[#231A15] outline-none"
          >
            Étape {step} sur 4 : {STEP_TITLES[step - 1]}
          </span>
          <span className="font-mono text-[11px] text-[#5C4D44]">{Math.round((step / 4) * 100)}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={4}
          aria-label="Progression de création d'adresse"
          className="w-full bg-[#E6DDD0] h-1.5 rounded-full overflow-hidden"
        >
          <div
            className="bg-[#B84A24] h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* ALERTE ERREUR GLOBALE (ex : Hors zone 422) */}
      {submitError && (
        <div
          className="mb-6 p-3.5 bg-[#B84A24]/10 border border-[#B84A24]/30 rounded-xl text-xs text-[#B84A24] font-medium flex items-start gap-2.5 animate-fadeIn"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Attention</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {/* Information mode hors ligne pour le wizard de création */}
      {!isOnline && step < 4 && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-[#F2ECE1] border border-[#D4CEBF] text-[#5C4D44] text-xs font-medium flex items-center gap-2.5 mb-2 shadow-[0_1px_0_rgba(35,26,21,0.04)]"
        >
          <WifiOff className="w-4 h-4 text-[#8A3112] shrink-0" />
          <span>Mode hors ligne · cette adresse sera enregistrée sur votre appareil et transmise dès votre retour sur le réseau.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 1 : EMPLACEMENT & POSITION GPS */}
      {/* ========================================================================= */}
      {step === 1 && (
        <section aria-labelledby="step1-title" className="space-y-5 animate-fadeIn">
          <div className="p-4 sm:p-5 rounded-xl bg-[#F2ECE1]/60 border border-[#E6DDD0]">
            <h1 id="step1-title" className="text-xl sm:text-2xl font-extrabold text-[#231A15] tracking-tight">
              Où se situe votre lieu ?
            </h1>
            <p className="text-sm sm:text-base text-[#5C4D44] mt-1.5 leading-relaxed">
              Capturez votre position GPS directement devant l'entrée de votre bâtiment ou déplacez le repère sur la carte interactive pour définir le point d'entrée de votre adresse permanente.
            </p>
          </div>

          {/* Action GPS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-[#FFFFFF] rounded-xl border border-[#8C8272]/30 shadow-sm">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={loadingGps}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-[#231A15] hover:bg-[#3D2E24] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {loadingGps ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#B84A24]" />
                    <span>Signal en cours d'acquisition...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 text-[#B84A24]" />
                    <span>Capturer ma position GPS</span>
                  </>
                )}
              </button>
            </div>

            {gpsAcquired && gpsAccuracy !== null && (
              <div
                className={`text-[11px] font-mono flex items-center gap-1.5 self-center ${
                  gpsAccuracy > 50 ? 'text-[#8A3112] font-semibold' : 'text-[#2A6B44]'
                }`}
              >
                {gpsAccuracy > 50 ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#8A3112] shrink-0" />
                ) : (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>Précision : ± {Math.round(gpsAccuracy)} m</span>
              </div>
            )}
          </div>

          {/* Avertissement si précision faible (> 50m) */}
          {gpsAccuracy !== null && gpsAccuracy > 50 && (
            <div className="p-3 bg-[#F2ECE1] border border-[#8C8272]/40 rounded-xl text-xs text-[#5C4D44] flex items-start gap-2" role="status">
              <AlertTriangle className="w-4 h-4 text-[#B84A24] shrink-0 mt-0.5" />
              <span>
                Précision GPS faible (± {Math.round(gpsAccuracy)} m). Rapprochez-vous d'une zone dégagée ou déplacez le repère.
              </span>
            </div>
          )}

          {/* Erreur GPS */}
          {gpsError && (
            <div className="p-3 bg-[#F2ECE1] border border-[#8C8272]/40 rounded-xl text-xs text-[#5C4D44] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#B84A24] shrink-0 mt-0.5" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* Carte interactive avec marqueur déplaçable */}
          <div className="space-y-1.5">
            <AddressMap
              latitude={numLat}
              longitude={numLng}
              draggable={true}
              onPositionChange={handleMapPositionChange}
              accuracyRadiusMeters={gpsAccuracy}
              showDirections={false}
              description="Emplacement sélectionné"
            />
            <p className="text-[11px] text-[#5C4D44] italic">
              Touchez ou déplacez le repère sur la carte pour ajuster le bon emplacement.
            </p>
          </div>

          {/* Saisie manuelle pliable */}
          <details className="group border border-[#8C8272]/30 rounded-xl p-3 bg-[#FFFFFF] text-xs">
            <summary className="font-semibold text-[#1D528F] cursor-pointer hover:underline list-none flex items-center justify-between">
              <span>Saisir les coordonnées manuellement</span>
              <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-[#8C8272]" />
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3 pt-2 border-t border-[#E6DDD0]">
              <div>
                <label htmlFor="manual-lat" className="block text-[11px] font-bold text-[#231A15] mb-1">
                  Latitude (°N)
                </label>
                <input
                  id="manual-lat"
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 border border-[#8C8272] rounded-lg text-xs bg-[#FBF9F5] font-mono text-[#231A15] focus:outline-none focus:ring-2 focus:ring-[#B84A24]"
                />
              </div>
              <div>
                <label htmlFor="manual-lng" className="block text-[11px] font-bold text-[#231A15] mb-1">
                  Longitude (°O)
                </label>
                <input
                  id="manual-lng"
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 border border-[#8C8272] rounded-lg text-xs bg-[#FBF9F5] font-mono text-[#231A15] focus:outline-none focus:ring-2 focus:ring-[#B84A24]"
                />
              </div>
            </div>
          </details>

          {/* Bouton Suivant */}
          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={handleGoToStep2}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B84A24] hover:bg-[#963B1C] text-white text-sm font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] cursor-pointer min-h-[44px]"
            >
              <span>Continuer vers les détails</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 2 : INFORMATIONS DU LIEU */}
      {/* ========================================================================= */}
      {step === 2 && (
        <section aria-labelledby="step2-title" className="space-y-5 animate-fadeIn">
          <div>
            <h1 id="step2-title" className="text-xl sm:text-2xl font-extrabold text-[#231A15] tracking-tight">
              Décrivez votre lieu
            </h1>
            <p className="text-xs sm:text-sm text-[#5C4D44] mt-1">
              Précisez la nature de l'endroit et des repères visuels clairs pour faciliter l'orientation des visiteurs et livreurs.
            </p>
          </div>

          {/* Type de lieu (SegmentedPicker accessible) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#231A15]">
              Type d'établissement ou de bâtiment
            </label>
            <SegmentedPicker
              value={locationType}
              onChange={setLocationType}
              label="Type de lieu"
            />
          </div>

          {/* Description et repères */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="address-desc" className="block text-xs font-bold text-[#231A15]">
                Repère visuel ou description <span className="text-[#B84A24]">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  description.length > 500 ? 'text-[#B84A24] font-bold' : 'text-[#8C8272]'
                }`}
              >
                {description.length}/500
              </span>
            </div>
            <textarea
              id="address-desc"
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Porte verte en face de la boutique Chez Moussa, à 50 m du grand manguier..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#8C8272] bg-[#FFFFFF] text-xs sm:text-sm text-[#231A15] placeholder-[#8C8272] focus:outline-none focus:ring-2 focus:ring-[#B84A24] resize-none"
            />
            <p className="text-[11px] text-[#5C4D44]">
              Indiquez des détails visibles depuis la voie publique : couleur de façade, commerce voisin, croisement.
            </p>
          </div>

          {/* Section repliable Visibilité dans l'annuaire */}
          <details className="group border border-[#8C8272]/40 rounded-xl p-3.5 bg-[#FFFFFF] text-xs">
            <summary className="font-semibold text-[#1D528F] cursor-pointer hover:underline list-none flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1D528F]" />
                <span>Visibilité dans l'annuaire</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-[#8C8272]" />
            </summary>

            <div className="mt-3 pt-3 border-t border-[#E6DDD0] space-y-3">
              <div className="flex items-start gap-2.5">
                <input
                  id="directory-listed"
                  type="checkbox"
                  checked={listed}
                  onChange={(e) => {
                    setListed(e.target.checked);
                    if (!e.target.checked) setShowOwnerName(false);
                  }}
                  className="mt-0.5 w-4 h-4 text-[#1D528F] border-[#8C8272] rounded focus:ring-[#1D528F]"
                />
                <div>
                  <label htmlFor="directory-listed" className="font-bold text-[#231A15] cursor-pointer">
                    Figurer dans l'annuaire public
                  </label>
                  <p className="text-[11px] text-[#5C4D44] mt-0.5">
                    Par défaut, votre adresse reste privée (accessible uniquement via son code ou son QR code). Cochez cette option pour qu'elle soit trouvable dans l'annuaire public.
                  </p>
                </div>
              </div>

              {listed && (
                <div className="flex items-start gap-2.5 pl-6 pt-1">
                  <input
                    id="directory-show-owner"
                    type="checkbox"
                    checked={showOwnerName}
                    onChange={(e) => setShowOwnerName(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#1D528F] border-[#8C8272] rounded focus:ring-[#1D528F]"
                  />
                  <div>
                    <label htmlFor="directory-show-owner" className="font-bold text-[#231A15] cursor-pointer">
                      Afficher mon nom sur la fiche
                    </label>
                    <p className="text-[11px] text-[#5C4D44] mt-0.5">
                      Votre nom sera visible par toute personne consultant l'annuaire.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </details>

          {/* Navigation */}
          <div className="pt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#8C8272]/50 text-xs font-semibold text-[#231A15] hover:bg-[#F2ECE1] transition cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à l'emplacement</span>
            </button>

            <button
              type="button"
              onClick={handleGoToStep3}
              disabled={!description.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#B84A24] hover:bg-[#963B1C] text-white text-sm font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              <span>Continuer vers la photo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 3 : PHOTO DE FAÇADE (FACULTATIVE) */}
      {/* ========================================================================= */}
      {step === 3 && (
        <section aria-labelledby="step3-title" className="space-y-5 animate-fadeIn">
          <div>
            <h1 id="step3-title" className="text-xl sm:text-2xl font-extrabold text-[#231A15] tracking-tight">
              Ajouter une photo de façade
            </h1>
            <p className="text-xs sm:text-sm text-[#5C4D44] mt-1">
              Une photo claire de l'entrée ou de la façade permet de confirmer l'adresse en un coup d'œil. Cette étape est facultative.
            </p>
          </div>

          {/* Zone d'import / Prise de vue */}
          <div className="p-4 sm:p-6 bg-[#FFFFFF] rounded-2xl border border-[#8C8272]/30 shadow-sm space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              id="camera-input"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            {!photoPreview ? (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#8C8272]/40 rounded-xl bg-[#FBF9F5] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#B84A24]/10 flex items-center justify-center text-[#B84A24]">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#231A15]">
                    Prenez une photo ou choisissez une image
                  </p>
                  <p className="text-[11px] text-[#5C4D44] mt-0.5">
                    Formats JPEG, PNG, WebP · Compression automatique à 1600 px
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={compressing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#231A15] hover:bg-[#3D2E24] text-white text-xs font-bold transition cursor-pointer min-h-[44px]"
                >
                  <Camera className="w-4 h-4 text-[#B84A24]" />
                  <span>Prendre ou sélectionner une photo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-[#8C8272]/40 bg-[#F2ECE1] max-h-72 flex items-center justify-center">
                  <img
                    src={photoPreview}
                    alt="Aperçu de la façade"
                    className="w-full h-full object-cover max-h-72"
                  />
                </div>

                {/* Métriques d'optimisation client */}
                {compressionStats && (
                  <div className="p-2.5 bg-[#F2ECE1] rounded-lg text-[11px] text-[#5C4D44] flex items-center justify-between flex-wrap gap-2">
                    <span className="font-medium">
                      Poids optimisé : {formatFileSize(compressionStats.originalSize)} →{' '}
                      <strong className="text-[#2A6B44]">
                        {formatFileSize(compressionStats.compressedSize)}
                      </strong>{' '}
                      (-{compressionStats.reductionPercentage}%)
                    </span>
                    <span className="text-[#2A6B44] font-semibold">Prêt pour envoi mobile</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#8C8272]/40 text-xs font-semibold text-[#231A15] hover:bg-[#F2ECE1] transition cursor-pointer min-h-[36px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#5C4D44]" />
                    <span>Reprendre</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#B84A24]/30 text-xs font-semibold text-[#B84A24] hover:bg-[#B84A24]/10 transition cursor-pointer min-h-[36px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            )}

            {compressing && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#5C4D44] py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#B84A24]" />
                <span>Compression et optimisation de la photo en cours...</span>
              </div>
            )}

            {photoError && (
              <div className="p-3 bg-[#B84A24]/10 border border-[#B84A24]/30 rounded-lg text-xs text-[#B84A24] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}
          </div>

          {/* Navigation et Actions finales */}
          <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#8C8272]/50 text-xs font-semibold text-[#231A15] hover:bg-[#F2ECE1] transition cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour aux détails</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {!photoFile && (
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(false)}
                  disabled={submitting || compressing}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#5C4D44] hover:text-[#231A15] hover:bg-[#FFFFFF] transition cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Passer cette étape
                </button>
              )}

              <button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                disabled={submitting || compressing}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#B84A24] hover:bg-[#963B1C] text-white text-sm font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Création de l'adresse en cours...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Valider et créer l'adresse</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ÉTAPE 4 : CODE D'ADRESSE & PLAQUE CRÉÉE */}
      {/* ========================================================================= */}
      {step === 4 && createdAddress && (
        <article aria-labelledby="step4-title" className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            {isOfflineCreated ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2ECE1] border border-[#D4CEBF] text-[#8A3112] text-xs font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Enregistrée sur cet appareil · en attente d'envoi</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2A6B44]/10 text-[#2A6B44] text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Adresse créée et enregistrée</span>
              </div>
            )}
            <h1 id="step4-title" className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
              {isOfflineCreated ? "Votre plaque d'adresse" : "Votre plaque d'adresse numérique"}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C4D44] max-w-md mx-auto">
              {isOfflineCreated
                ? hasTemporaryCode
                  ? 'Code temporaire attribué hors ligne. Le code définitif sera attribué lors de la synchronisation avec le serveur.'
                  : 'Adresse enregistrée hors ligne sur votre appareil. Elle sera automatiquement envoyée dès votre retour en ligne.'
                : 'Ce code ne changera plus. Vous pouvez le partager, imprimer la plaque ou télécharger son QR Code.'}
            </p>
          </div>

          {/* Plaque d'adresse héro standardisée */}
          <div className="w-full flex flex-col items-center justify-center py-2 gap-2">
            <AddressPlate
              code={createdAddress.code}
              zone={createdAddress.zone}
              type={createdAddress.locationType}
              size="lg"
              showCopy={!isOfflineCreated}
              className="w-full"
            />
          </div>

          {!isOfflineCreated && (
            <>
              {/* Affichage sobre du QR Code */}
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#8C8272]/30 shadow-sm text-center space-y-3">
                <h2 className="text-sm font-bold text-[#231A15]">
                  QR code d'accès rapide
                </h2>
                <div className="inline-block p-2 bg-[#FFFFFF] border border-[#8C8272]/30 rounded-xl shadow-inner">
                  <img
                    src={`/api/addresses/${createdAddress.code}/qrcode`}
                    alt={`QR code pour l'adresse ${createdAddress.code}`}
                    className="w-36 h-36 mx-auto object-contain"
                  />
                </div>
                <p className="text-[11px] text-[#5C4D44]">
                  Scannable par toute caméra de smartphone sans application requise.
                </p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDownloadQrCode(createdAddress.code)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#231A15] hover:bg-[#3D2E24] text-white text-xs font-bold transition cursor-pointer min-h-[38px]"
                  >
                    <Download className="w-3.5 h-3.5 text-[#B84A24]" />
                    <span>Télécharger le QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#8C8272]/50 text-xs font-bold text-[#231A15] hover:bg-[#F2ECE1] transition cursor-pointer min-h-[38px]"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#5C4D44]" />
                    <span>Imprimer la plaque</span>
                  </button>
                </div>
              </div>

              {/* Bloc de partage */}
              <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#8C8272]/30 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-[#231A15]">
                  Partager l'adresse
                </h2>
                <ShareAddress
                  code={createdAddress.code}
                  description={createdAddress.description}
                />
              </div>
            </>
          )}

          {/* Actions de fin de parcours */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#8C8272]/50 text-xs font-semibold text-[#231A15] hover:bg-[#F2ECE1] transition cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isOfflineCreated ? 'Enregistrer une autre adresse' : 'Créer une autre adresse'}</span>
            </button>

            {isOfflineCreated ? (
              <Link
                to="/addresses/mine"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs font-bold transition shadow-sm cursor-pointer min-h-[44px]"
              >
                <span>Voir mes adresses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to={`/a/${createdAddress.code}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#1D528F] hover:bg-[#153C6B] text-white text-xs font-bold transition shadow-sm cursor-pointer min-h-[44px]"
              >
                <span>Voir la fiche publique</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </article>
      )}
    </div>
  );
};

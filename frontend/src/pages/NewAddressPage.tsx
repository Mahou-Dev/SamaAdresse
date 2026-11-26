import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import { PublicLayout } from '../app/layouts/PublicLayout';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { useToast } from '../components/Toast';
import { createAddress } from '../api/addressApi';
import type { LocationType, AddressResponse } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import { compressImage } from '../utils/imageCompressor';
import {
  validateStep1Position,
  validateStep2Details,
  validateStep3Photo,
} from '../utils/formValidation';
import { useAuth } from '../context/AuthContext';
import { resolveQuartier, formatOutOfZoneMessage, getZoneName } from '../utils/geoGrid';
import {
  getDraftsCount,
  saveDraft,
  getAvailableReservedCode,
  MAX_DRAFTS,
} from '../utils/offlineDb';
import type { OfflineDraft } from '../utils/offlineDb';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { WizardStepper } from '../features/addresses/creation/WizardStepper';
import { WizardStepLocation } from '../features/addresses/creation/WizardStepLocation';
import { WizardStepDetails } from '../features/addresses/creation/WizardStepDetails';
import { WizardStepPhoto } from '../features/addresses/creation/WizardStepPhoto';
import type { CompressionStats } from '../features/addresses/creation/WizardStepPhoto';
import { WizardStepResult } from '../features/addresses/creation/WizardStepResult';

export const NewAddressPage: React.FC = () => {
  const { isOnline } = useOnlineStatus();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState<number>(1);
  const headingRef = useRef<HTMLSpanElement | null>(null);
  const submittingRef = useRef(false);

  // Étape 1 : Coordonnées (Ziguinchor par défaut)
  const [latitude, setLatitude] = useState<string>('12.578333');
  const [longitude, setLongitude] = useState<string>('-16.271944');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAcquired, setGpsAcquired] = useState<boolean>(false);

  // Étape 2 : Détails & Visibilité
  const [locationType, setLocationType] = useState<LocationType>('MAISON');
  const [description, setDescription] = useState<string>('');
  const [listed, setListed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sa_pref_default_listed') === 'true';
    } catch {
      return false;
    }
  });
  const [showOwnerName, setShowOwnerName] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sa_pref_default_show_owner') === 'true';
    } catch {
      return false;
    }
  });

  // Étape 3 : Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Étape 4 & Soumission
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdAddress, setCreatedAddress] = useState<AddressResponse | null>(null);
  const [isOfflineCreated, setIsOfflineCreated] = useState<boolean>(false);
  const [hasTemporaryCode, setHasTemporaryCode] = useState<boolean>(false);

  // Déplacement du focus lors du changement d'étape pour l'accessibilité
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // Libération propre de l'URL Blob à la suppression / démontage
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const summaryQuartierLabel = useMemo(() => {
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (!validateStep1Position(latNum, lonNum).isValid) return null;
    try {
      const q = resolveQuartier(latNum, lonNum);
      return `${q.name} · ${getZoneName(q.zoneCode)}`;
    } catch {
      return null;
    }
  }, [latitude, longitude]);

  const handleCaptureGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
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

  const handleMapPositionChange = (lat: number, lng: number) => {
    setLatitude((prev) =>
      Math.abs(parseFloat(prev) - lat) < 0.000001 ? prev : lat.toFixed(6)
    );
    setLongitude((prev) =>
      Math.abs(parseFloat(prev) - lng) < 0.000001 ? prev : lng.toFixed(6)
    );
    setSubmitError(null);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateStep3Photo(file);
    if (!validation.isValid) {
      setPhotoError(validation.error || 'Fichier invalide');
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleGoToStep2 = () => {
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    const val = validateStep1Position(latNum, lonNum);
    if (!val.isValid) {
      setSubmitError(val.error || 'Coordonnées invalides');
      return;
    }
    try {
      resolveQuartier(latNum, lonNum);
    } catch {
      setSubmitError(formatOutOfZoneMessage());
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

  const handleFinalSubmit = async (includePhoto = true) => {
    if (submittingRef.current || submitting) return;

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    const posVal = validateStep1Position(latNum, lonNum);
    if (!posVal.isValid) {
      setSubmitError(posVal.error || 'Coordonnées invalides');
      setStep(1);
      return;
    }

    const detailsVal = validateStep2Details(locationType, description);
    if (!detailsVal.isValid) {
      setSubmitError(detailsVal.error || 'Description requise');
      setStep(2);
      return;
    }

    submittingRef.current = true;
    setSubmitError(null);
    setSubmitting(true);

    const executeLocalOfflineSave = async (fromLostConnection = false) => {
      try {
        const count = await getDraftsCount();
        if (count >= MAX_DRAFTS) {
          setSubmitError(
            "File d'attente pleine (20 adresses). Veuillez vous reconnecter pour les transmettre."
          );
          return;
        }

        performance.mark('offline-address-create-start');

        let quartier;
        try {
          quartier = resolveQuartier(latNum, lonNum);
        } catch {
          setSubmitError(formatOutOfZoneMessage());
          setStep(1);
          return;
        }

        const clientRequestId = crypto.randomUUID();
        const draftId = crypto.randomUUID();

        const reservedCode = await getAvailableReservedCode(quartier.zoneCode, quartier.code);
        const isTemp = !reservedCode;
        const assignedCode = reservedCode || `${quartier.zoneCode}-${quartier.code}-????`;

        const photoBlob: Blob | null = includePhoto && photoFile ? photoFile : null;

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
          // ignorer
        }

        if (fromLostConnection) {
          showToast('Connexion perdue · adresse enregistrée sur cet appareil', 'info');
        } else {
          showToast('Adresse enregistrée sur cet appareil', 'success');
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Erreur lors de l'enregistrement local de l'adresse.";
        setSubmitError(msg);
      } finally {
        submittingRef.current = false;
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
        window.setTimeout(() => reject(new Error('TIMEOUT_8S')), 8000)
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
      submittingRef.current = false;
      setSubmitting(false);
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        if (err.status === 422) {
          setSubmitError('Coordonnées hors zone couverte');
          setStep(1);
        } else {
          setSubmitError(err.message || 'Données invalides.');
        }
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }

      // Échec réseau, timeout 8s ou erreur 5xx : bascule automatique sur l'enregistrement local
      await executeLocalOfflineSave(true);
    }
  };

  const handleReset = () => {
    setCreatedAddress(null);
    setIsOfflineCreated(false);
    setHasTemporaryCode(false);
    setDescription('');
    setLocationType('MAISON');
    setPhotoFile(null);
    setPhotoPreview(null);
    setCompressionStats(null);
    setPhotoError(null);
    setSubmitError(null);
    setStep(1);
  };

  const handleDownloadQrCode = (addressCode: string) => {
    const link = document.createElement('a');
    link.href = `${import.meta.env.VITE_API_BASE_URL || ''}/api/addresses/${encodeURIComponent(addressCode)}/qrcode`;
    link.download = `samaadresse-${addressCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Téléchargement du QR Code démarré', 'success');
  };

  return (
    <PublicLayout maxWidth="form" surface="canvas">
      <div className="space-y-6 pb-8">
        {/* Fil d'Ariane et titre de contexte ("Nouvelle adresse" préservé pour lot7.spec.ts) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Breadcrumb
            items={[
              { label: 'Accueil', to: '/' },
              { label: 'Mes adresses', to: '/addresses/mine' },
              { label: 'Nouvelle adresse' },
            ]}
          />
        </div>

        {/* Stepper visuel 4 étapes */}
        <WizardStepper
          currentStep={step}
          headingRef={headingRef}
          onStepSelect={(target) => {
            if (target < step && step < 4 && !submitting) {
              setSubmitError(null);
              setStep(target);
            }
          }}
          disabled={submitting}
        />

        {/* Alerte erreur globale (ex : Hors zone 422 ou file pleine) */}
        {submitError && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-danger-soft border border-danger-border text-danger text-xs sm:text-sm font-medium flex items-start gap-2.5 sa-animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-bold">Attention</p>
              <p>{submitError}</p>
            </div>
          </div>
        )}

        {/* Information mode hors ligne pour le wizard */}
        {!isOnline && step < 4 && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-warning-soft border border-warning-border text-warning text-xs sm:text-sm font-medium flex items-start gap-2.5"
          >
            <WifiOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Mode hors ligne · cette adresse sera enregistrée sur votre appareil et transmise dès votre retour sur le réseau.
            </span>
          </div>
        )}

        {/* Étape 1 : Emplacement */}
        {step === 1 && (
          <WizardStepLocation
            latitude={latitude}
            longitude={longitude}
            onLatitudeChange={setLatitude}
            onLongitudeChange={setLongitude}
            onMapPositionChange={handleMapPositionChange}
            gpsAccuracy={gpsAccuracy}
            loadingGps={loadingGps}
            gpsAcquired={gpsAcquired}
            gpsError={gpsError}
            onCaptureGps={handleCaptureGps}
            onNext={handleGoToStep2}
          />
        )}

        {/* Étape 2 : Détails & Visibilité */}
        {step === 2 && (
          <WizardStepDetails
            locationType={locationType}
            onLocationTypeChange={setLocationType}
            description={description}
            onDescriptionChange={setDescription}
            listed={listed}
            onListedChange={setListed}
            showOwnerName={showOwnerName}
            onShowOwnerNameChange={setShowOwnerName}
            onBack={() => {
              setSubmitError(null);
              setStep(1);
            }}
            onNext={handleGoToStep3}
          />
        )}

        {/* Étape 3 : Photo de façade */}
        {step === 3 && (
          <WizardStepPhoto
            fileInputRef={fileInputRef}
            photoFile={photoFile}
            photoPreview={photoPreview}
            compressing={compressing}
            compressionStats={compressionStats}
            photoError={photoError}
            submitting={submitting}
            summaryQuartierLabel={summaryQuartierLabel}
            locationType={locationType}
            onPhotoSelect={handlePhotoSelect}
            onRemovePhoto={handleRemovePhoto}
            onBack={() => {
              setSubmitError(null);
              setStep(2);
            }}
            onSubmitWithoutPhoto={() => {
              void handleFinalSubmit(false);
            }}
            onSubmitWithPhoto={() => {
              void handleFinalSubmit(true);
            }}
          />
        )}

        {/* Étape 4 : Plaque créée / Brouillon hors ligne */}
        {step === 4 && createdAddress && (
          <WizardStepResult
            createdAddress={createdAddress}
            isOfflineCreated={isOfflineCreated}
            hasTemporaryCode={hasTemporaryCode}
            onDownloadQrCode={handleDownloadQrCode}
            onReset={handleReset}
          />
        )}
      </div>
    </PublicLayout>
  );
};

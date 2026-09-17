import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { createAddress } from '../api/addressApi';
import type { LocationType, AddressResponse } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import {
  MapPin,
  Navigation,
  Loader2,
  Home,
  ShoppingBag,
  Building2,
  Check,
  Copy,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  ListFilter,
  Compass,
} from 'lucide-react';

export const NewAddressPage: React.FC = () => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [locationType, setLocationType] = useState<LocationType>('MAISON');

  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdAddress, setCreatedAddress] = useState<AddressResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const { showToast } = useToast();

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée par votre navigateur. Saisissez vos coordonnées manuellement.");
      return;
    }

    setLoadingGps(true);
    setGpsError(null);
    setGpsSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLoadingGps(false);
        setGpsSuccess(true);
        showToast('Position GPS capturée avec succès !', 'success');
      },
      (err) => {
        setLoadingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Permission GPS refusée. Saisissez votre latitude et longitude ci-dessous.');
        } else {
          setGpsError('Impossible de capter le signal GPS. Saisissez vos coordonnées manuellement.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    // Auto-capture on load if possible
    handleCaptureGps();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lonNum)) {
      setErrorMsg('Veuillez saisir des coordonnées GPS valides (ex: 12.5738, -16.2650).');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Veuillez fournir une description ou un repère visuel pour votre adresse.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await createAddress({
        latitude: latNum,
        longitude: lonNum,
        description: description.trim(),
        locationType,
      });

      setCreatedAddress(response);
      showToast(`Plaque d'adresse ${response.code} générée avec succès !`, 'success');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Une erreur inattendue est survenue lors de la création.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`Code d'adresse ${code} copié !`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#231A15] flex flex-col justify-between p-4 sm:p-8 font-sans">
      <main className="max-w-2xl mx-auto w-full pt-4 pb-12 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E6DDD0]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1D528F] hover:text-[#153C6B] transition"
          >
            ← Retour à l'accueil
          </Link>
          <Link
            to="/addresses/mine"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2ECE1] text-[#231A15] text-xs font-bold hover:bg-[#E6DDD0] transition"
          >
            <ListFilter className="w-3.5 h-3.5 text-[#1D528F]" />
            <span>Mes Adresses</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#F2ECE1] border border-[#E6DDD0] text-[#231A15] text-xs font-bold w-fit">
            <Compass className="w-4 h-4 text-[#B84A24]" />
            <span>GÉNÉRATION D'ADRESSE • SÉNÉGAL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#231A15] tracking-tight">
            Créer une Nouvelle Adresse
          </h1>
          <p className="text-sm text-[#5C4D44]">
            Capturez votre position GPS et décrivez votre repère visuel pour obtenir votre plaque de rue numérique.
          </p>
        </div>

        {/* SUCCESS VIEW: DISPLAY CREATED ADDRESS PLAQUE */}
        {createdAddress ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border-4 border-[#1D528F] shadow-md text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAF4ED] text-[#2A6B44] text-xs font-bold">
                <Check className="w-4 h-4" />
                <span>ADRESSE CRÉÉE ET GÉOLOCALISÉE</span>
              </div>

              <div className="bg-[#1D528F] text-white py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-between">
                <span>République du Sénégal</span>
                <span>Zone {createdAddress.zone} • Quartier {createdAddress.quartier}</span>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-[#5C4D44] uppercase tracking-wider block">
                  Votre Code d'Adresse Officiel
                </span>
                <div className="inline-flex items-center gap-3 bg-[#FBF9F5] px-6 py-4 rounded-2xl border border-[#D4CEBF]">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono text-[#231A15] tracking-widest">
                    {createdAddress.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(createdAddress.code)}
                    className="p-2.5 rounded-xl bg-[#F2ECE1] hover:bg-[#E6DDD0] text-[#1D528F] transition cursor-pointer border border-[#D4CEBF]"
                    title="Copier le code"
                  >
                    {copiedCode ? <Check className="w-5 h-5 text-[#2A6B44]" /> : <Copy className="w-5 h-5 text-[#1D528F]" />}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#E6DDD0] text-left text-sm space-y-2">
                <div className="flex items-start gap-2 text-[#231A15] font-medium">
                  <MapPin className="w-4 h-4 text-[#B84A24] shrink-0 mt-0.5" />
                  <span>{createdAddress.description}</span>
                </div>
                <div className="text-xs text-[#5C4D44] font-mono pl-6">
                  Coordonnées GPS: {createdAddress.latitude.toFixed(6)}°, {createdAddress.longitude.toFixed(6)}°
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[#E6DDD0]">
                <Link
                  to={`/a/${createdAddress.code}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1D528F] hover:bg-[#153C6B] text-white font-bold text-xs transition"
                >
                  <span>Voir la Fiche Publique</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={() => {
                    setCreatedAddress(null);
                    setLatitude('');
                    setLongitude('');
                    setDescription('');
                    handleCaptureGps();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F2ECE1] hover:bg-[#E6DDD0] text-[#231A15] border border-[#D4CEBF] font-bold text-xs transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#B84A24]" />
                  <span>Créer une Autre Adresse</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CREATION FORM */
          <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#D4CEBF] shadow-sm">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                <div className="leading-snug">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* GPS Acquisition Card */}
              <div className="p-5 rounded-xl bg-[#F2ECE1] border border-[#E6DDD0] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#231A15]">
                    <Navigation className="w-4 h-4 text-[#1D528F]" />
                    <span>Position Géographique (GPS)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={loadingGps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FBF9F5] text-[#1D528F] border border-[#D4CEBF] text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {loadingGps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                    <span>{loadingGps ? 'Acquisition...' : 'Recapter le GPS'}</span>
                  </button>
                </div>

                {gpsSuccess && (
                  <div className="p-3 rounded-lg bg-[#EAF4ED] border border-[#2A6B44]/30 text-[#1C4E30] text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2A6B44]" />
                    <span>Signal GPS acquis avec succès.</span>
                  </div>
                )}

                {gpsError && (
                  <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                    <span>{gpsError}</span>
                  </div>
                )}

                {/* Coordinate Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label htmlFor="latitude" className="block text-xs font-bold text-[#5C4D44]">
                      Latitude (°N)
                    </label>
                    <input
                      id="latitude"
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="ex: 12.573800"
                      className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D4CEBF] focus:border-[#1D528F] rounded-xl text-[#231A15] placeholder-[#8C7B70] text-sm outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="longitude" className="block text-xs font-bold text-[#5C4D44]">
                      Longitude (°O)
                    </label>
                    <input
                      id="longitude"
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="ex: -16.265000"
                      className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D4CEBF] focus:border-[#1D528F] rounded-xl text-[#231A15] placeholder-[#8C7B70] text-sm outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Placeholder Map Card */}
                <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#D4CEBF] flex items-center justify-center text-center gap-2 text-xs text-[#5C4D44]">
                  <MapPin className="w-4 h-4 text-[#B84A24]" />
                  <span>Repère carte : {latitude && longitude ? `${latitude}°, ${longitude}°` : 'Attente du signal GPS...'}</span>
                </div>
              </div>

              {/* Location Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#231A15]">
                  Type de Lieu
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocationType('MAISON')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-bold transition cursor-pointer gap-1.5 ${
                      locationType === 'MAISON'
                        ? 'bg-[#1D528F] text-white border-[#1D528F]'
                        : 'bg-[#FBF9F5] text-[#231A15] border-[#D4CEBF] hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                    <span>Maison</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationType('COMMERCE')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-bold transition cursor-pointer gap-1.5 ${
                      locationType === 'COMMERCE'
                        ? 'bg-[#B84A24] text-white border-[#B84A24]'
                        : 'bg-[#FBF9F5] text-[#231A15] border-[#D4CEBF] hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Commerce</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationType('INSTITUTION')}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-bold transition cursor-pointer gap-1.5 ${
                      locationType === 'INSTITUTION'
                        ? 'bg-[#2A6B44] text-white border-[#2A6B44]'
                        : 'bg-[#FBF9F5] text-[#231A15] border-[#D4CEBF] hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span>Institution</span>
                  </button>
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="description" className="block text-xs font-bold text-[#231A15]">
                    Description & Repère Visuel Humain
                  </label>
                  <span className="text-xs text-[#5C4D44] font-mono">{description.length}/500</span>
                </div>
                <textarea
                  id="description"
                  required
                  maxLength={500}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Exemple: Maison familiale au toit rouge, 3e concession à gauche après la Grande Mosquée de Boucotte"
                  className="w-full p-3.5 bg-[#FBF9F5] border border-[#D4CEBF] focus:border-[#1D528F] focus:ring-1 focus:ring-[#1D528F] rounded-xl text-[#231A15] placeholder-[#8C7B70] text-sm outline-none transition"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !latitude || !longitude || !description.trim()}
                className="w-full py-4 px-4 rounded-xl bg-[#B84A24] hover:bg-[#963919] text-white font-bold text-sm shadow-sm active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Génération du code d'adresse...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    <span>Générer Mon Code d'Adresse</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-[#5C4D44] py-4 border-t border-[#E6DDD0]">
        © 2026 SamaAdresse — Plateforme Nationale d'Adressage Géolocalisé
      </footer>
    </div>
  );
};

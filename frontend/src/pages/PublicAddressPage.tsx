import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicAddress } from '../api/addressApi';
import type { PublicAddressResponse } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import { useToast } from '../components/Toast';
import {
  MapPin,
  Loader2,
  Home,
  ShoppingBag,
  Building2,
  Copy,
  Check,
  AlertCircle,
  Share2,
} from 'lucide-react';

export const PublicAddressPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [address, setAddress] = useState<PublicAddressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const { showToast } = useToast();

  useEffect(() => {
    const fetchPublicAddress = async () => {
      if (!code) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await getPublicAddress(code.toUpperCase());
        setAddress(data);
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 404) {
          setErrorMsg(`Aucune adresse active ne correspond au code ${code}.`);
        } else {
          setErrorMsg('Impossible de charger cette adresse.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublicAddress();
  }, [code]);

  const handleCopyCode = () => {
    if (!address) return;
    navigator.clipboard.writeText(address.code);
    setCopiedCode(true);
    showToast(`Code ${address.code} copié !`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getLocationTypeBadge = (type: string) => {
    switch (type) {
      case 'COMMERCE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#B84A24]/10 text-[#B84A24] font-bold text-xs">
            <ShoppingBag className="w-3.5 h-3.5" /> Commerce
          </span>
        );
      case 'INSTITUTION':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2A6B44]/10 text-[#2A6B44] font-bold text-xs">
            <Building2 className="w-3.5 h-3.5" /> Institution
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1D528F]/10 text-[#1D528F] font-bold text-xs">
            <Home className="w-3.5 h-3.5" /> Maison
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#231A15] flex flex-col justify-between p-4 sm:p-8 font-sans">
      <main className="max-w-2xl mx-auto w-full pt-4 pb-12 flex-1 flex flex-col justify-center">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E6DDD0]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1D528F] hover:text-[#153C6B] transition"
          >
            ← SamaAdresse Accueil
          </Link>
          <span className="text-xs text-[#5C4D44] font-mono">Fiche Publique d'Adresse</span>
        </div>

        {loading ? (
          <div className="p-12 text-center rounded-2xl bg-[#FFFFFF] border border-[#D4CEBF] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1D528F] mx-auto" />
            <p className="text-sm text-[#5C4D44]">Résolution du code {code}...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center rounded-2xl bg-[#FFFFFF] border border-[#D4CEBF] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#231A15]">Adresse non trouvée</h2>
              <p className="text-sm text-[#5C4D44]">{errorMsg}</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D528F] text-white font-bold text-xs hover:bg-[#153C6B] transition"
            >
              Retourner à l'accueil
            </Link>
          </div>
        ) : address && (
          <div className="space-y-6">
            {/* PHYSICAL PLAQUE HERO CARD */}
            <div className="rounded-2xl border-4 border-[#1D528F] bg-[#FFFFFF] shadow-md overflow-hidden">
              {/* Plaque Top Band */}
              <div className="bg-[#1D528F] px-6 py-3 text-white flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest uppercase">République du Sénégal</span>
                <span className="text-xs font-mono font-bold tracking-wider uppercase">
                  Zone {address.zone} • Quartier {address.quartier}
                </span>
              </div>

              {/* Plaque Content */}
              <div className="p-6 sm:p-8 text-center space-y-6">
                <div className="flex items-center justify-center gap-2">
                  {getLocationTypeBadge(address.locationType)}
                </div>

                {/* Facade Photo if present */}
                {address.photoUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-[#D4CEBF] shadow-inner max-h-64 sm:max-h-72 bg-[#F2ECE1]">
                    <img
                      src={address.photoUrl}
                      alt={`Photo de la façade pour l'adresse ${address.code}`}
                      className="w-full h-64 sm:h-72 object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-[#231A15]/80 text-white text-[11px] font-mono backdrop-blur-xs">
                      Photo de Façade
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#5C4D44] uppercase tracking-wider block">
                    Plaque Signalétique Officielle
                  </span>

                  <div className="inline-flex items-center gap-3 bg-[#FBF9F5] px-6 py-4 rounded-2xl border border-[#D4CEBF]">
                    <span className="text-4xl sm:text-5xl font-extrabold font-mono text-[#231A15] tracking-widest">
                      {address.code}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-2.5 rounded-xl bg-[#F2ECE1] hover:bg-[#E6DDD0] text-[#1D528F] transition cursor-pointer border border-[#D4CEBF]"
                      title="Copier le code"
                    >
                      {copiedCode ? <Check className="w-5 h-5 text-[#2A6B44]" /> : <Copy className="w-5 h-5 text-[#1D528F]" />}
                    </button>
                  </div>
                </div>

                {/* Description & Repère Humain */}
                <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#E6DDD0] text-left space-y-3">
                  <div className="flex items-start gap-2.5 text-[#231A15] font-medium leading-relaxed">
                    <MapPin className="w-5 h-5 text-[#B84A24] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-[#5C4D44] block mb-0.5">Description & Repère Visuel :</span>
                      <span>{address.description}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E6DDD0] flex items-center justify-between text-xs text-[#5C4D44] font-mono">
                    <span>Coordonnées GPS:</span>
                    <span className="font-bold text-[#231A15]">
                      {address.latitude.toFixed(6)}°N, {address.longitude.toFixed(6)}°O
                    </span>
                  </div>
                </div>

                {/* Sharing Action */}
                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Adresse ${address.code} — SamaAdresse`,
                          text: `Voici mon adresse SamaAdresse : ${address.code} (${address.description})`,
                          url: window.location.href,
                        });
                      } else {
                        handleCopyCode();
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F2ECE1] hover:bg-[#E6DDD0] text-[#231A15] border border-[#D4CEBF] font-bold text-xs transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-[#1D528F]" />
                    <span>Partager cette plaque d'adresse</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-[#5C4D44] py-4 border-t border-[#E6DDD0]">
        © 2026 SamaAdresse — Plateforme Nationale d'Adressage Géolocalisé
      </footer>
    </div>
  );
};

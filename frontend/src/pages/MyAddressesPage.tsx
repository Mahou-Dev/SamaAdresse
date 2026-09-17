import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { getMyAddresses } from '../api/addressApi';
import type { AddressResponse } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import {
  MapPin,
  Plus,
  Loader2,
  Home,
  ShoppingBag,
  Building2,
  Copy,
  Check,
  ExternalLink,
  ListFilter,
  Compass,
  AlertCircle,
} from 'lucide-react';

export const MyAddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { showToast } = useToast();

  const fetchAddresses = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getMyAddresses();
      setAddresses(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Impossible de charger vos adresses.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Code ${code} copié !`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getLocationTypeBadge = (type: string) => {
    switch (type) {
      case 'COMMERCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#B84A24]/10 text-[#B84A24] font-bold text-xs">
            <ShoppingBag className="w-3 h-3" /> Commerce
          </span>
        );
      case 'INSTITUTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2A6B44]/10 text-[#2A6B44] font-bold text-xs">
            <Building2 className="w-3 h-3" /> Institution
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1D528F]/10 text-[#1D528F] font-bold text-xs">
            <Home className="w-3 h-3" /> Maison
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#231A15] flex flex-col justify-between p-4 sm:p-8 font-sans">
      <main className="max-w-5xl mx-auto w-full pt-4 pb-12 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E6DDD0]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1D528F] hover:text-[#153C6B] transition"
          >
            ← Retour à l'accueil
          </Link>

          <Link
            to="/addresses/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B84A24] hover:bg-[#963919] text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Adresse</span>
          </Link>
        </div>

        {/* Header Title */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#F2ECE1] border border-[#E6DDD0] text-[#231A15] text-xs font-bold w-fit">
            <ListFilter className="w-4 h-4 text-[#1D528F]" />
            <span>REPERTOIRE PERSONNEL</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#231A15] tracking-tight">
            Mes Adresses Géolocalisées
          </h1>
          <p className="text-sm text-[#5C4D44]">
            Gérez vos plaques d'adresse enregistrées et partagez-les facilement.
          </p>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="p-12 text-center rounded-2xl bg-[#FFFFFF] border border-[#D4CEBF] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1D528F] mx-auto" />
            <p className="text-sm text-[#5C4D44]">Chargement de vos adresses...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-6 rounded-2xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        ) : addresses.length === 0 ? (
          /* EMPTY STATE */
          <div className="p-12 text-center rounded-2xl bg-[#FFFFFF] border border-[#D4CEBF] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F2ECE1] flex items-center justify-center text-[#B84A24] mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#231A15]">Aucune adresse enregistrée</h3>
              <p className="text-sm text-[#5C4D44] max-w-md mx-auto">
                Vous n'avez pas encore généré de plaque d'adresse géolocalisée.
              </p>
            </div>
            <Link
              to="/addresses/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#B84A24] hover:bg-[#963919] text-white font-bold text-xs transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Créer Ma Première Adresse</span>
            </Link>
          </div>
        ) : (
          /* CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-2xl border-2 border-[#1D528F] bg-[#FFFFFF] shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              >
                {/* Plaque Header */}
                <div className="bg-[#1D528F] px-5 py-2.5 text-white flex items-center justify-between text-xs font-bold">
                  <span className="font-mono tracking-wider">ZONE {address.zone}</span>
                  {getLocationTypeBadge(address.locationType)}
                </div>

                {/* Plaque Body */}
                <div className="p-5 space-y-4 flex-1">
                  <div className="flex items-center justify-between gap-3 bg-[#FBF9F5] p-3 rounded-xl border border-[#D4CEBF]">
                    <span className="text-2xl font-extrabold font-mono text-[#231A15] tracking-wider">
                      {address.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(address.code)}
                      className="p-2 rounded-lg bg-[#F2ECE1] hover:bg-[#E6DDD0] text-[#1D528F] transition cursor-pointer border border-[#D4CEBF]"
                      title="Copier le code"
                    >
                      {copiedCode === address.code ? (
                        <Check className="w-4 h-4 text-[#2A6B44]" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#1D528F]" />
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-[#231A15] font-medium leading-relaxed">
                    {address.description}
                  </p>

                  <div className="text-xs text-[#5C4D44] font-mono flex items-center gap-1.5 pt-2 border-t border-[#E6DDD0]">
                    <MapPin className="w-3.5 h-3.5 text-[#B84A24] shrink-0" />
                    <span>GPS: {address.latitude.toFixed(6)}°, {address.longitude.toFixed(6)}°</span>
                  </div>
                </div>

                {/* Plaque Footer */}
                <div className="bg-[#FBF9F5] px-5 py-3 border-t border-[#E6DDD0] flex items-center justify-between text-xs">
                  <span className="text-[#5C4D44]">
                    Créée le {new Date(address.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  <Link
                    to={`/a/${address.code}`}
                    className="inline-flex items-center gap-1 text-[#1D528F] font-bold hover:underline"
                  >
                    <span>Fiche Publique</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-[#5C4D44] py-4 border-t border-[#E6DDD0]">
        © 2026 SamaAdresse — Plateforme Nationale d'Adressage Géolocalisé
      </footer>
    </div>
  );
};

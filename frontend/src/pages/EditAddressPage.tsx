import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getMyAddresses,
  updateAddress,
  uploadAddressPhoto,
  deleteAddressPhoto,
} from '../api/addressApi';
import type { AddressResponse, LocationType } from '../api/addressApi';
import { ApiError } from '../api/apiClient';
import { AddressPlate } from '../components/AddressPlate';
import { SegmentedPicker } from '../components/SegmentedPicker';
import { useToast } from '../components/Toast';
import { compressImage, formatFileSize } from '../utils/imageCompressor';
import { validateStep2Details, validateStep3Photo } from '../utils/formValidation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Lock,
  Camera,
  Trash2,
  Check,
  Image as ImageIcon,
  BookOpen,
  ChevronDown,
} from 'lucide-react';

export const EditAddressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [address, setAddress] = useState<AddressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Champs modifiables
  const [locationType, setLocationType] = useState<LocationType>('MAISON');
  const [description, setDescription] = useState<string>('');
  const [listed, setListed] = useState<boolean>(false);
  const [showOwnerName, setShowOwnerName] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Gestion photo
  const [photoUploading, setPhotoUploading] = useState<boolean>(false);
  const [photoDeleting, setPhotoDeleting] = useState<boolean>(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reductionPercentage: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadAddress = async () => {
      if (!id) {
        setErrorMsg('Identifiant d’adresse manquant.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      try {
        const list = await getMyAddresses();
        const found = list.find((a) => a.id === id);
        if (!found) {
          setErrorMsg('Adresse introuvable ou accès non autorisé.');
        } else {
          setAddress(found);
          setLocationType(found.locationType);
          setDescription(found.description);
          setListed(found.listed ?? false);
          setShowOwnerName(found.showOwnerName ?? false);
        }
      } catch (err: any) {
        setErrorMsg(err instanceof ApiError ? err.message : 'Impossible de charger cette adresse.');
      } finally {
        setLoading(false);
      }
    };

    loadAddress();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    const validation = validateStep2Details(locationType, description);
    if (!validation.isValid) {
      setFormError(validation.error || 'Veuillez vérifier les informations saisies.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const updated = await updateAddress(address.id, {
        description: description.trim(),
        locationType,
        listed,
        showOwnerName: listed ? showOwnerName : false,
      });
      setAddress(updated);
      showToast('Modifications enregistrées.', 'success');
      navigate('/addresses/mine');
    } catch (err: any) {
      setFormError(
        err instanceof ApiError ? err.message : "Impossible d'enregistrer les modifications."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;

    const validation = validateStep3Photo(file);
    if (!validation.isValid) {
      showToast(validation.error || 'Image non valide.', 'error');
      return;
    }

    setPhotoUploading(true);
    try {
      const compressed = await compressImage(file);
      setCompressionStats({
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        reductionPercentage: compressed.reductionPercentage,
      });
      const updated = await uploadAddressPhoto(address.id, compressed.file);
      setAddress(updated);
      showToast('Photo mise à jour.', 'success');
    } catch (err: any) {
      showToast(
        err instanceof ApiError ? err.message : "Erreur lors de l'envoi de la photo.",
        'error'
      );
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!address) return;
    setPhotoDeleting(true);
    try {
      const updated = await deleteAddressPhoto(address.id);
      setAddress(updated);
      setCompressionStats(null);
      showToast('Photo supprimée.', 'info');
    } catch (err: any) {
      showToast(
        err instanceof ApiError ? err.message : 'Impossible de supprimer la photo.',
        'error'
      );
    } finally {
      setPhotoDeleting(false);
    }
  };

  const photoSrc = address?.photoUrl
    ? address.photoUrl.startsWith('http')
      ? address.photoUrl
      : `${import.meta.env.VITE_API_BASE_URL || ''}${address.photoUrl}`
    : null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 font-sans space-y-6">
      <div>
        <Link
          to="/addresses/mine"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C4D44] hover:text-[#1D528F] transition py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à mes adresses</span>
        </Link>
      </div>

      <div className="pb-4 border-b border-[#766B5B]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#231A15] tracking-tight">
          Modifier l'adresse
        </h1>
        <p className="text-xs sm:text-sm text-[#5C4D44] mt-1">
          Mettez à jour le type de lieu, le repère visuel ou la photo de façade.
        </p>
      </div>

      {loading ? (
        <div className="p-10 text-center rounded-xl bg-[#FBF7EF] border border-[#766B5B] space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#1D528F] mx-auto" />
          <p className="text-xs text-[#5C4D44]">Chargement de l'adresse...</p>
        </div>
      ) : errorMsg || !address ? (
        <div className="p-6 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg || 'Adresse introuvable.'}</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Encart Code et Position en lecture seule avec explication obligatoire */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#F2ECE1] border border-[#766B5B] space-y-4">
            <div className="w-full flex justify-center">
              <AddressPlate
                code={address.code}
                zone={address.zone}
                type={locationType}
                size="md"
                showCopy={false}
                className="w-full max-w-md"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#F2ECE1] border border-[#766B5B] text-xs">
              <span className="text-[#5C4D44] block text-[11px] font-semibold">Position enregistrée :</span>
              <span className="font-mono font-bold text-[#231A15]">
                {address.latitude.toFixed(6)}°N, {address.longitude.toFixed(6)}°O
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-[#231A15] bg-[#F2ECE1] p-3 rounded-lg border border-[#766B5B]">
              <Lock className="w-4 h-4 text-[#8A3112] shrink-0 mt-0.5" />
              <p className="leading-relaxed font-medium">
                Le code et la position ne peuvent pas changer. Pour déplacer ce lieu, archivez cette adresse et créez-en une nouvelle.
              </p>
            </div>
          </div>

          {/* Section champs modifiables */}
          <div className="p-5 sm:p-6 rounded-xl bg-[#FBF7EF] border border-[#766B5B] shadow-[0_2px_0_rgba(35,26,21,0.06)] space-y-5">
            <div className="space-y-2">
              <span className="block text-xs sm:text-sm font-bold text-[#231A15]">
                Type de lieu
              </span>
              <SegmentedPicker
                value={locationType}
                onChange={setLocationType}
                label="Type de lieu"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="edit-description"
                  className="text-xs sm:text-sm font-bold text-[#231A15]"
                >
                  Description et repère visuel
                </label>
                <span className="text-xs font-mono text-[#5C4D44]">
                  {description.length}/500
                </span>
              </div>
              <textarea
                id="edit-description"
                rows={4}
                maxLength={500}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex. : Portail bleu face à la boulangerie..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] text-sm text-[#231A15] placeholder:text-[#5C4D44] focus:outline-none focus:ring-2 focus:ring-[#1D528F]"
              />
            </div>

            {/* Section repliable Visibilité dans l'annuaire */}
            <details className="group border border-[#766B5B] rounded-xl p-3.5 bg-[#FBF7EF] text-xs">
              <summary className="font-semibold text-[#1D528F] cursor-pointer hover:underline list-none flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1D528F]" />
                  <span>Visibilité dans l'annuaire</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-[#5C4D44]" />
              </summary>

              <div className="mt-3 pt-3 border-t border-[#766B5B] space-y-3">
                <div className="flex items-start gap-2.5">
                  <input
                    id="edit-directory-listed"
                    type="checkbox"
                    checked={listed}
                    onChange={(e) => {
                      setListed(e.target.checked);
                      if (!e.target.checked) setShowOwnerName(false);
                    }}
                    className="mt-0.5 w-4 h-4 text-[#1D528F] border-[#766B5B] rounded focus:ring-[#1D528F]"
                  />
                  <div>
                    <label htmlFor="edit-directory-listed" className="font-bold text-[#231A15] cursor-pointer">
                      Figurer dans l'annuaire public
                    </label>
                    <p className="text-[11px] text-[#5C4D44] mt-0.5">
                      Permet aux livreurs, visiteurs et services de trouver cette adresse par son nom ou son repère visuel.
                    </p>
                  </div>
                </div>

                {listed && (
                  <div className="flex items-start gap-2.5 pl-6 pt-1">
                    <input
                      id="edit-directory-show-owner"
                      type="checkbox"
                      checked={showOwnerName}
                      onChange={(e) => setShowOwnerName(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#1D528F] border-[#766B5B] rounded focus:ring-[#1D528F]"
                    />
                    <div>
                      <label htmlFor="edit-directory-show-owner" className="font-bold text-[#231A15] cursor-pointer">
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

            {/* Photo de façade : remplacer ou supprimer */}
            <div className="space-y-3 pt-2 border-t border-[#766B5B]">
              <span className="block text-xs sm:text-sm font-bold text-[#231A15]">
                Photo de façade
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleSelectPhoto}
                className="hidden"
              />

              {photoSrc ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-[#766B5B] h-48 sm:h-56 bg-[#F2ECE1]">
                    <img
                      src={photoSrc}
                      alt={`Façade ${address.code}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoUploading || photoDeleting}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#1D528F] text-xs font-bold transition cursor-pointer disabled:opacity-50 touch-target"
                    >
                      {photoUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      <span>Remplacer la photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={photoUploading || photoDeleting}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#991B1B]/40 bg-[#FBF7EF] hover:bg-[#FEF2F2] text-[#991B1B] text-xs font-bold transition cursor-pointer disabled:opacity-50 touch-target"
                    >
                      {photoDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Supprimer la photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#F2ECE1] border border-[#766B5B] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-[#5C4D44]">
                    <ImageIcon className="w-4 h-4 text-[#5C4D44] shrink-0" />
                    <span>Aucune photo associée à cette adresse.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#1D528F] text-xs font-bold transition cursor-pointer disabled:opacity-50 touch-target shrink-0"
                  >
                    {photoUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                    <span>Ajouter une photo</span>
                  </button>
                </div>
              )}

              {compressionStats && (
                <p className="text-[11px] text-[#2A6B44] font-medium">
                  Image compressée avant envoi : {formatFileSize(compressionStats.originalSize)} →{' '}
                  {formatFileSize(compressionStats.compressedSize)}
                </p>
              )}
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#766B5B]">
              <Link
                to="/addresses/mine"
                className="px-4 py-2.5 rounded-lg border border-[#766B5B] bg-[#FBF7EF] hover:bg-[#F2ECE1] text-[#231A15] text-xs font-bold transition touch-target inline-flex items-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#B84A24] hover:bg-[#9A3816] text-white text-xs sm:text-sm font-bold transition shadow-[0_2px_0_rgba(35,26,21,0.12)] cursor-pointer disabled:opacity-50 touch-target"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Enregistrer les modifications</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/apiClient';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, Loader2, Check, X, AlertCircle, MapPin } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const getPasswordStrength = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasDigit) score++;
    return score;
  };

  const strengthScore = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    if (!passwordsMatch) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    if (strengthScore < 3) {
      setErrorMsg('Le mot de passe ne respecte pas tous les critères de sécurité.');
      return;
    }

    setLoading(true);

    try {
      await register(fullName, email, phoneNumber, password);
      showToast('Compte créé avec succès ! Connectez-vous.', 'success');
      navigate('/login');
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.data?.fieldErrors) {
          setFieldErrors(err.data.fieldErrors);
        }
        setErrorMsg(err.message || 'Erreur lors de la création de compte.');
      } else {
        setErrorMsg('Une erreur inattendue est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-4 sm:p-8 font-sans">
      <main className="max-w-lg lg:max-w-5xl mx-auto w-full pt-8 pb-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            {/* Brand Logo Cliquable */}
            <Link
              to="/"
              className="flex items-center gap-2.5 mx-auto lg:mx-0 mb-6 group focus-visible:outline-2 focus-visible:outline-[#1D528F] rounded-lg p-1 w-fit"
            >
              <div className="w-9 h-9 rounded-lg bg-[#1D528F] flex items-center justify-center text-white shadow-[0_2px_0_rgba(35,26,21,0.12)]">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-[#231A15] tracking-tight block leading-tight">
                  SamaAdresse
                </span>
                <span className="text-[11px] font-medium text-[#5C4D44] block">
                  Projet étudiant — Ziguinchor, Sénégal
                </span>
              </div>
            </Link>

            {/* Title */}
            <div className="text-center lg:text-left mb-8 space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#231A15]">
                Créer un compte
              </h1>
              <p className="text-sm text-[#5C4D44]">
                Créez votre compte pour enregistrer et partager vos adresses
              </p>
            </div>

            {/* Form Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#FBF7EF] border border-[#766B5B] shadow-sm">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B] text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-xs font-bold text-[#231A15]">
                Nom complet
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C4D44]">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mamadou Diallo"
                  className={`w-full pl-11 pr-4 py-3 bg-[#FBF7EF] border rounded-xl text-[#231A15] placeholder-[#5C4D44] text-sm outline-none transition ${
                    fieldErrors.fullName ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#766B5B] focus:border-[#1D528F]'
                  }`}
                />
              </div>
              {fieldErrors.fullName && <p className="text-xs text-[#DC2626] mt-1 font-medium">{fieldErrors.fullName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-[#231A15]">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C4D44]">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mamadou@exemple.sn"
                  className={`w-full pl-11 pr-4 py-3 bg-[#FBF7EF] border rounded-xl text-[#231A15] placeholder-[#5C4D44] text-sm outline-none transition ${
                    fieldErrors.email ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#766B5B] focus:border-[#1D528F]'
                  }`}
                />
              </div>
              {fieldErrors.email && <p className="text-xs text-[#DC2626] mt-1 font-medium">{fieldErrors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="phoneNumber" className="block text-xs font-bold text-[#231A15]">
                  Numéro de téléphone
                </label>
                <span className="text-[11px] text-[#1D528F] font-mono font-bold">Format: +221XXXXXXXXX</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C4D44]">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  id="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+221770000000"
                  className={`w-full pl-11 pr-4 py-3 bg-[#FBF7EF] border rounded-xl text-[#231A15] placeholder-[#5C4D44] text-sm outline-none transition ${
                    fieldErrors.phoneNumber ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#766B5B] focus:border-[#1D528F]'
                  }`}
                />
              </div>
              {fieldErrors.phoneNumber && <p className="text-xs text-[#DC2626] mt-1 font-medium">{fieldErrors.phoneNumber}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-[#231A15]">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C4D44]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-3 bg-[#FBF7EF] border rounded-xl text-[#231A15] placeholder-[#5C4D44] text-sm outline-none transition ${
                    fieldErrors.password ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#766B5B] focus:border-[#1D528F]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5C4D44] hover:text-[#231A15] transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-2 p-3 rounded-xl bg-[#F2ECE1] border border-[#766B5B]">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#5C4D44]">Force du mot de passe :</span>
                    <span
                      className={
                        strengthScore === 3
                          ? 'text-[#2A6B44] font-bold'
                          : strengthScore === 2
                          ? 'text-[#B84A24] font-bold'
                          : 'text-[#DC2626] font-bold'
                      }
                    >
                      {strengthScore === 3 ? 'Fort' : strengthScore === 2 ? 'Moyen' : 'Faible'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#E6DDD0] rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthScore >= 1 ? (strengthScore === 3 ? 'bg-[#2A6B44]' : strengthScore === 2 ? 'bg-[#B84A24]' : 'bg-[#DC2626]') : 'bg-transparent'
                      } w-1/3`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthScore >= 2 ? (strengthScore === 3 ? 'bg-[#2A6B44]' : 'bg-[#B84A24]') : 'bg-transparent'
                      } w-1/3`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthScore === 3 ? 'bg-[#2A6B44]' : 'bg-transparent'
                      } w-1/3`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1 text-[11px]">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-[#2A6B44] font-bold' : 'text-[#5C4D44]'}`}>
                      {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>≥ 8 car.</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasUppercase ? 'text-[#2A6B44] font-bold' : 'text-[#5C4D44]'}`}>
                      {hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>1 Majuscule</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasDigit ? 'text-[#2A6B44] font-bold' : 'text-[#5C4D44]'}`}>
                      {hasDigit ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>1 Chiffre</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#231A15]">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5C4D44]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 bg-[#FBF7EF] border rounded-xl text-[#231A15] placeholder-[#5C4D44] text-sm outline-none transition ${
                    confirmPassword.length > 0 && !passwordsMatch
                      ? 'border-[#DC2626] focus:border-[#DC2626]'
                      : 'border-[#766B5B] focus:border-[#1D528F]'
                  }`}
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-[#DC2626] mt-1 font-medium">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || strengthScore < 3 || !passwordsMatch}
              className="w-full mt-4 py-3.5 px-4 rounded-xl bg-[#B84A24] hover:bg-[#9A3816] text-[#FBF7EF] font-bold text-sm shadow-sm active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Création du compte...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Créer mon compte</span>
                </>
              )}
            </button>
          </form>

          {/* Login Redirect */}
          <div className="mt-6 text-center text-sm text-[#5C4D44]">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="font-bold text-[#1D528F] hover:text-[#153C6B] underline transition">
              Se connecter
            </Link>
          </div>
        </div>
      </div>

      {/* Panneau latéral illustré (desktop uniquement) */}
      <div className="hidden lg:block relative rounded-2xl overflow-hidden border border-[#766B5B] shadow-sm bg-[#F2ECE1] h-full min-h-[580px]">
        <img
          src="/images/panneau-connexion-640w.webp"
          srcSet="/images/panneau-connexion-640w.webp 640w, /images/panneau-connexion-1024w.webp 1024w"
          sizes="(min-width: 1024px) 480px, 0px"
          alt=""
          loading="lazy"
          decoding="async"
          width="1024"
          height="1536"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  </main>
</div>
  );
};

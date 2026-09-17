import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/apiClient';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, Loader2, Check, X, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Senegal gradient bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 z-50" />

      <main className="max-w-lg mx-auto w-full pt-8 pb-12 flex-1 flex flex-col justify-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium w-fit mx-auto mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Sénégal 🇸🇳 — Inscription SamaAdresse
        </div>

        {/* Title */}
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Créer un compte Propriétaire
          </h1>
          <p className="text-sm text-slate-400">
            Rejoignez le réseau national d'adressage géolocalisé
          </p>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-sm flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Nom complet
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mamadou Diallo"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-950/60 border rounded-xl text-slate-100 placeholder-slate-600 text-sm outline-none transition ${
                    fieldErrors.fullName ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
              </div>
              {fieldErrors.fullName && <p className="text-xs text-red-400 mt-1">{fieldErrors.fullName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mamadou@exemple.sn"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-950/60 border rounded-xl text-slate-100 placeholder-slate-600 text-sm outline-none transition ${
                    fieldErrors.email ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
              </div>
              {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="phoneNumber" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Numéro de téléphone
                </label>
                <span className="text-[11px] text-emerald-400 font-mono">Format: +221XXXXXXXXX</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  id="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+221770000000"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-950/60 border rounded-xl text-slate-100 placeholder-slate-600 text-sm outline-none transition ${
                    fieldErrors.phoneNumber ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
              </div>
              {fieldErrors.phoneNumber && <p className="text-xs text-red-400 mt-1">{fieldErrors.phoneNumber}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-11 py-3 bg-slate-950/60 border rounded-xl text-slate-100 placeholder-slate-600 text-sm outline-none transition ${
                    fieldErrors.password ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-400">Force du mot de passe :</span>
                    <span
                      className={
                        strengthScore === 3
                          ? 'text-emerald-400 font-bold'
                          : strengthScore === 2
                          ? 'text-amber-400 font-bold'
                          : 'text-red-400 font-bold'
                      }
                    >
                      {strengthScore === 3 ? 'Fort' : strengthScore === 2 ? 'Moyen' : 'Faible'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthScore >= 1 ? (strengthScore === 3 ? 'bg-emerald-500' : strengthScore === 2 ? 'bg-amber-500' : 'bg-red-500') : 'bg-transparent'
                      } w-1/3`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthScore >= 2 ? (strengthScore === 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-transparent'
                      } w-1/3`}
                    />
                    <div
                      className={`h-full transition-all duration-300 ${
                        strengthScore === 3 ? 'bg-emerald-500' : 'bg-transparent'
                      } w-1/3`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1 text-[11px]">
                    <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>≥ 8 car.</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>1 Majuscule</span>
                    </div>
                    <div className={`flex items-center gap-1 ${hasDigit ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {hasDigit ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>1 Chiffre</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-11 pr-4 py-3 bg-slate-950/60 border rounded-xl text-slate-100 placeholder-slate-600 text-sm outline-none transition ${
                    confirmPassword.length > 0 && !passwordsMatch
                      ? 'border-red-500/60 focus:border-red-500'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || strengthScore < 3 || !passwordsMatch}
              className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-6 text-center text-sm text-slate-400">
            Vous avez déjà un compte ?{' '}
            <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition">
              Se connecter
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-600 py-4">
        © 2026 SamaAdresse — Plateforme d'adressage géolocalisé
      </footer>
    </div>
  );
};

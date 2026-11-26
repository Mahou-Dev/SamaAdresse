import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/apiClient';
import { AuthLayout } from '../app/layouts/AuthLayout';
import { cn } from '../utils/cn';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  Check,
  X,
  AlertCircle,
  MapPin,
  ArrowLeft,
} from 'lucide-react';

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
  const submittingRef = useRef(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const strengthScore = Number(hasMinLength) + Number(hasUppercase) + Number(hasDigit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
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

    submittingRef.current = true;
    setLoading(true);

    try {
      await register(fullName.trim(), email.trim(), phoneNumber.trim(), password);
      showToast('Compte créé avec succès ! Connectez-vous.', 'success');
      navigate('/login');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.data?.fieldErrors && typeof err.data.fieldErrors === 'object') {
          setFieldErrors(err.data.fieldErrors as Record<string, string>);
        }
        setErrorMsg(err.message || 'Erreur lors de la création de compte.');
      } else {
        setErrorMsg('Une erreur inattendue est survenue.');
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const inputBase =
    'w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-canvas border rounded-xl text-ink placeholder:text-ink-subtle text-sm outline-none transition';

  return (
    <AuthLayout
      aside={
        <div className="relative rounded-3xl overflow-hidden border border-border shadow-md bg-surface-secondary min-h-[580px]">
          <img
            src="/images/panneau-connexion-640w.webp"
            srcSet="/images/panneau-connexion-640w.webp 640w, /images/panneau-connexion-1024w.webp 1024w"
            sizes="(min-width: 1024px) 480px, 0px"
            alt=""
            loading="lazy"
            decoding="async"
            width={1024}
            height={1536}
            className="w-full h-full object-cover min-h-[580px]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent p-6 text-ink-inverse space-y-1">
            <p className="text-sm font-bold">Créez et partagez vos adresses au Sénégal</p>
            <p className="text-xs text-ink-inverse/85 leading-relaxed">
              Code court immuable, plaque numérique, QR Code et mode hors ligne inclus gratuitement.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Marque & retour */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution rounded-xl py-1 pr-2"
          >
            <span className="w-9 h-9 rounded-xl bg-brand text-ink-inverse flex items-center justify-center shadow-xs group-hover:bg-brand-hover transition-colors">
              <MapPin className="w-5 h-5" aria-hidden="true" />
            </span>
            <span>
              <span className="font-extrabold text-xl text-ink tracking-tight block leading-none">
                SamaAdresse
              </span>
              <span className="text-[11px] font-medium text-ink-muted block mt-0.5 leading-none">
                Adressage au Sénégal
              </span>
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Accueil</span>
          </Link>
        </div>

        {/* Titre */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
            Créer un compte
          </h1>
          <p className="text-sm text-ink-muted">
            Créez votre compte pour enregistrer et partager vos adresses.
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="p-6 sm:p-7 rounded-2xl bg-surface-elevated border border-border shadow-xs">
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-danger-soft border border-danger-border text-danger text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="leading-snug font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom complet */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-xs font-semibold text-ink">
                Nom complet
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <User className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mamadou Diallo"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  className={cn(
                    inputBase,
                    fieldErrors.fullName
                      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger-soft'
                      : 'border-border-strong focus:border-institution focus:ring-2 focus:ring-institution-soft'
                  )}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-xs text-danger font-medium">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-ink">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mamadou@exemple.sn"
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={cn(
                    inputBase,
                    fieldErrors.email
                      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger-soft'
                      : 'border-border-strong focus:border-institution focus:ring-2 focus:ring-institution-soft'
                  )}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-danger font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Téléphone */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center gap-2">
                <label htmlFor="phoneNumber" className="block text-xs font-semibold text-ink">
                  Numéro de téléphone
                </label>
                <span className="text-[11px] text-institution font-mono font-semibold">
                  +221XXXXXXXXX
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Phone className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+221770000000"
                  aria-invalid={Boolean(fieldErrors.phoneNumber)}
                  className={cn(
                    inputBase,
                    fieldErrors.phoneNumber
                      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger-soft'
                      : 'border-border-strong focus:border-institution focus:ring-2 focus:ring-institution-soft'
                  )}
                />
              </div>
              {fieldErrors.phoneNumber && (
                <p className="text-xs text-danger font-medium">{fieldErrors.phoneNumber}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-ink">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-invalid={Boolean(fieldErrors.password)}
                  className={cn(
                    inputBase,
                    'pr-11',
                    fieldErrors.password
                      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger-soft'
                      : 'border-border-strong focus:border-institution focus:ring-2 focus:ring-institution-soft'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-ink transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2 space-y-2 p-3 rounded-xl bg-surface border border-border">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-ink-muted">Force du mot de passe</span>
                    <span
                      className={cn(
                        'font-bold',
                        strengthScore === 3
                          ? 'text-success'
                          : strengthScore === 2
                          ? 'text-warning'
                          : 'text-danger'
                      )}
                    >
                      {strengthScore === 3 ? 'Fort' : strengthScore === 2 ? 'Moyen' : 'Faible'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden flex gap-1">
                    <div
                      className={cn(
                        'h-full transition-all duration-300 w-1/3 rounded-full',
                        strengthScore >= 1
                          ? strengthScore === 3
                            ? 'bg-success'
                            : strengthScore === 2
                            ? 'bg-warning-solid'
                            : 'bg-danger'
                          : 'bg-transparent'
                      )}
                    />
                    <div
                      className={cn(
                        'h-full transition-all duration-300 w-1/3 rounded-full',
                        strengthScore >= 2
                          ? strengthScore === 3
                            ? 'bg-success'
                            : 'bg-warning-solid'
                          : 'bg-transparent'
                      )}
                    />
                    <div
                      className={cn(
                        'h-full transition-all duration-300 w-1/3 rounded-full',
                        strengthScore === 3 ? 'bg-success' : 'bg-transparent'
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-0.5 text-[11px]">
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        hasMinLength ? 'text-success font-semibold' : 'text-ink-muted'
                      )}
                    >
                      {hasMinLength ? (
                        <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3 h-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>≥ 8 car.</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        hasUppercase ? 'text-success font-semibold' : 'text-ink-muted'
                      )}
                    >
                      {hasUppercase ? (
                        <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3 h-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>1 majuscule</span>
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1',
                        hasDigit ? 'text-success font-semibold' : 'text-ink-muted'
                      )}
                    >
                      {hasDigit ? (
                        <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3 h-3 shrink-0" aria-hidden="true" />
                      )}
                      <span>1 chiffre</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-ink">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                  className={cn(
                    inputBase,
                    confirmPassword.length > 0 && !passwordsMatch
                      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger-soft'
                      : 'border-border-strong focus:border-institution focus:ring-2 focus:ring-institution-soft'
                  )}
                />
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-danger font-medium">
                  Les mots de passe ne correspondent pas.
                </p>
              )}
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading || strengthScore < 3 || !passwordsMatch}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[46px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Création du compte…</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  <span>Créer mon compte</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-border text-center text-sm text-ink-muted">
            Vous avez déjà un compte ?{' '}
            <Link
              to="/login"
              className="font-semibold text-institution hover:text-institution-hover underline underline-offset-2 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

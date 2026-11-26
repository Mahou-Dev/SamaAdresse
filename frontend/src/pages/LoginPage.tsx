import React, { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/apiClient';
import { AuthLayout } from '../app/layouts/AuthLayout';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  ArrowLeft,
} from 'lucide-react';

interface LoginLocationState {
  from?: { pathname?: string; search?: string };
  sessionExpired?: boolean;
}

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as LoginLocationState | null) ?? null;
  const fromPath = state?.from?.pathname
    ? `${state.from.pathname}${state.from.search || ''}`
    : '/tableau-de-bord';
  const sessionExpired = Boolean(state?.sessionExpired);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      showToast('Connexion réussie ! Bienvenue sur SamaAdresse.', 'success');
      navigate(fromPath, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Une erreur inattendue est survenue.');
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      aside={
        <div className="relative rounded-3xl overflow-hidden border border-border shadow-md bg-surface-secondary min-h-[500px]">
          <img
            src="/images/panneau-connexion-640w.webp"
            srcSet="/images/panneau-connexion-640w.webp 640w, /images/panneau-connexion-1024w.webp 1024w"
            sizes="(min-width: 1024px) 460px, 0px"
            alt=""
            loading="lazy"
            decoding="async"
            width={1024}
            height={1536}
            className="w-full h-full object-cover min-h-[500px]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent p-6 text-ink-inverse space-y-1">
            <p className="text-sm font-bold">Votre plaque d'adresse permanente</p>
            <p className="text-xs text-ink-inverse/85 leading-relaxed">
              Gérez vos adresses géolocalisées, vos QR codes et votre accès hors ligne en toute sécurité.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Retour & Marque */}
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
            Espace personnel
          </h1>
          <p className="text-sm text-ink-muted">
            Connectez-vous pour gérer et partager vos adresses.
          </p>
        </div>

        {/* Alerte session expirée si redirigé suite à 401 */}
        {sessionExpired && !errorMsg && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-warning-soft border border-warning-border text-warning text-xs sm:text-sm flex items-start gap-2.5"
          >
            <Clock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Votre session a expiré. Reconnectez-vous pour continuer.</span>
          </div>
        )}

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
                  placeholder="nom@exemple.sn"
                  className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-canvas border border-border-strong focus:border-institution focus:ring-2 focus:ring-institution-soft rounded-xl text-ink placeholder:text-ink-subtle text-sm outline-none transition"
                />
              </div>
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 min-h-[44px] bg-canvas border border-border-strong focus:border-institution focus:ring-2 focus:ring-institution-soft rounded-xl text-ink placeholder:text-ink-subtle text-sm outline-none transition"
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
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-1 rounded-xl bg-brand hover:bg-brand-hover active:bg-brand-active text-ink-inverse font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[46px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-border text-center text-sm text-ink-muted">
            Vous n'avez pas encore de compte ?{' '}
            <Link
              to="/register"
              className="font-semibold text-institution hover:text-institution-hover underline underline-offset-2 transition-colors"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

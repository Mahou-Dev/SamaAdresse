import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { ApiError } from '../api/apiClient';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle, MapPin } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(email, password);
      showToast('Connexion réussie ! Bienvenue sur SamaAdresse.', 'success');
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Une erreur inattendue est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-4 sm:p-8 font-sans">
      <main className="max-w-md lg:max-w-4xl mx-auto w-full pt-8 pb-12 flex-1 flex flex-col justify-center">
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
                Espace personnel
              </h1>
              <p className="text-sm text-[#5C4D44]">
                Connectez-vous pour gérer et partager vos adresses
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

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
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
                      placeholder="nom@exemple.sn"
                      className="w-full pl-11 pr-4 py-3 bg-[#FBF7EF] border border-[#766B5B] focus:border-[#1D528F] focus:ring-1 focus:ring-[#1D528F] rounded-xl text-[#231A15] placeholder-[#5C4D44] text-sm outline-none transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
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
                      className="w-full pl-11 pr-11 py-3 bg-[#FBF7EF] border border-[#766B5B] focus:border-[#1D528F] focus:ring-1 focus:ring-[#1D528F] rounded-xl text-[#231A15] placeholder-[#5C4D44] text-sm outline-none transition"
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
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#B84A24] hover:bg-[#9A3816] text-[#FBF7EF] font-bold text-sm shadow-sm active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connexion en cours...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Se connecter</span>
                    </>
                  )}
                </button>
              </form>

              {/* Register Redirect */}
              <div className="mt-6 text-center text-sm text-[#5C4D44]">
                Vous n'avez pas encore de compte ?{' '}
                <Link to="/register" className="font-bold text-[#1D528F] hover:text-[#153C6B] underline transition">
                  S'inscrire
                </Link>
              </div>
            </div>
          </div>

          {/* Panneau latéral illustré (desktop uniquement) */}
          <div className="hidden lg:block relative rounded-2xl overflow-hidden border border-[#766B5B] shadow-sm bg-[#F2ECE1] h-full min-h-[460px]">
            <img
              src="/images/panneau-connexion-640w.webp"
              srcSet="/images/panneau-connexion-640w.webp 640w, /images/panneau-connexion-1024w.webp 1024w"
              sizes="(min-width: 1024px) 420px, 0px"
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

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
    <div className="min-h-screen bg-[#FBF9F5] text-[#231A15] flex flex-col justify-between p-4 sm:p-8 font-sans">
      <main className="max-w-md mx-auto w-full pt-8 pb-12 flex-1 flex flex-col justify-center">
        {/* Header Logo */}
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F2ECE1] border border-[#E6DDD0] text-[#1D528F] font-bold text-xs w-fit mx-auto mb-6 hover:bg-[#E6DDD0] transition">
          <MapPin className="w-4 h-4 text-[#B84A24]" />
          <span>SamaAdresse • Accueil</span>
        </Link>

        {/* Title */}
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#231A15]">
            Espace Utilisateur
          </h1>
          <p className="text-sm text-[#5C4D44]">
            Connectez-vous pour gérer et partager vos plaques d'adresse
          </p>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#D4CEBF] shadow-sm">
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
                Adresse Email
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
                  className="w-full pl-11 pr-4 py-3 bg-[#FBF9F5] border border-[#D4CEBF] focus:border-[#1D528F] focus:ring-1 focus:ring-[#1D528F] rounded-xl text-[#231A15] placeholder-[#8C7B70] text-sm outline-none transition"
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
                  className="w-full pl-11 pr-11 py-3 bg-[#FBF9F5] border border-[#D4CEBF] focus:border-[#1D528F] focus:ring-1 focus:ring-[#1D528F] rounded-xl text-[#231A15] placeholder-[#8C7B70] text-sm outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5C4D44] hover:text-[#231A15] transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#B84A24] hover:bg-[#963919] text-white font-bold text-sm shadow-sm active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Se Connecter</span>
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
      </main>

      <footer className="text-center text-xs text-[#5C4D44] py-4">
        © 2026 SamaAdresse — Plateforme Nationale d'Adressage Géolocalisé
      </footer>
    </div>
  );
};

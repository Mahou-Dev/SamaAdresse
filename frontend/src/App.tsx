import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle, RefreshCw, Server, Database, Layout } from 'lucide-react';

interface HealthResponse {
  status: string;
}

export function App() {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const data: HealthResponse = await response.json();
      setHealthStatus(data.status);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
      setHealthStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Decorative Senegal gradient bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full pt-8 pb-12 flex-1 flex flex-col justify-center">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-medium w-fit mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Sénégal 🇸🇳 — Squelette Technique Monorepo
        </div>

        {/* Title Section */}
        <div className="mb-10 space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
            SamaAdresse — Mon Adresse
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl">
            Plateforme de génération d'adresses géolocalisées pour le Sénégal.
          </p>
        </div>

        {/* Healthcheck Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Statut du Backend API</h2>
                <p className="text-sm text-slate-400">Test de connexion vers GET /api/health</p>
              </div>
            </div>

            <button
              onClick={fetchHealthStatus}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 transition text-sm font-medium text-slate-200 border border-slate-700/60 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              {loading ? 'Vérification...' : 'Actualiser'}
            </button>
          </div>

          {/* Status Display */}
          <div className="flex items-center justify-between p-4 sm:p-5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-sm font-semibold text-slate-300">Endpoint: /api/health</span>

            {loading ? (
              <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Chargement...
              </span>
            ) : healthStatus === 'UP' ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                STATUS : UP
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm">
                <XCircle className="w-4 h-4" />
                {error ? `HORS LIGNE (${error})` : 'INDISPONIBLE'}
              </span>
            )}
          </div>
        </div>

        {/* Stack Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center gap-3 text-emerald-400 mb-2">
              <Server className="w-5 h-5" />
              <h3 className="font-bold text-slate-200">Backend</h3>
            </div>
            <p className="text-sm text-slate-400">Spring Boot 3.4.3</p>
            <p className="text-xs text-slate-500 mt-1">Java 21 (Eclipse Temurin)</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <Layout className="w-5 h-5" />
              <h3 className="font-bold text-slate-200">Frontend PWA</h3>
            </div>
            <p className="text-sm text-slate-400">React + Vite + TS</p>
            <p className="text-xs text-slate-500 mt-1">Tailwind CSS + vite-plugin-pwa</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="flex items-center gap-3 text-red-400 mb-2">
              <Database className="w-5 h-5" />
              <h3 className="font-bold text-slate-200">Base de données</h3>
            </div>
            <p className="text-sm text-slate-400">PostgreSQL 15+</p>
            <p className="text-xs text-slate-500 mt-1">Variables DB_URL / DB_USER / DB_PASSWORD</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full pt-6 border-t border-slate-900 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© 2026 SamaAdresse — Tous droits réservés</span>
        <span>Squelette fonctionnel monorepo (sans logique métier)</span>
      </footer>
    </div>
  );
}

export default App;

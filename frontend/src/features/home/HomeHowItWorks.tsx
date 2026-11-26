import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    number: '1',
    title: 'Capturer la position',
    description:
      "Relevez la position GPS devant l'entrée de votre bâtiment ou ajustez le repère sur la carte, même sans connexion.",
    imageBase: '/images/etape-1-localiser',
    badgeClass: 'bg-brand text-ink-inverse',
  },
  {
    number: '2',
    title: 'Obtenir un code et une plaque',
    description:
      'SamaAdresse attribue un code permanent rattaché à votre quartier et génère votre plaque imprimable avec QR code.',
    imageBase: '/images/etape-2-plaque',
    badgeClass: 'bg-institution text-ink-inverse',
  },
  {
    number: '3',
    title: 'Partager et guider',
    description:
      "Envoyez votre lien ou affichez votre plaque : vos visiteurs voient la photo de façade et lancent l'itinéraire en un clic.",
    imageBase: '/images/etape-3-partager',
    badgeClass: 'bg-nature text-ink-inverse',
  },
] as const;

const CODE_SEGMENTS = [
  { segment: 'ZIG', label: 'Zone / Ville', detail: 'Ex. Ziguinchor, Dakar (DKR), Saint-Louis (SL)' },
  { segment: 'KBG', label: 'Quartier', detail: 'Code normalisé issu du découpage territorial' },
  { segment: '4271', label: 'Identifiant unique', detail: 'Numéro permanent attaché à la position physique' },
] as const;

export const HomeHowItWorks: React.FC = () => {
  return (
    <section
      aria-labelledby="home-how-it-works-title"
      className="w-full border-y border-border bg-surface py-14 sm:py-20"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* En-tête */}
        <div className="max-w-2xl space-y-2">
          <h2
            id="home-how-it-works-title"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink"
          >
            Comment fonctionne SamaAdresse
          </h2>
          <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
            Trois étapes concrètes pour transformer des repères oraux imprécis en une adresse fiable, partageable et géolocalisée.
          </p>
        </div>

        {/* 3 étapes illustrées */}
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="flex flex-col rounded-2xl border border-border bg-surface-elevated overflow-hidden shadow-xs"
            >
              <div className="aspect-[4/3] w-full bg-surface-secondary overflow-hidden border-b border-border">
                <img
                  src={`${step.imageBase}-480w.webp`}
                  srcSet={`${step.imageBase}-320w.webp 320w, ${step.imageBase}-480w.webp 480w, ${step.imageBase}-800w.webp 800w`}
                  sizes="(max-width: 768px) 100vw, 380px"
                  width="480"
                  height="480"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full font-mono text-xs font-extrabold flex items-center justify-center shrink-0 ${step.badgeClass}`}
                  >
                    {step.number}
                  </span>
                  <h3 className="text-base font-bold text-ink leading-snug">{step.title}</h3>
                </div>
                <p className="text-sm text-ink-secondary leading-relaxed">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Avant / Après & Anatomie d'un code */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Avant / Après */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-surface-elevated p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Avant SamaAdresse
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-warning-soft text-warning border border-warning-border">
                  Repère oral
                </span>
              </div>

              <blockquote className="text-sm sm:text-base font-medium text-ink italic leading-relaxed border-l-3 border-border-strong pl-4">
                « Après la grande mosquée, troisième maison à gauche, portail métallique vert. »
              </blockquote>

              <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                Long à dicter au téléphone, introuvable sur carte et source fréquente d'erreurs de livraison.
              </p>
            </div>

            <div className="pt-4 border-t border-border flex items-start gap-2.5 text-xs text-ink-secondary">
              <WifiOff className="w-4 h-4 text-institution shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Capture hors ligne incluse :</strong> enregistrez sur le terrain, l'application synchronise automatiquement au retour du réseau.
              </span>
            </div>
          </div>

          {/* Anatomie d'un code */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-surface-elevated p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-ink">
                  Lire un code SamaAdresse
                </h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success-soft border border-success-border px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Permanent &amp; géolocalisé</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-muted">
                Chaque code se lit en trois segments clairs, faciles à retenir et à transmettre.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CODE_SEGMENTS.map((item) => (
                <div
                  key={item.segment}
                  className="p-4 rounded-xl bg-surface border border-border space-y-1.5"
                >
                  <div className="font-mono text-xl font-extrabold text-institution tracking-tight">
                    {item.segment}
                  </div>
                  <div className="text-xs font-bold text-ink">{item.label}</div>
                  <p className="text-xs text-ink-muted leading-snug">{item.detail}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              Une fois attribué, le code ne change pas : il reste lié à la position physique du lieu et s'accompagne de sa photo de façade, de sa carte et de son QR code.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

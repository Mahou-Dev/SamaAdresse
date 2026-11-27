import { MapPin, QrCode, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { BrandMark } from './Brand'
import { HeroScene } from './HeroScene'

export function AuthShell({ kicker, title, intro, children, footer }: {
  kicker: string
  title: string
  intro: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <aside className="auth-card__brand" aria-hidden="true">
          <HeroScene />
          <div className="auth-card__brand-inner">
            <BrandMark />
            <p className="auth-card__name">Sama<span>Adresse</span></p>
            <p className="auth-card__slogan">Une adresse, un monde de possibilités</p>
            <ul>
              <li><MapPin /> Localisez avec précision</li>
              <li><ShieldCheck /> Adresses vérifiées</li>
              <li><QrCode /> Partagez par code, lien ou QR</li>
            </ul>
          </div>
        </aside>
        <section className="auth-card__form" aria-labelledby="auth-title">
          <span className="kicker">{kicker}</span>
          <h1 id="auth-title">{title}</h1>
          <p className="auth-card__intro">{intro}</p>
          {children}
          <div className="auth-card__footer">{footer}</div>
        </section>
      </div>
    </main>
  )
}

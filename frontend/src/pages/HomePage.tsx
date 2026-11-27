import {
  ArrowRight, CirclePlus, Languages, Map as MapIcon, MapPin, QrCode, Search, Share2, ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/Brand'
import { CodeLookup } from '../components/CodeLookup'
import { HeroScene } from '../components/HeroScene'

const FEATURES = [
  { icon: MapPin, title: 'Géolocalisation précise', text: 'GPS du téléphone ou point placé sur la carte' },
  { icon: QrCode, title: 'QR code universel', text: 'Généré immédiatement pour chaque adresse active' },
  { icon: Share2, title: 'Partage facile', text: 'Lien, code, SMS ou applications' },
  { icon: MapIcon, title: 'Cartes interactives', text: 'OpenStreetMap et calcul d’itinéraire' },
  { icon: ShieldCheck, title: 'Sécurité et modération', text: 'Comptes protégés, contrôle de visibilité et signalements' },
]

export function HomePage() {
  return (
    <main>
      <section className="hero" id="accueil">
        <HeroScene />
        <div className="hero__inner">
          <div className="hero__copy">
            <div className="hero__brand">
              <BrandMark />
              <div>
                <p className="hero__brand-name">Sama<span>Adresse</span></p>
                <p className="hero__slogan">Une adresse, un monde de possibilités</p>
              </div>
            </div>
            <p className="hero__script" aria-hidden="true">SamaAdresse, le Sénégal plus proche !</p>
            <h1 className="hero__title">
              Localisez <span aria-hidden="true">•</span> Enregistrez <span aria-hidden="true">•</span> Partagez
            </h1>
            <p className="hero__intro">
              Des adresses géolocalisées, simples, sécurisées et accessibles partout au Sénégal — même là où la rue n’a pas de nom.
            </p>
            <div className="hero__actions">
              <Link className="button button-primary" to="/mes-adresses/nouvelle"><CirclePlus aria-hidden="true" />Créer une adresse</Link>
              <Link className="button button-ghost-dark" to="/recherche"><Search aria-hidden="true" />Rechercher une adresse</Link>
            </div>
          </div>

          <div className="hero-phone" aria-label="Aperçu de l’application mobile" role="group">
            <div className="hero-phone__screen">
              <div className="hero-phone__status" aria-hidden="true"><span>9:41</span><span className="hero-phone__notch" /><span>●●●</span></div>
              <div className="hero-phone__brand">
                <BrandMark />
                <p>Sama<span>Adresse</span></p>
                <small>Une adresse, un monde de possibilités</small>
              </div>
              <div className="hero-phone__card">
                <span className="hero-phone__tag">Exemple</span>
                <small>Code SamaAdresse</small>
                <strong>ZIG-KBG-4271</strong>
                <span>Maison · Boucotte · Ziguinchor</span>
                <ul>
                  <li><MapPin aria-hidden="true" />Point GPS</li>
                  <li><ShieldCheck aria-hidden="true" />Active</li>
                  <li><QrCode aria-hidden="true" />QR code</li>
                </ul>
              </div>
              <Link className="button button-primary button-block" to="/inscription">Commencer</Link>
              <Link className="hero-phone__secondary" to="/connexion">J’ai déjà un compte</Link>
              <span className="hero-phone__lang"><Languages aria-hidden="true" />Français</span>
            </div>
          </div>
        </div>

        <ul className="hero-features" aria-label="Fonctionnalités">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="hero-features__icon"><Icon aria-hidden="true" /></span>
              <strong>{title}</strong>
              <small>{text}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-search" id="recherche" aria-labelledby="search-title">
        <div className="home-search__copy">
          <span className="kicker">Annuaire SamaAdresse</span>
          <h2 id="search-title">Un code en main ? <span>Retrouvez le lieu.</span></h2>
          <p>Saisissez le code reçu par message ou lu sur un QR code pour ouvrir la fiche de l’adresse.</p>
        </div>
        <div className="panel home-search__panel">
          <CodeLookup />
        </div>
      </section>

      <section className="home-steps" id="fonctionnement" aria-labelledby="steps-title">
        <span className="kicker">Simple comme bonjour</span>
        <h2 id="steps-title">Une adresse, <span>en trois étapes.</span></h2>
        <ol className="home-steps__grid">
          <li>
            <span className="home-steps__num">01</span>
            <span className="home-steps__icon home-steps__icon--blue"><MapPin aria-hidden="true" /></span>
            <h3>Repérez le lieu</h3>
            <p>Placez le point sur la carte ou utilisez la position GPS de votre téléphone, avec votre accord.</p>
          </li>
          <li>
            <span className="home-steps__num">02</span>
            <span className="home-steps__icon home-steps__icon--green"><CirclePlus aria-hidden="true" /></span>
            <h3>Décrivez l’endroit</h3>
            <p>Ajoutez un nom, des repères visuels et une photo facultative. Votre code court est généré instantanément.</p>
          </li>
          <li>
            <span className="home-steps__num">03</span>
            <span className="home-steps__icon home-steps__icon--cyan"><Share2 aria-hidden="true" /></span>
            <h3>Partagez simplement</h3>
            <p>Transmettez le code, le lien, le SMS ou le QR code à vos proches, livreurs et visiteurs.</p>
          </li>
        </ol>
      </section>

      <section className="home-cta">
        <div>
          <h2>Plus besoin de dire « après le grand arbre ».</h2>
          <p>Un code lisible relié à un point précis, pour des livraisons, visites et rendez-vous plus simples. La fiche publique ne révèle jamais votre e-mail ni votre téléphone.</p>
        </div>
        <Link className="button button-primary" to="/inscription">Créer mon compte <ArrowRight aria-hidden="true" /></Link>
      </section>
    </main>
  )
}

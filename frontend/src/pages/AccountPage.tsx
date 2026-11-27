import {
  Bell, CalendarDays, Globe, KeyRound, Languages, LogOut, Mail, MonitorSmartphone, Phone, ShieldCheck, UserRound, WifiOff,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnline } from '../hooks/useOnline'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useAuth } from '../auth/authContext'
import { formatDate, initials } from '../lib/labels'

export function AccountPage() {
  const { user, expiresAt, logout } = useAuth()
  const navigate = useNavigate()
  const online = useOnline()
  const pwa = useInstallPrompt()
  if (!user) return null

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <main className="app-page app-page--narrow">
      <div className="app-page__head"><div><h1>Paramètres</h1><p className="muted">Votre compte, votre session et les préférences de l’application.</p></div></div>
      <div className="settings">
        <section className="panel account-card" aria-labelledby="settings-account">
          <div className="account-card__head">
            <span className="avatar avatar--lg" aria-hidden="true">{initials(user.displayName)}</span>
            <div>
              <h2 id="settings-account">{user.displayName}</h2>
              <p className="muted">{user.email}</p>
            </div>
            <span className="status-badge status-badge--active account-card__role">{user.role === 'ADMIN' ? 'Administrateur' : 'Propriétaire'}</span>
          </div>
          <dl className="info-list">
            <div><span className="info-icon"><UserRound aria-hidden="true" /></span><span><dt>Nom complet</dt><dd>{user.displayName}</dd></span></div>
            <div><span className="info-icon"><Mail aria-hidden="true" /></span><span><dt>E-mail de connexion</dt><dd>{user.email}</dd></span></div>
            {user.phoneNumber && <div><span className="info-icon"><Phone aria-hidden="true" /></span><span><dt>Téléphone</dt><dd>{user.phoneNumber}</dd></span></div>}
            <div><span className="info-icon"><CalendarDays aria-hidden="true" /></span><span><dt>Membre depuis</dt><dd>{formatDate(user.createdAt)}</dd></span></div>
          </dl>
        </section>

        <section className="panel" aria-labelledby="settings-security">
          <h2 className="panel-title" id="settings-security"><ShieldCheck aria-hidden="true" />Sécurité</h2>
          <ul className="settings-list">
            {expiresAt && <SettingRow icon={KeyRound} label="Jeton d’accès actif jusqu’au" value={`${formatDate(expiresAt)} (renouvelé automatiquement)`} />}
            <SettingRow icon={ShieldCheck} label="Vos données publiques" value="Votre e-mail et votre téléphone ne sont jamais publiés ; votre nom uniquement si vous l’autorisez par adresse" />
            <SettingRow icon={KeyRound} label="Modifier le mot de passe" soon />
          </ul>
          <button className="button button-danger" type="button" onClick={() => void handleLogout()}><LogOut aria-hidden="true" />Se déconnecter</button>
        </section>

        <section className="panel" aria-labelledby="settings-app">
          <h2 className="panel-title" id="settings-app"><MonitorSmartphone aria-hidden="true" />Application</h2>
          <ul className="settings-list">
            <SettingRow icon={Languages} label="Langue" value="Français" />
            <SettingRow icon={Globe} label="Zones couvertes" value="Ziguinchor, Dakar et Saint-Louis (Sénégal)" />
            <SettingRow icon={Bell} label="Notifications" soon />
            <SettingRow icon={WifiOff} label="Mode hors ligne" value={`${online ? 'En ligne' : 'Hors ligne'} · les fiches publiques consultées et l’application restent disponibles sans réseau ; une adresse créée hors ligne est envoyée automatiquement au retour du réseau.`} />
            <SettingRow icon={MonitorSmartphone} label="Installer l’application"
              value={pwa.installed ? 'Application installée sur cet appareil.' : pwa.canInstall ? 'Ajoutez SamaAdresse à votre écran d’accueil.' : 'Utilisez le menu du navigateur : « Installer l’application » ou « Ajouter à l’écran d’accueil ».'} />
            {pwa.canInstall && <li className="settings-row settings-row--action"><button className="button button-primary button-sm" type="button" onClick={() => void pwa.install()}>Installer SamaAdresse</button></li>}
          </ul>
        </section>
      </div>
    </main>
  )
}

function SettingRow({ icon: Icon, label, value, soon }: { icon: typeof Bell; label: string; value?: ReactNode; soon?: boolean }) {
  return (
    <li className="settings-row">
      <span className="info-icon"><Icon aria-hidden="true" /></span>
      <span className="settings-row__text"><strong>{label}</strong>{value && <small>{value}</small>}</span>
      {soon && <span className="soon-tag">Bientôt</span>}
    </li>
  )
}

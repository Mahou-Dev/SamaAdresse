import {
  Bell, CalendarDays, Globe, KeyRound, Languages, LogOut, Mail, MonitorSmartphone, Phone, ShieldCheck, UserRound, WifiOff,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnline } from '../hooks/useOnline'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useAuth } from '../auth/authContext'
import { FormField } from '../components/FormField'
import { ApiError, changePassword } from '../lib/api'
import { errorMessage } from '../lib/errors'
import { formatDate, initials } from '../lib/labels'

export function AccountPage() {
  const { token, user, expiresAt, logout, refresh } = useAuth()
  const navigate = useNavigate()
  const online = useOnline()
  const pwa = useInstallPrompt()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)
  const [pwdStatus, setPwdStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  if (!user) return null

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    if (newPassword.length < 8) {
      setPwdStatus({ tone: 'error', text: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPwdStatus({ tone: 'error', text: 'La confirmation ne correspond pas au nouveau mot de passe.' })
      return
    }
    if (newPassword === currentPassword) {
      setPwdStatus({ tone: 'error', text: 'Le nouveau mot de passe doit être différent du mot de passe actuel.' })
      return
    }
    setPwdBusy(true)
    setPwdStatus(null)
    try {
      const res = await changePassword(token, currentPassword, newPassword)
      setPwdStatus({ tone: 'success', text: res.message || 'Mot de passe mis à jour avec succès.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const fresh = await refresh()
        if (fresh) {
          try {
            const res = await changePassword(fresh, currentPassword, newPassword)
            setPwdStatus({ tone: 'success', text: res.message || 'Mot de passe mis à jour avec succès.' })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setShowPasswordForm(false)
            return
          } catch (retryErr) {
            setPwdStatus({ tone: 'error', text: errorMessage(retryErr) })
            return
          }
        }
        void logout()
        return
      }
      setPwdStatus({ tone: 'error', text: errorMessage(error) })
    } finally {
      setPwdBusy(false)
    }
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
            <li className="settings-row">
              <span className="info-icon"><KeyRound aria-hidden="true" /></span>
              <span className="settings-row__text">
                <strong>Modifier le mot de passe</strong>
                <small>Révoque automatiquement les sessions ouvertes sur vos autres appareils.</small>
              </span>
              <button
                className="button button-secondary button-sm"
                type="button"
                aria-expanded={showPasswordForm}
                onClick={() => { setShowPasswordForm((v) => !v); setPwdStatus(null) }}
              >
                {showPasswordForm ? 'Fermer' : 'Modifier'}
              </button>
            </li>
          </ul>
          {pwdStatus && <p className={`alert alert--${pwdStatus.tone}`} role={pwdStatus.tone === 'error' ? 'alert' : 'status'}>{pwdStatus.text}</p>}
          {showPasswordForm && (
            <form className="stack-form" onSubmit={(e) => void handlePasswordSubmit(e)} aria-label="Changer de mot de passe">
              <FormField id="pwd-current" label="Mot de passe actuel">
                <input id="pwd-current" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </FormField>
              <FormField id="pwd-new" label="Nouveau mot de passe" hint="Minimum 8 caractères.">
                <input id="pwd-new" type="password" autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </FormField>
              <FormField id="pwd-confirm" label="Confirmer le nouveau mot de passe">
                <input id="pwd-confirm" type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </FormField>
              <div className="manage__actions">
                <button className="button button-primary button-sm" type="submit" disabled={pwdBusy}>
                  {pwdBusy ? 'Mise à jour…' : 'Enregistrer le nouveau mot de passe'}
                </button>
                <button className="button button-secondary button-sm" type="button" disabled={pwdBusy} onClick={() => setShowPasswordForm(false)}>
                  Annuler
                </button>
              </div>
            </form>
          )}
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

import { LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { AuthShell } from '../components/AuthShell'
import { FormField } from '../components/FormField'
import { PasswordInput } from '../components/PasswordInput'
import { ApiError } from '../lib/api'
import { errorMessage } from '../lib/errors'

export function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/tableau-de-bord'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && !submitting) return <Navigate to={from} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Saisissez votre e-mail et votre mot de passe.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429
        ? 'Trop de tentatives. Patientez quelques minutes avant de réessayer.'
        : errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      kicker="Espace personnel"
      title="Connexion"
      intro="Connectez-vous pour créer, suivre et partager vos adresses."
      footer={<>
        <p>Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p>
        <p className="muted">La récupération de mot de passe n’est pas encore disponible.</p>
      </>}
    >
      <form className="stack-form" onSubmit={handleSubmit} noValidate aria-label="Connexion">
        <FormField id="login-email" label="E-mail">
          <input id="login-email" type="email" autoComplete="email" placeholder="votre@email.sn" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField id="login-password" label="Mot de passe">
          <PasswordInput id="login-password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        {error && <p className="alert alert--error" role="alert">{error}</p>}
        <button className="button button-primary button-block" type="submit" disabled={submitting}>
          <LogIn aria-hidden="true" />{submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthShell>
  )
}

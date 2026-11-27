import { useState, type FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authContext'
import { AuthShell } from '../components/AuthShell'
import { FormField } from '../components/FormField'
import { PasswordInput } from '../components/PasswordInput'
import { describedBy } from '../lib/forms'
import { ApiError, normalizeSenegalPhone, type FieldErrors } from '../lib/api'
import { errorMessage } from '../lib/errors'

const PASSWORD_HINT = 'Au moins 8 caractères, dont une majuscule et un chiffre.'
const PHONE_HINT = 'Numéro sénégalais, ex. +221 77 123 45 67 ou 77 123 45 67.'
const SENEGAL_PHONE_REGEX = /^\+221(70|75|76|77|78|33)[0-9]{7}$/

/** Règles alignées sur RegisterRequest.java ; le serveur reste l'autorité. */
function validate(
  displayName: string,
  email: string,
  phoneNumber: string,
  password: string,
  confirmation: string,
): FieldErrors {
  const errors: FieldErrors = {}
  if (displayName.trim().length < 2) errors.displayName = 'Le nom complet doit contenir au moins 2 caractères.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'L’e-mail n’est pas valide.'
  if (!SENEGAL_PHONE_REGEX.test(normalizeSenegalPhone(phoneNumber))) {
    errors.phoneNumber = 'Le numéro de téléphone doit suivre le format sénégalais (ex. +221770000000).'
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.'
  }
  if (confirmation !== password) errors.confirmation = 'Les deux mots de passe ne correspondent pas.'
  return errors
}

export function RegisterPage() {
  const { register, status } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && !submitting) return <Navigate to="/mes-adresses" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validate(displayName, email, phoneNumber, password, confirmation)
    setFieldErrors(errors)
    setError(null)
    if (Object.keys(errors).length > 0) return
    setSubmitting(true)
    try {
      await register(email, password, displayName, phoneNumber)
      navigate('/tableau-de-bord', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        const mapped: FieldErrors = { ...err.fieldErrors }
        if (mapped.fullName && !mapped.displayName) mapped.displayName = mapped.fullName
        setFieldErrors(mapped)
      }
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      kicker="Nouveau compte"
      title="Créer un compte"
      intro="Un compte vous permet d’enregistrer vos lieux et d’obtenir immédiatement leur code SamaAdresse."
      footer={<p>Déjà inscrit ? <Link to="/connexion">Se connecter</Link></p>}
    >
      <form className="stack-form" onSubmit={handleSubmit} noValidate aria-label="Inscription">
        <FormField id="register-name" label="Nom complet" error={fieldErrors.displayName}>
          <input id="register-name" autoComplete="name" placeholder="Ex. Fatou Ndiaye" value={displayName} aria-invalid={!!fieldErrors.displayName}
            aria-describedby={describedBy('register-name', fieldErrors.displayName)} onChange={(e) => setDisplayName(e.target.value)} />
        </FormField>
        <FormField id="register-email" label="E-mail" error={fieldErrors.email}>
          <input id="register-email" type="email" autoComplete="email" placeholder="votre@email.sn" value={email} aria-invalid={!!fieldErrors.email}
            aria-describedby={describedBy('register-email', fieldErrors.email)} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField id="register-phone" label="Téléphone" error={fieldErrors.phoneNumber} hint={PHONE_HINT}>
          <input id="register-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+221 77 123 45 67" value={phoneNumber} aria-invalid={!!fieldErrors.phoneNumber}
            aria-describedby={describedBy('register-phone', fieldErrors.phoneNumber, PHONE_HINT)} onChange={(e) => setPhoneNumber(e.target.value)} />
        </FormField>
        <FormField id="register-password" label="Mot de passe" error={fieldErrors.password} hint={PASSWORD_HINT}>
          <PasswordInput id="register-password" autoComplete="new-password" value={password} aria-invalid={!!fieldErrors.password}
            aria-describedby={describedBy('register-password', fieldErrors.password, PASSWORD_HINT)} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <FormField id="register-confirmation" label="Confirmer le mot de passe" error={fieldErrors.confirmation}>
          <PasswordInput id="register-confirmation" autoComplete="new-password" value={confirmation} aria-invalid={!!fieldErrors.confirmation}
            aria-describedby={describedBy('register-confirmation', fieldErrors.confirmation)} onChange={(e) => setConfirmation(e.target.value)} />
        </FormField>
        {error && <p className="alert alert--error" role="alert">{error}</p>}
        <button className="button button-primary button-block" type="submit" disabled={submitting}>
          <UserPlus aria-hidden="true" />{submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
    </AuthShell>
  )
}

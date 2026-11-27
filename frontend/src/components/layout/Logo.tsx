import { Link } from 'react-router-dom'
import { BrandMark } from '../Brand'

export function Logo({ to = '/', tone = 'light', suffix }: { to?: string; tone?: 'light' | 'dark'; suffix?: string }) {
  return (
    <Link className={`logo logo--${tone}`} to={to} aria-label="SamaAdresse, accueil">
      <BrandMark />
      <span>Sama<span className="logo-accent">Adresse</span>{suffix && <small> {suffix}</small>}</span>
    </Link>
  )
}

import { Archive, Check, Flag, Globe, Lock, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { OwnerAddress } from '../lib/api'
import { formatDate } from '../lib/labels'

type StepState = 'done' | 'current' | 'failed' | 'todo'
interface Step { key: string; title: string; detail: string; state: StepState; icon: typeof Check }

/**
 * Cycle de vie réel du backend SamaAdresse :
 * enregistrement (code généré) → statut ACTIVE (fiche + QR actifs) / SIGNALED / ARCHIVED / SUSPENDED
 * → visibilité annuaire public (listed = true/false).
 */
function lifecycleSteps(a: Pick<OwnerAddress, 'status' | 'listed' | 'publiclyAccessible' | 'createdAt' | 'moderationNotice'>): Step[] {
  const steps: Step[] = [
    { key: 'created', title: 'Adresse enregistrée', detail: `Code attribué le ${formatDate(a.createdAt)}`, state: 'done', icon: Check },
  ]

  if (a.status === 'SUSPENDED') {
    steps.push({
      key: 'status',
      title: 'Suspendue par la modération',
      detail: a.moderationNotice || 'La fiche publique et le QR code sont temporairement désactivés.',
      state: 'failed',
      icon: ShieldAlert,
    })
    return steps
  }

  if (a.status === 'ARCHIVED') {
    steps.push({
      key: 'status',
      title: 'Adresse archivée',
      detail: 'La fiche publique et le QR code sont désactivés. Vous pouvez la restaurer à tout moment.',
      state: 'current',
      icon: Archive,
    })
    return steps
  }

  steps.push(
    a.status === 'SIGNALED'
      ? {
          key: 'status',
          title: 'Adresse active (signalement en cours)',
          detail: 'La fiche reste accessible pendant l’examen du signalement par l’équipe.',
          state: 'current',
          icon: Flag,
        }
      : {
          key: 'status',
          title: 'Adresse active',
          detail: 'Lien public et QR code immédiatement opérationnels.',
          state: 'done',
          icon: ShieldCheck,
        },
  )

  steps.push(
    a.listed
      ? {
          key: 'directory',
          title: 'Référencée dans l’annuaire public',
          detail: 'Trouvable dans la recherche publique par quartier, type ou mots-clés.',
          state: 'done',
          icon: Globe,
        }
      : {
          key: 'directory',
          title: 'Non listée dans l’annuaire',
          detail: 'Consultable uniquement par les personnes à qui vous transmettez le code ou le QR code.',
          state: 'done',
          icon: Lock,
        },
  )

  return steps
}

export function StatusTimeline({ address }: { address: OwnerAddress }) {
  return (
    <ol className="timeline" aria-label="Suivi de l’adresse">
      {lifecycleSteps(address).map(({ key, title, detail, state, icon: Icon }) => (
        <li key={key} className={`timeline__step timeline__step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
          <span className="timeline__dot"><Icon aria-hidden="true" /></span>
          <span className="timeline__text"><strong>{title}</strong><small>{detail}</small></span>
        </li>
      ))}
    </ol>
  )
}

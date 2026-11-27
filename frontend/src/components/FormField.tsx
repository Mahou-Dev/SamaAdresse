import type { ReactNode } from 'react'

interface FormFieldProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

/** Champ avec libellé, aide et message d'erreur reliés par aria-describedby. */
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div className={error ? 'field field--invalid' : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

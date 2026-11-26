import React, { useRef, useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, Phone } from 'lucide-react';
import { customFetch, ApiError } from '../api/apiClient';
import { isValidSenegalMobile } from '../utils/share';
import { useOnlineStatus } from '../context/OnlineStatusContext';
import { cn } from '../utils/cn';

export interface SmsShareFormProps {
  /** Code d'adresse (ex : ZIG-KBG-4271) */
  addressCode: string;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface ApiFieldErrors {
  phoneNumber?: string;
  [key: string]: string | undefined;
}

export const SmsShareForm: React.FC<SmsShareFormProps> = ({ addressCode }) => {
  const { isOnline } = useOnlineStatus();
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setFieldError(null);
    if (state === 'error') setState('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlightRef.current) return;

    if (!isOnline) {
      setErrorMsg("L'envoi de SMS nécessite une connexion Internet.");
      setState('error');
      return;
    }

    const trimmed = phone.trim();

    if (!trimmed) {
      setFieldError('Le numéro de téléphone est obligatoire.');
      return;
    }

    if (!isValidSenegalMobile(trimmed)) {
      setFieldError(
        'Entrez un mobile sénégalais valide (ex: +221771234567). Le 33 fixe ne reçoit pas de SMS.'
      );
      return;
    }

    inFlightRef.current = true;
    setState('loading');
    setErrorMsg(null);
    setFieldError(null);
    setMaskedPhone(null);

    try {
      const data = await customFetch<{ status: string; maskedPhone: string }>(
        `/api/addresses/${addressCode}/share/sms`,
        {
          method: 'POST',
          body: JSON.stringify({ phoneNumber: trimmed }),
        }
      );
      setMaskedPhone(data.maskedPhone);
      setState('success');
      setPhone('');
    } catch (err: unknown) {
      setState('error');
      if (err instanceof ApiError) {
        const errData = err.data as { fieldErrors?: ApiFieldErrors } | undefined;
        if (err.status === 400 && errData?.fieldErrors?.phoneNumber) {
          setFieldError(errData.fieldErrors.phoneNumber ?? null);
          setState('idle');
        } else if (err.status === 429) {
          setErrorMsg(err.message || "Limite d'envoi de SMS atteinte. Réessayez plus tard.");
        } else if (err.status === 502) {
          setErrorMsg(
            'Le service SMS est momentanément indisponible. Essayez WhatsApp ou copiez le lien.'
          );
        } else if (err.status === 401) {
          setErrorMsg('Vous devez être connecté pour envoyer un SMS.');
        } else {
          setErrorMsg(err.message || 'Une erreur est survenue.');
        }
      } else {
        setErrorMsg('Connexion impossible. Vérifiez votre réseau.');
      }
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <div className="space-y-3">
      {state === 'success' && maskedPhone && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 p-3.5 rounded-xl bg-success-soft border border-success-border text-success"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <div>
            <span className="font-bold text-sm block">SMS envoyé !</span>
            <span className="text-xs font-mono">{maskedPhone}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-danger-soft border border-danger-border text-danger"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-2">
        <label
          htmlFor="sms-phone-input"
          className="text-xs font-semibold text-ink-secondary flex items-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5 text-nature" aria-hidden="true" />
          <span>Numéro mobile sénégalais</span>
        </label>

        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <input
              id="sms-phone-input"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+221771234567"
              disabled={state === 'loading' || !isOnline}
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? 'sms-phone-error' : 'sms-phone-hint'}
              className={cn(
                'w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-mono text-sm text-ink bg-surface-elevated transition-colors',
                'focus-visible:outline-none focus-visible:ring-3 disabled:opacity-60 disabled:cursor-not-allowed',
                fieldError
                  ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
                  : 'border-border-control hover:border-ink-secondary focus-visible:border-institution focus-visible:ring-institution/20'
              )}
            />
          </div>
          <button
            type="submit"
            disabled={state === 'loading' || !phone.trim() || !isOnline}
            aria-label={state === 'loading' ? 'Envoi en cours' : 'Envoyer le SMS'}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-nature hover:bg-nature-hover text-ink-inverse font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-institution"
          >
            {state === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {state === 'loading' ? 'Envoi…' : 'Envoyer'}
            </span>
          </button>
        </div>

        {fieldError && (
          <p id="sms-phone-error" role="alert" className="text-xs font-medium text-danger mt-1">
            {fieldError}
          </p>
        )}

        <p id="sms-phone-hint" className="text-xs text-ink-muted">
          Mobiles uniquement (70, 75, 76, 77, 78). Format E.164 : +221 suivi de 9 chiffres.
        </p>
      </form>
    </div>
  );
};

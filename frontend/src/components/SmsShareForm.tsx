import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, Phone } from 'lucide-react';
import { customFetch, ApiError } from '../api/apiClient';
import { isValidSenegalMobile } from '../utils/share';

interface SmsShareFormProps {
  /** Code d'adresse (ex : ZIG-KBG-4271) */
  addressCode: string;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

interface ApiFieldErrors {
  phoneNumber?: string;
  [key: string]: string | undefined;
}

export const SmsShareForm: React.FC<SmsShareFormProps> = ({ addressCode }) => {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setFieldError(null);
    if (state === 'error') setState('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = phone.trim();

    if (!trimmed) {
      setFieldError('Le numéro de téléphone est obligatoire.');
      return;
    }

    if (!isValidSenegalMobile(trimmed)) {
      setFieldError('Entrez un mobile sénégalais valide (ex: +221771234567). Le 33 fixe ne reçoit pas de SMS.');
      return;
    }

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
    } catch (err: any) {
      setState('error');
      if (err instanceof ApiError) {
        if (err.status === 400 && err.data?.fieldErrors?.phoneNumber) {
          const fieldErrors: ApiFieldErrors = err.data.fieldErrors;
          setFieldError(fieldErrors.phoneNumber ?? null);
          setState('idle');
        } else if (err.status === 429) {
          setErrorMsg(err.message || 'Limite d\'envoi de SMS atteinte. Réessayez plus tard.');
        } else if (err.status === 502) {
          setErrorMsg('Le service SMS est momentanément indisponible. Essayez WhatsApp ou copiez le lien.');
        } else if (err.status === 401) {
          setErrorMsg('Vous devez être connecté pour envoyer un SMS.');
        } else {
          setErrorMsg(err.message || 'Une erreur est survenue.');
        }
      } else {
        setErrorMsg('Connexion impossible. Vérifiez votre réseau.');
      }
    }
  };

  return (
    <div className="space-y-3">
      {state === 'success' && maskedPhone && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#EAF4ED] border border-[#2A6B44]/30 text-[#1C4E30]"
        >
          <CheckCircle2 className="w-4 h-4 text-[#2A6B44] shrink-0" />
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
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/30 text-[#991B1B]"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-2">
        <label htmlFor="sms-phone-input" className="text-xs font-bold text-[#5C4D44] flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-[#2A6B44]" />
          Numéro mobile sénégalais
        </label>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              id="sms-phone-input"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+221771234567"
              disabled={state === 'loading'}
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? 'sms-phone-error' : undefined}
              className={`w-full px-4 py-2.5 rounded-xl border font-mono text-sm text-[#231A15] bg-[#FBF7EF] transition
                focus:outline-none focus:ring-2 focus:ring-[#1D528F]/30
                disabled:opacity-60 disabled:cursor-not-allowed
                ${fieldError
                  ? 'border-[#DC2626] focus:ring-[#DC2626]/20'
                  : 'border-[#766B5B] hover:border-[#1D528F]'
                }`}
            />
          </div>
          <button
            type="submit"
            disabled={state === 'loading' || !phone.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2A6B44] hover:bg-[#1C4E30] text-white font-bold text-sm transition
              disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {state === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {state === 'loading' ? 'Envoi...' : 'Envoyer'}
            </span>
          </button>
        </div>

        {fieldError && (
          <p id="sms-phone-error" role="alert" className="text-xs text-[#DC2626] mt-1">
            {fieldError}
          </p>
        )}

        <p className="text-[11px] text-[#5C4D44]">
          Mobiles uniquement (70, 75, 76, 77, 78). Format E.164 : +221 suivi de 9 chiffres.
        </p>
      </form>
    </div>
  );
};

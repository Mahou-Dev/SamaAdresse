package sn.samaadresse.sms;

/**
 * Abstraction d'un fournisseur d'envoi de SMS.
 * L'implémentation active est sélectionnée par la propriété {@code sms.provider}
 * (variable d'environnement SMS_PROVIDER : mock | twilio | sendflash).
 */
public interface SmsProvider {

    /**
     * Envoie un SMS.
     *
     * @param toE164  numéro destinataire au format E.164 (ex: +221771234503)
     * @param message corps du message (GSM-7, ≤ 160 caractères)
     * @return le résultat de l'envoi
     * @throws SmsProviderException si le fournisseur refuse ou échoue
     */
    SmsResult send(String toE164, String message);

    /** Nom court du fournisseur, utilisé dans les logs. */
    String name();
}

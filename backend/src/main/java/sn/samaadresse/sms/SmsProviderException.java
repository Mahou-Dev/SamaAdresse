package sn.samaadresse.sms;

/**
 * Erreur technique d'un fournisseur SMS.
 * Le message peut contenir des détails techniques : il est destiné aux logs serveur
 * uniquement et ne doit JAMAIS être renvoyé au client.
 */
public class SmsProviderException extends RuntimeException {

    public SmsProviderException(String message) {
        super(message);
    }

    public SmsProviderException(String message, Throwable cause) {
        super(message, cause);
    }
}

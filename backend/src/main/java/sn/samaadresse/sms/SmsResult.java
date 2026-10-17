package sn.samaadresse.sms;

/**
 * Résultat d'un envoi de SMS.
 *
 * @param success           true si le fournisseur a accepté le message
 * @param providerMessageId identifiant renvoyé par le fournisseur (peut être null)
 */
public record SmsResult(boolean success, String providerMessageId) {

    public static SmsResult accepted(String providerMessageId) {
        return new SmsResult(true, providerMessageId);
    }
}

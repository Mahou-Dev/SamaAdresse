package sn.samaadresse.exception;

/**
 * Échec ou timeout du fournisseur SMS. Converti en HTTP 502 avec un message générique :
 * la cause technique n'est jamais exposée au client.
 */
public class SmsDeliveryException extends RuntimeException {

    public SmsDeliveryException(String internalMessage, Throwable cause) {
        super(internalMessage, cause);
    }
}

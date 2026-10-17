package sn.samaadresse.sms;

/**
 * Jeu de caractères GSM 03.38 (alphabet de base, sans table d'extension).
 * Un SMS composé uniquement de ces caractères est encodé en GSM-7 : 160 caractères par SMS.
 * Un seul caractère hors de ce jeu (ex : un emoji) bascule tout le message en UCS-2 (70 caractères).
 */
public final class GsmCharset {

    private static final String GSM7_BASIC =
            "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
                    + "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

    public static final int SINGLE_SMS_MAX_LENGTH = 160;

    private GsmCharset() {
    }

    public static boolean isGsm7Basic(String text) {
        if (text == null) {
            return false;
        }
        return text.codePoints().allMatch(cp -> GSM7_BASIC.indexOf(cp) >= 0);
    }

    public static boolean fitsInSingleSms(String text) {
        return isGsm7Basic(text) && text.length() <= SINGLE_SMS_MAX_LENGTH;
    }
}

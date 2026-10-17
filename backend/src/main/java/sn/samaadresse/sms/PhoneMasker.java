package sn.samaadresse.sms;

/**
 * Masque un numéro de téléphone pour les logs et les réponses API.
 * <p>
 * Exemple : {@code +221771234503} → {@code +221 77 *** ** 03}
 */
public final class PhoneMasker {

    private PhoneMasker() {
    }

    public static String mask(String e164) {
        if (e164 == null || e164.isBlank()) {
            return "***";
        }
        String digits = e164.replaceAll("[^0-9]", "");
        if (e164.startsWith("+221") && digits.length() == 12) {
            String national = digits.substring(3);
            return "+221 " + national.substring(0, 2) + " *** ** " + national.substring(7);
        }
        // Format inconnu : on ne laisse apparaître que les 2 derniers chiffres
        if (digits.length() <= 2) {
            return "***";
        }
        return "*** " + digits.substring(digits.length() - 2);
    }
}

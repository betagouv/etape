package fr.gouv.beta.etape.keycloak.altcha;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class AltchaSecrets {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String SIGNATURE_LABEL = "etape-altcha-signature";
    private static final String KEY_SIGNATURE_LABEL = "etape-altcha-key-signature";

    private final String signatureSecret;
    private final String keySignatureSecret;

    private AltchaSecrets(String signatureSecret, String keySignatureSecret) {
        this.signatureSecret = signatureSecret;
        this.keySignatureSecret = keySignatureSecret;
    }

    static AltchaSecrets derive(byte[] keyMaterial) {
        return new AltchaSecrets(hmac(keyMaterial, SIGNATURE_LABEL), hmac(keyMaterial, KEY_SIGNATURE_LABEL));
    }

    String signatureSecret() {
        return signatureSecret;
    }

    String keySignatureSecret() {
        return keySignatureSecret;
    }

    private static String hmac(byte[] keyMaterial, String label) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(keyMaterial, HMAC_ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(label.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Unable to derive the ALTCHA secrets", e);
        }
    }
}

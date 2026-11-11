package fr.gouv.beta.etape.keycloak.altcha;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Optional;
import org.altcha.altcha.v2.Altcha;

final class AltchaChallenges {

    static final String ALGORITHM = "PBKDF2/SHA-256";
    static final String KEY_ID = "kid";
    static final int MAX_PAYLOAD_LENGTH = 8192;

    private static final SecureRandom RANDOM = new SecureRandom();

    private AltchaChallenges() {
    }

    static String create(AltchaSecrets secrets, AltchaSettings settings, String keyId, long expiresAt) {
        int counter = settings.counterMin() + RANDOM.nextInt(settings.counterMax() - settings.counterMin() + 1);
        Altcha.CreateChallengeOptions options = new Altcha.CreateChallengeOptions()
                .algorithm(ALGORITHM)
                .cost(settings.cost())
                .counter(counter)
                .expiresAt(expiresAt)
                .data(Map.of(KEY_ID, keyId))
                .hmacSignatureSecret(secrets.signatureSecret())
                .hmacKeySignatureSecret(secrets.keySignatureSecret());
        try {
            return Altcha.createChallenge(options).toJson();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to create the ALTCHA challenge", e);
        }
    }

    static Optional<Altcha.Payload> parse(String payload) {
        if (payload == null || payload.isBlank() || payload.length() > MAX_PAYLOAD_LENGTH) {
            return Optional.empty();
        }
        try {
            return Optional.of(Altcha.parsePayload(payload.trim()));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    static Optional<String> keyId(Altcha.Payload payload) {
        Map<String, Object> data = payload.challenge().parameters().data();
        return data != null && data.get(KEY_ID) instanceof String keyId ? Optional.of(keyId) : Optional.empty();
    }

    static boolean isVerified(Altcha.Payload payload, AltchaSecrets secrets) {
        try {
            return Altcha.verifySolution(
                    payload.challenge(),
                    payload.solution(),
                    secrets.signatureSecret(),
                    secrets.keySignatureSecret(),
                    Altcha.kdf(ALGORITHM)).verified();
        } catch (Exception e) {
            return false;
        }
    }

    static long expiresAt(Altcha.Payload payload) {
        Number expiresAt = payload.challenge().parameters().expiresAt();
        return expiresAt == null ? 0 : expiresAt.longValue();
    }

    static String signature(Altcha.Payload payload) {
        return payload.challenge().signature();
    }
}

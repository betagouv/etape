package fr.gouv.beta.etape.keycloak.altcha;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import org.altcha.altcha.v2.Altcha;
import org.junit.jupiter.api.Test;

class AltchaChallengesTest {

    private static final AltchaSecrets SECRETS = AltchaSecrets.derive("realm-key".getBytes(StandardCharsets.UTF_8));
    private static final AltchaSecrets OTHER_SECRETS = AltchaSecrets.derive("other-key".getBytes(StandardCharsets.UTF_8));
    private static final AltchaSettings LIGHT_SETTINGS = new AltchaSettings(10, 3, 6);
    private static final String KEY_ID = "kid-1";

    @Test
    void acceptsASolvedChallenge() throws Exception {
        Altcha.Payload payload = solve(AltchaChallenges.create(SECRETS, LIGHT_SETTINGS, KEY_ID, inOneMinute()));

        assertTrue(AltchaChallenges.isVerified(payload, SECRETS));
        assertEquals(Optional.of(KEY_ID), AltchaChallenges.keyId(payload));
    }

    @Test
    void rejectsAChallengeSignedWithAnotherSecret() throws Exception {
        Altcha.Payload payload = solve(AltchaChallenges.create(OTHER_SECRETS, LIGHT_SETTINGS, KEY_ID, inOneMinute()));

        assertFalse(AltchaChallenges.isVerified(payload, SECRETS));
    }

    @Test
    void rejectsAWrongDerivedKey() throws Exception {
        Altcha.Payload solved = solve(AltchaChallenges.create(SECRETS, LIGHT_SETTINGS, KEY_ID, inOneMinute()));
        String derivedKey = solved.solution().derivedKey();
        String wrongDerivedKey = (derivedKey.charAt(0) == '0' ? "1" : "0") + derivedKey.substring(1);
        Altcha.Solution wrongSolution = new Altcha.Solution(solved.solution().counter(), wrongDerivedKey, null);

        assertFalse(AltchaChallenges.isVerified(new Altcha.Payload(solved.challenge(), wrongSolution), SECRETS));
    }

    @Test
    void rejectsAnExpiredChallenge() throws Exception {
        Altcha.Payload payload = solve(AltchaChallenges.create(SECRETS, LIGHT_SETTINGS, KEY_ID, nowSeconds() - 1));

        assertFalse(AltchaChallenges.isVerified(payload, SECRETS));
    }

    @Test
    void keepsTheExpirationAndTheSignature() throws Exception {
        long expiresAt = inOneMinute();
        Altcha.Payload payload = solve(AltchaChallenges.create(SECRETS, LIGHT_SETTINGS, KEY_ID, expiresAt));

        assertEquals(expiresAt, AltchaChallenges.expiresAt(payload));
        assertFalse(AltchaChallenges.signature(payload).isBlank());
    }

    @Test
    void refusesToParseUnusablePayloads() {
        assertTrue(AltchaChallenges.parse(null).isEmpty());
        assertTrue(AltchaChallenges.parse("  ").isEmpty());
        assertTrue(AltchaChallenges.parse("not-base64").isEmpty());
        assertTrue(AltchaChallenges.parse("A".repeat(AltchaChallenges.MAX_PAYLOAD_LENGTH + 1)).isEmpty());
    }

    private static Altcha.Payload solve(String challengeJson) throws Exception {
        Altcha.Challenge challenge = AltchaChallenges.parse(encode(challengeJson, 0, "00")).orElseThrow().challenge();
        Altcha.Solution solution = Altcha.solveChallenge(challenge, Altcha.kdf(AltchaChallenges.ALGORITHM));
        return AltchaChallenges.parse(encode(challengeJson, solution.counter(), solution.derivedKey())).orElseThrow();
    }

    private static String encode(String challengeJson, long counter, String derivedKey) {
        String json = "{\"challenge\":" + challengeJson
                + ",\"solution\":{\"counter\":" + counter + ",\"derivedKey\":\"" + derivedKey + "\"}}";
        return Base64.getEncoder().encodeToString(json.getBytes(StandardCharsets.UTF_8));
    }

    private static long nowSeconds() {
        return System.currentTimeMillis() / 1000;
    }

    private static long inOneMinute() {
        return nowSeconds() + 60;
    }
}

package fr.gouv.beta.etape.keycloak.altcha;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class AltchaSecretsTest {

    private static final byte[] KEY = "realm-key".getBytes(StandardCharsets.UTF_8);

    @Test
    void derivesTheSameSecretsFromTheSameKey() {
        AltchaSecrets first = AltchaSecrets.derive(KEY);
        AltchaSecrets second = AltchaSecrets.derive(KEY);

        assertEquals(first.signatureSecret(), second.signatureSecret());
        assertEquals(first.keySignatureSecret(), second.keySignatureSecret());
    }

    @Test
    void separatesTheTwoSecrets() {
        AltchaSecrets secrets = AltchaSecrets.derive(KEY);

        assertNotEquals(secrets.signatureSecret(), secrets.keySignatureSecret());
    }

    @Test
    void changesWithTheKey() {
        AltchaSecrets secrets = AltchaSecrets.derive(KEY);
        AltchaSecrets rotated = AltchaSecrets.derive("rotated-key".getBytes(StandardCharsets.UTF_8));

        assertNotEquals(secrets.signatureSecret(), rotated.signatureSecret());
    }
}

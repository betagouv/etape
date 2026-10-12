package fr.gouv.beta.etape.keycloak.altcha;

import java.util.Optional;
import org.altcha.altcha.v2.Altcha;
import org.keycloak.common.util.Time;
import org.keycloak.crypto.Algorithm;
import org.keycloak.crypto.KeyUse;
import org.keycloak.crypto.KeyWrapper;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

final class AltchaGuard {

    static final String FIELD = "altcha";
    static final String CHALLENGE_ATTRIBUTE = "altchaChallenge";
    static final String EVENT_ERROR = "altcha_failed";

    private static final String REPLAY_KEY_PREFIX = "etape-altcha:";
    private static final int FALLBACK_LIFESPAN_SECONDS = 600;

    private final KeycloakSession session;
    private final RealmModel realm;

    AltchaGuard(KeycloakSession session, RealmModel realm) {
        this.session = session;
        this.realm = realm;
    }

    String createChallenge(AltchaSettings settings) {
        KeyWrapper key = session.keys().getActiveKey(realm, KeyUse.SIG, Algorithm.HS512);
        long expiresAt = Time.currentTime() + challengeLifespan();
        return AltchaChallenges.create(secretsOf(key), settings, key.getKid(), expiresAt);
    }

    AltchaOutcome check(String rawPayload) {
        if (rawPayload == null || rawPayload.isBlank()) {
            return AltchaOutcome.MISSING;
        }
        Optional<Altcha.Payload> payload = AltchaChallenges.parse(rawPayload);
        Optional<KeyWrapper> key = payload.flatMap(AltchaChallenges::keyId)
                .map(keyId -> session.keys().getKey(realm, keyId, KeyUse.SIG, Algorithm.HS512));
        if (payload.isEmpty() || key.isEmpty() || key.get().getSecretKey() == null) {
            return AltchaOutcome.FAILED;
        }
        if (!AltchaChallenges.isVerified(payload.get(), secretsOf(key.get()))) {
            return AltchaOutcome.FAILED;
        }
        long remainingLifespan = Math.max(1, AltchaChallenges.expiresAt(payload.get()) - Time.currentTime());
        boolean isFirstUse = session.singleUseObjects()
                .putIfAbsent(REPLAY_KEY_PREFIX + AltchaChallenges.signature(payload.get()), remainingLifespan);
        return isFirstUse ? AltchaOutcome.PASSED : AltchaOutcome.FAILED;
    }

    private int challengeLifespan() {
        int lifespan = realm.getAccessCodeLifespanLogin();
        return lifespan > 0 ? lifespan : FALLBACK_LIFESPAN_SECONDS;
    }

    private static AltchaSecrets secretsOf(KeyWrapper key) {
        return AltchaSecrets.derive(key.getSecretKey().getEncoded());
    }
}

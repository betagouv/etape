package fr.gouv.beta.etape.keycloak.resetcredentials;

final class ResendDelay {

    static final int SECONDS = 120;

    private ResendDelay() {
    }

    static long remainingSeconds(String requestedAt, long now) {
        if (requestedAt == null) {
            return 0;
        }
        try {
            long elapsed = now - Long.parseLong(requestedAt);
            return Math.max(0, Math.min(SECONDS, SECONDS - elapsed));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}

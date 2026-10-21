package fr.gouv.beta.etape.keycloak.altcha;

enum AltchaOutcome {
    PASSED(null),
    MISSING("etapeAltchaRequired"),
    FAILED("etapeAltchaFailed");

    private final String messageKey;

    AltchaOutcome(String messageKey) {
        this.messageKey = messageKey;
    }

    String messageKey() {
        return messageKey;
    }
}

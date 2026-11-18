package fr.gouv.beta.etape.keycloak.firstbrokerlogin;

final class TermsAcceptance {

    static final String FIELD = "termsAccepted";
    static final String REQUIRED_MESSAGE = "termsAcceptanceRequired";

    private static final String CHECKED = "on";

    private TermsAcceptance() {
    }

    static boolean isAccepted(String fieldValue) {
        return CHECKED.equals(fieldValue);
    }
}

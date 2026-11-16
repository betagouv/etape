package fr.gouv.beta.etape.keycloak.firstbrokerlogin;

import java.util.function.Predicate;

final class ExistingAccount {

    private ExistingAccount() {
    }

    /** Même recherche que `IdpCreateUserIfUniqueAuthenticator.checkExistingUser` de Keycloak. */
    static boolean exists(String email, String modelUsername, boolean isDuplicateEmailsAllowed,
            boolean isRegistrationEmailAsUsername, Predicate<String> existsByEmail,
            Predicate<String> existsByUsername) {
        if (email != null && !isDuplicateEmailsAllowed && existsByEmail.test(email)) {
            return true;
        }
        String username = isRegistrationEmailAsUsername ? email : modelUsername;
        return username != null && existsByUsername.test(username);
    }
}

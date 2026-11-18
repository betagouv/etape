package fr.gouv.beta.etape.keycloak.firstbrokerlogin;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Set;
import java.util.function.Predicate;
import org.junit.jupiter.api.Test;

class ExistingAccountTest {

    private static final String EMAIL = "camille.roux@example.org";
    private static final Predicate<String> NOBODY = value -> false;

    private static Predicate<String> knows(String... values) {
        return Set.of(values)::contains;
    }

    @Test
    void findsAnAccountWithTheSameEmail() {
        assertTrue(ExistingAccount.exists(EMAIL, "camille", false, false, knows(EMAIL), NOBODY));
    }

    @Test
    void ignoresTheEmailWhenDuplicatesAreAllowed() {
        assertFalse(ExistingAccount.exists(EMAIL, "camille", true, false, knows(EMAIL), NOBODY));
    }

    @Test
    void searchesTheEmailAsUsernameWhenTheRealmSaysSo() {
        assertTrue(ExistingAccount.exists(EMAIL, "camille", true, true, NOBODY, knows(EMAIL)));
        assertFalse(ExistingAccount.exists(EMAIL, "camille", true, true, NOBODY, knows("camille")));
    }

    @Test
    void searchesTheBrokeredUsernameOtherwise() {
        assertTrue(ExistingAccount.exists(EMAIL, "camille", false, false, NOBODY, knows("camille")));
    }

    @Test
    void findsNothingWithoutEmailWhenTheEmailIsTheUsername() {
        assertFalse(ExistingAccount.exists(null, "camille", false, true, knows("camille"), knows("camille")));
    }

    @Test
    void findsNothingForANewPerson() {
        assertFalse(ExistingAccount.exists(EMAIL, "camille", false, true, NOBODY, NOBODY));
    }
}

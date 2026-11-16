package fr.gouv.beta.etape.keycloak.firstbrokerlogin;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TermsAcceptanceTest {

    @Test
    void acceptsTheCheckedBox() {
        assertTrue(TermsAcceptance.isAccepted("on"));
    }

    @Test
    void refusesAnAbsentOrForgedValue() {
        assertFalse(TermsAcceptance.isAccepted(null));
        assertFalse(TermsAcceptance.isAccepted(""));
        assertFalse(TermsAcceptance.isAccepted("off"));
    }
}

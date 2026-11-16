package fr.gouv.beta.etape.keycloak.firstbrokerlogin;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.ws.rs.core.MultivaluedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class BrokeredIdentityLockTest {

    @Test
    void replacesTheSubmittedIdentityWithTheBrokeredOne() {
        MultivaluedHashMap<String, String> formData = new MultivaluedHashMap<>();
        formData.putSingle("firstName", "Mallory");
        formData.putSingle("lastName", "Pirate");
        formData.putSingle("email", "mallory@example.org");
        formData.putSingle("adresse", "9 rue Victor Hugo");

        BrokeredIdentityLock.apply(formData,
                BrokeredIdentityLock.lockedValues("Camille", "Roux", "camille.roux@example.org"));

        assertEquals(List.of("Camille"), formData.get("firstName"));
        assertEquals(List.of("Roux"), formData.get("lastName"));
        assertEquals(List.of("camille.roux@example.org"), formData.get("email"));
        assertEquals(List.of("9 rue Victor Hugo"), formData.get("adresse"));
    }

    @Test
    void restoresAFieldRemovedFromTheForm() {
        MultivaluedHashMap<String, String> formData = new MultivaluedHashMap<>();

        BrokeredIdentityLock.apply(formData, BrokeredIdentityLock.lockedValues("Camille", "Roux", "c@example.org"));

        assertEquals("c@example.org", formData.getFirst("email"));
    }

    @Test
    void leavesAMissingBrokeredValueToTheForm() {
        Map<String, String> locked = BrokeredIdentityLock.lockedValues("Camille", " ", null);

        assertTrue(locked.containsKey("firstName"));
        assertFalse(locked.containsKey("lastName"));
        assertFalse(locked.containsKey("email"));
    }
}

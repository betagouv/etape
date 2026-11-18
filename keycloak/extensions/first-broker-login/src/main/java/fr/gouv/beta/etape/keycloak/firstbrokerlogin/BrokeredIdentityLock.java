package fr.gouv.beta.etape.keycloak.firstbrokerlogin;

import jakarta.ws.rs.core.MultivaluedMap;
import java.util.LinkedHashMap;
import java.util.Map;
import org.keycloak.models.UserModel;

final class BrokeredIdentityLock {

    private BrokeredIdentityLock() {
    }

    static Map<String, String> lockedValues(String firstName, String lastName, String email) {
        Map<String, String> locked = new LinkedHashMap<>();
        putIfPresent(locked, UserModel.FIRST_NAME, firstName);
        putIfPresent(locked, UserModel.LAST_NAME, lastName);
        putIfPresent(locked, UserModel.EMAIL, email);
        return locked;
    }

    static void apply(MultivaluedMap<String, String> formData, Map<String, String> locked) {
        locked.forEach(formData::putSingle);
    }

    private static void putIfPresent(Map<String, String> locked, String name, String value) {
        if (value != null && !value.isBlank()) {
            locked.put(name, value);
        }
    }
}

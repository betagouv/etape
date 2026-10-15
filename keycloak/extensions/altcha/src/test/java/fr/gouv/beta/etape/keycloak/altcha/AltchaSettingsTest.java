package fr.gouv.beta.etape.keycloak.altcha;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.keycloak.models.AuthenticatorConfigModel;

class AltchaSettingsTest {

    @Test
    void fallsBackToTheDefaultsWithoutConfiguration() {
        assertEquals(AltchaSettings.DEFAULT, AltchaSettings.from(null));
        assertEquals(AltchaSettings.DEFAULT, AltchaSettings.from(config(Map.of())));
    }

    @Test
    void readsTheConfiguredValues() {
        AltchaSettings settings = AltchaSettings.from(config(Map.of(
                AltchaSettings.COST, "1000",
                AltchaSettings.COUNTER_MIN, " 1000 ",
                AltchaSettings.COUNTER_MAX, "2000")));

        assertEquals(new AltchaSettings(1000, 1000, 2000), settings);
    }

    @Test
    void keepsTheDefaultOfAMissingValue() {
        AltchaSettings settings = AltchaSettings.from(config(Map.of(AltchaSettings.COST, "1000")));

        assertEquals(new AltchaSettings(1000, AltchaSettings.DEFAULT.counterMin(), AltchaSettings.DEFAULT.counterMax()), settings);
    }

    @Test
    void rejectsAnInvertedCounterRange() {
        assertThrows(IllegalArgumentException.class, () -> new AltchaSettings(1000, 3000, 2000));
    }

    @Test
    void fallsBackToTheDefaultsOnANonNumericValue() {
        assertEquals(AltchaSettings.DEFAULT, AltchaSettings.from(config(Map.of(AltchaSettings.COUNTER_MAX, "4 000"))));
    }

    @Test
    void fallsBackToTheDefaultsOnAnInvertedRange() {
        assertEquals(AltchaSettings.DEFAULT, AltchaSettings.from(config(Map.of(
                AltchaSettings.COUNTER_MIN, "3000",
                AltchaSettings.COUNTER_MAX, "2000"))));
    }

    private static AuthenticatorConfigModel config(Map<String, String> values) {
        AuthenticatorConfigModel config = new AuthenticatorConfigModel();
        config.setConfig(values);
        return config;
    }
}

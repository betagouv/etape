package fr.gouv.beta.etape.keycloak.altcha;

import java.util.List;
import java.util.Map;
import org.keycloak.models.AuthenticatorConfigModel;
import org.keycloak.provider.ProviderConfigProperty;

public record AltchaSettings(int cost, int counterMin, int counterMax) {

    public static final String COST = "cost";
    public static final String COUNTER_MIN = "counterMin";
    public static final String COUNTER_MAX = "counterMax";

    public static final AltchaSettings DEFAULT = new AltchaSettings(2000, 2000, 4000);

    public static final List<ProviderConfigProperty> CONFIG_PROPERTIES = List.of(
            property(COST, "Cost", "PBKDF2 iterations per attempt.", DEFAULT.cost()),
            property(COUNTER_MIN, "Minimum counter", "Lowest number of attempts the browser has to make.", DEFAULT.counterMin()),
            property(COUNTER_MAX, "Maximum counter", "Highest number of attempts the browser has to make.", DEFAULT.counterMax()));

    public AltchaSettings {
        if (cost < 1 || counterMin < 0 || counterMax < counterMin) {
            throw new IllegalArgumentException(
                    "Invalid ALTCHA settings: cost=" + cost + ", counterMin=" + counterMin + ", counterMax=" + counterMax);
        }
    }

    public static AltchaSettings from(AuthenticatorConfigModel config) {
        Map<String, String> values = config == null || config.getConfig() == null ? Map.of() : config.getConfig();
        return new AltchaSettings(
                read(values, COST, DEFAULT.cost()),
                read(values, COUNTER_MIN, DEFAULT.counterMin()),
                read(values, COUNTER_MAX, DEFAULT.counterMax()));
    }

    private static int read(Map<String, String> values, String key, int fallback) {
        String value = values.get(key);
        return value == null || value.isBlank() ? fallback : Integer.parseInt(value.trim());
    }

    private static ProviderConfigProperty property(String name, String label, String helpText, int defaultValue) {
        return new ProviderConfigProperty(name, label, helpText, ProviderConfigProperty.STRING_TYPE, String.valueOf(defaultValue));
    }
}

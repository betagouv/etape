package fr.gouv.beta.etape.keycloak.altcha;

import jakarta.ws.rs.core.MultivaluedMap;
import java.util.List;
import org.jboss.logging.Logger;
import org.keycloak.Config;
import org.keycloak.authentication.FormAction;
import org.keycloak.authentication.FormActionFactory;
import org.keycloak.authentication.FormContext;
import org.keycloak.authentication.ValidationContext;
import org.keycloak.events.Errors;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.AuthenticationExecutionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.provider.ProviderConfigProperty;

public class AltchaRegistrationFormAction implements FormAction, FormActionFactory {

    public static final String PROVIDER_ID = "etape-altcha-registration";

    private static final Logger LOGGER = Logger.getLogger(AltchaRegistrationFormAction.class);

    private static final AuthenticationExecutionModel.Requirement[] REQUIREMENT_CHOICES = {
            AuthenticationExecutionModel.Requirement.REQUIRED,
            AuthenticationExecutionModel.Requirement.DISABLED
    };

    @Override
    public void buildPage(FormContext context, LoginFormsProvider form) {
        try {
            AltchaSettings settings = AltchaSettings.from(context.getAuthenticatorConfig());
            form.setAttribute(AltchaGuard.CHALLENGE_ATTRIBUTE,
                    new AltchaGuard(context.getSession(), context.getRealm()).createChallenge(settings));
        } catch (RuntimeException e) {
            LOGGER.error("Unable to create the ALTCHA challenge of the registration form", e);
        }
    }

    @Override
    public void validate(ValidationContext context) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        AltchaOutcome outcome = new AltchaGuard(context.getSession(), context.getRealm())
                .check(formData.getFirst(AltchaGuard.FIELD));
        if (outcome == AltchaOutcome.PASSED) {
            context.success();
            return;
        }
        formData.remove(AltchaGuard.FIELD);
        context.getEvent().detail(AltchaGuard.FIELD, AltchaGuard.EVENT_ERROR);
        context.error(Errors.INVALID_REGISTRATION);
        context.validationError(formData, List.of(new FormMessage(AltchaGuard.FIELD, outcome.messageKey())));
        context.excludeOtherErrors();
    }

    @Override
    public void success(FormContext context) {
    }

    @Override
    public boolean requiresUser() {
        return false;
    }

    @Override
    public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
        return true;
    }

    @Override
    public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
    }

    @Override
    public String getDisplayType() {
        return "ALTCHA";
    }

    @Override
    public String getReferenceCategory() {
        return null;
    }

    @Override
    public boolean isConfigurable() {
        return true;
    }

    @Override
    public AuthenticationExecutionModel.Requirement[] getRequirementChoices() {
        return REQUIREMENT_CHOICES;
    }

    @Override
    public boolean isUserSetupAllowed() {
        return false;
    }

    @Override
    public String getHelpText() {
        return "Requires an ALTCHA proof of work before the account is created.";
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return AltchaSettings.CONFIG_PROPERTIES;
    }

    @Override
    public FormAction create(KeycloakSession session) {
        return this;
    }

    @Override
    public void init(Config.Scope config) {
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
    }

    @Override
    public void close() {
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }
}

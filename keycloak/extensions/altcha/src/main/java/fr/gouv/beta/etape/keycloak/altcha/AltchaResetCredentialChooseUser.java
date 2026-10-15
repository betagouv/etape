package fr.gouv.beta.etape.keycloak.altcha;

import jakarta.ws.rs.core.Response;
import java.util.List;
import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.authenticators.resetcred.ResetCredentialChooseUser;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.provider.ProviderConfigProperty;

public class AltchaResetCredentialChooseUser extends ResetCredentialChooseUser {

    public static final String PROVIDER_ID = "etape-altcha-reset-credentials";

    private static final Logger LOGGER = Logger.getLogger(AltchaResetCredentialChooseUser.class);

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        addChallenge(context);
        super.authenticate(context);
    }

    @Override
    public void action(AuthenticationFlowContext context) {
        String payload = context.getHttpRequest().getDecodedFormParameters().getFirst(AltchaGuard.FIELD);
        AltchaOutcome outcome = new AltchaGuard(context.getSession(), context.getRealm()).check(payload);
        addChallenge(context);
        if (outcome == AltchaOutcome.PASSED) {
            super.action(context);
            return;
        }
        context.getEvent().error(AltchaGuard.EVENT_ERROR);
        Response challenge = context.form()
                .addError(new FormMessage(AltchaGuard.FIELD, outcome.messageKey()))
                .createPasswordReset();
        context.challenge(challenge);
    }

    @Override
    public String getDisplayType() {
        return "Choose User (ALTCHA)";
    }

    @Override
    public boolean isConfigurable() {
        return true;
    }

    @Override
    public String getHelpText() {
        return "Choose a user to reset credentials for, once an ALTCHA proof of work is solved.";
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return AltchaSettings.CONFIG_PROPERTIES;
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    private void addChallenge(AuthenticationFlowContext context) {
        try {
            AltchaSettings settings = AltchaSettings.from(context.getAuthenticatorConfig());
            context.form().setAttribute(AltchaGuard.CHALLENGE_ATTRIBUTE,
                    new AltchaGuard(context.getSession(), context.getRealm()).createChallenge(settings));
        } catch (RuntimeException e) {
            LOGGER.error("Unable to create the ALTCHA challenge of the reset credentials form", e);
            context.form().setAttribute(AltchaGuard.UNAVAILABLE_ATTRIBUTE, true);
        }
    }
}

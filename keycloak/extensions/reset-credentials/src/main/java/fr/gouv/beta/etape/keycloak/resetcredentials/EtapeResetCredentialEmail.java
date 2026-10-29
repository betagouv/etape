package fr.gouv.beta.etape.keycloak.resetcredentials;

import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.actiontoken.resetcred.ResetCredentialsActionToken;
import org.keycloak.authentication.authenticators.browser.AbstractUsernameFormAuthenticator;
import org.keycloak.authentication.authenticators.resetcred.ResetCredentialEmail;
import org.keycloak.common.util.Time;
import org.keycloak.email.EmailException;
import org.keycloak.email.EmailTemplateProvider;
import org.keycloak.events.Details;
import org.keycloak.events.Errors;
import org.keycloak.events.EventBuilder;
import org.keycloak.events.EventType;
import org.keycloak.models.DefaultActionTokenKey;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.PasswordCredentialModel;
import org.keycloak.sessions.AuthenticationSessionCompoundId;
import org.keycloak.sessions.AuthenticationSessionModel;

public class EtapeResetCredentialEmail extends ResetCredentialEmail {

    public static final String PROVIDER_ID = "etape-reset-credential-email";

    static final String RESEND_ACTION = "resend";
    static final String EDIT_EMAIL_ACTION = "edit-email";

    private static final String LINK_SENT_ATTRIBUTE = "etapeResetLinkSent";
    private static final String LINK_RESENT_ATTRIBUTE = "etapeResetLinkResent";
    private static final String LINK_LIFESPAN_ATTRIBUTE = "etapeResetLinkLifespanMinutes";
    private static final String RESEND_DELAY_ATTRIBUTE = "etapeResendDelaySeconds";

    private static final String REQUESTED_USERNAME_NOTE = "etape-reset-requested-username";
    private static final String REQUESTED_USER_NOTE = "etape-reset-requested-user";
    private static final String REQUESTED_AT_NOTE = "etape-reset-requested-at";
    private static final String LINK_KEY_NOTE = "etape-reset-link-key";
    private static final String THROTTLE_KEY_PREFIX = "etape-reset-throttle:";
    private static final String FEDERATED_WITHOUT_PASSWORD = "federated_user_without_password";
    private static final long CLOCK_SKEW_SECONDS = 60;

    private static final Logger LOGGER = Logger.getLogger(EtapeResetCredentialEmail.class);

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        if (isReturningFromLink(context)) {
            super.authenticate(context);
            return;
        }
        AuthenticationSessionModel authSession = context.getAuthenticationSession();
        String username = Objects.toString(authSession.getAuthNote(AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME), "");
        if (!username.equals(authSession.getAuthNote(REQUESTED_USERNAME_NOTE))) {
            authSession.setAuthNote(REQUESTED_USERNAME_NOTE, username);
            UserModel user = context.getUser();
            if (user == null) {
                authSession.removeAuthNote(REQUESTED_USER_NOTE);
            } else {
                authSession.setAuthNote(REQUESTED_USER_NOTE, user.getId());
            }
            requestLink(context);
        }
        context.clearUser();
        context.challenge(emailSentPage(context, false));
    }

    @Override
    public void action(AuthenticationFlowContext context) {
        if (isReturningFromLink(context)) {
            super.action(context);
            return;
        }
        AuthenticationSessionModel authSession = context.getAuthenticationSession();
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();
        if (formData.containsKey(EDIT_EMAIL_ACTION)) {
            String username = authSession.getAuthNote(AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME);
            context.resetFlow(() -> {
                if (username != null) {
                    authSession.setAuthNote(AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME, username);
                }
            });
            return;
        }
        boolean isResent = formData.containsKey(RESEND_ACTION) && remainingDelay(authSession) == 0;
        if (isResent) {
            requestLink(context);
        }
        context.challenge(emailSentPage(context, isResent));
    }

    @Override
    public String getDisplayType() {
        return "Send Reset Email (ETAPE)";
    }

    @Override
    public String getHelpText() {
        return "Send the reset email, then show the email sent page, with a throttled resend that revokes the previous link.";
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    private void requestLink(AuthenticationFlowContext context) {
        AuthenticationSessionModel authSession = context.getAuthenticationSession();
        authSession.setAuthNote(REQUESTED_AT_NOTE, Integer.toString(Time.currentTime()));
        String userId = authSession.getAuthNote(REQUESTED_USER_NOTE);
        UserModel user = userId == null ? null : context.getSession().users().getUserById(context.getRealm(), userId);
        if (user == null || !user.isEnabled() || !canReceiveLink(context, user) || !acquireThrottle(context, user)) {
            return;
        }
        revokePreviousLink(context.getSession(), authSession);
        sendLink(context, user);
    }

    private static boolean canReceiveLink(AuthenticationFlowContext context, UserModel user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            sendEvent(context, user).error(Errors.INVALID_EMAIL);
            return false;
        }
        boolean hasPassword = user.credentialManager().isConfiguredFor(PasswordCredentialModel.TYPE);
        boolean isBrokered = context.getSession().users()
                .getFederatedIdentitiesStream(context.getRealm(), user)
                .findAny()
                .isPresent();
        if (!hasPassword && isBrokered) {
            sendEvent(context, user).detail(Details.REASON, FEDERATED_WITHOUT_PASSWORD).error(Errors.NOT_ALLOWED);
            return false;
        }
        return true;
    }

    private static boolean acquireThrottle(AuthenticationFlowContext context, UserModel user) {
        boolean isAcquired = context.getSession().singleUseObjects()
                .putIfAbsent(THROTTLE_KEY_PREFIX + user.getId(), ResendDelay.SECONDS);
        if (!isAcquired) {
            sendEvent(context, user).error(Errors.SLOW_DOWN);
        }
        return isAcquired;
    }

    private static void revokePreviousLink(KeycloakSession session, AuthenticationSessionModel authSession) {
        String previousKey = authSession.getAuthNote(LINK_KEY_NOTE);
        DefaultActionTokenKey key = DefaultActionTokenKey.from(previousKey);
        if (key == null) {
            return;
        }
        long lifespan = key.getExp() - Time.currentTime();
        if (lifespan > 0) {
            session.revokedTokens().put(previousKey, lifespan + CLOCK_SKEW_SECONDS);
        }
        authSession.removeAuthNote(LINK_KEY_NOTE);
    }

    private static void sendLink(AuthenticationFlowContext context, UserModel user) {
        AuthenticationSessionModel authSession = context.getAuthenticationSession();
        RealmModel realm = context.getRealm();
        int lifespan = linkLifespan(realm);
        String authSessionId = AuthenticationSessionCompoundId.fromAuthSession(authSession).getEncodedId();
        ResetCredentialsActionToken token = new ResetCredentialsActionToken(user.getId(), user.getEmail(),
                Time.currentTime() + lifespan, authSessionId, authSession.getClient().getClientId());
        String link = UriBuilder
                .fromUri(context.getActionTokenUrl(token.serialize(context.getSession(), realm, context.getUriInfo())))
                .build()
                .toString();
        try {
            context.getSession().getProvider(EmailTemplateProvider.class)
                    .setRealm(realm)
                    .setUser(user)
                    .setAuthenticationSession(authSession)
                    .sendPasswordReset(link, TimeUnit.SECONDS.toMinutes(lifespan));
            authSession.setAuthNote(LINK_KEY_NOTE, token.serializeKey());
            sendEvent(context, user).detail(Details.CODE_ID, authSession.getParentSession().getId()).success();
        } catch (EmailException e) {
            sendEvent(context, user).detail(Details.REASON, e.getMessage()).error(Errors.EMAIL_SEND_FAILED);
            LOGGER.error("Unable to send the reset credentials email", e);
        }
    }

    private static EventBuilder sendEvent(AuthenticationFlowContext context, UserModel user) {
        return context.getEvent().clone()
                .event(EventType.SEND_RESET_PASSWORD)
                .user(user)
                .detail(Details.USERNAME, context.getAuthenticationSession()
                        .getAuthNote(AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME))
                .detail(Details.EMAIL, user.getEmail());
    }

    private static Response emailSentPage(AuthenticationFlowContext context, boolean isResent) {
        return context.form()
                .setAttribute(LINK_SENT_ATTRIBUTE, true)
                .setAttribute(LINK_RESENT_ATTRIBUTE, isResent)
                .setAttribute(LINK_LIFESPAN_ATTRIBUTE, TimeUnit.SECONDS.toMinutes(linkLifespan(context.getRealm())))
                .setAttribute(RESEND_DELAY_ATTRIBUTE, remainingDelay(context.getAuthenticationSession()))
                .createPasswordReset();
    }

    private static long remainingDelay(AuthenticationSessionModel authSession) {
        return ResendDelay.remainingSeconds(authSession.getAuthNote(REQUESTED_AT_NOTE), Time.currentTime());
    }

    private static int linkLifespan(RealmModel realm) {
        return realm.getActionTokenGeneratedByUserLifespan(ResetCredentialsActionToken.TOKEN_TYPE);
    }

    private static boolean isReturningFromLink(AuthenticationFlowContext context) {
        UserModel user = context.getUser();
        return user != null && user.getId()
                .equals(context.getAuthenticationSession().getAuthNote(DefaultActionTokenKey.ACTION_TOKEN_USER_ID));
    }
}

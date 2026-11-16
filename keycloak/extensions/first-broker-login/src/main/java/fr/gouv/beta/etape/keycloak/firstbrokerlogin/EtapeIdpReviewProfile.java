package fr.gouv.beta.etape.keycloak.firstbrokerlogin;

import jakarta.ws.rs.core.MultivaluedMap;
import java.util.List;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.authenticators.broker.IdpReviewProfileAuthenticator;
import org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext;
import org.keycloak.authentication.requiredactions.TermsAndConditions;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.common.util.Time;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;
import org.keycloak.sessions.AuthenticationSessionModel;

/**
 * « Finaliser la création de votre espace » : la revue de profil de Keycloak, montrée à
 * chaque création de compte par un fournisseur d'identité et jamais quand un compte existe
 * déjà, qui exige les conditions générales et garde l'identité transmise par le fournisseur.
 */
public class EtapeIdpReviewProfile extends IdpReviewProfileAuthenticator {

    @Override
    protected boolean requiresUpdateProfilePage(AuthenticationFlowContext context,
            SerializedBrokeredIdentityContext userCtx, BrokeredIdentityContext brokerContext) {
        if (Boolean.parseBoolean(context.getAuthenticationSession().getAuthNote(ENFORCE_UPDATE_PROFILE))) {
            return true;
        }
        return !hasExistingAccount(context, userCtx);
    }

    @Override
    protected void actionImpl(AuthenticationFlowContext context, SerializedBrokeredIdentityContext userCtx,
            BrokeredIdentityContext brokerContext) {
        MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

        if (!TermsAcceptance.isAccepted(formData.getFirst(TermsAcceptance.FIELD))) {
            context.challenge(context.form()
                    .setErrors(List.of(new FormMessage(TermsAcceptance.FIELD, TermsAcceptance.REQUIRED_MESSAGE)))
                    .setAttribute(LoginFormsProvider.UPDATE_PROFILE_CONTEXT_ATTR, userCtx)
                    .setFormData(formData)
                    .createUpdateProfilePage());
            return;
        }

        BrokeredIdentityLock.apply(formData,
                BrokeredIdentityLock.lockedValues(userCtx.getFirstName(), userCtx.getLastName(), userCtx.getEmail()));

        AuthenticationSessionModel authSession = context.getAuthenticationSession();
        authSession.removeAuthNote(ENFORCE_UPDATE_PROFILE);
        super.actionImpl(context, userCtx, brokerContext);

        if (Boolean.parseBoolean(authSession.getAuthNote(ENFORCE_UPDATE_PROFILE))) {
            userCtx.setAttribute(TermsAndConditions.USER_ATTRIBUTE, List.of(Integer.toString(Time.currentTime())));
            userCtx.saveToAuthenticationSession(authSession, BROKERED_CONTEXT_NOTE);
        }
    }

    private static boolean hasExistingAccount(AuthenticationFlowContext context,
            SerializedBrokeredIdentityContext userCtx) {
        RealmModel realm = context.getRealm();
        String email = userCtx.getEmail();
        if (email != null && !realm.isDuplicateEmailsAllowed()
                && context.getSession().users().getUserByEmail(realm, email) != null) {
            return true;
        }
        String username = userCtx.getUsername();
        return username != null && context.getSession().users().getUserByUsername(realm, username) != null;
    }
}

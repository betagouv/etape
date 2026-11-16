package fr.gouv.beta.etape.keycloak.firstbrokerlogin;

import jakarta.ws.rs.core.MultivaluedMap;
import java.util.List;
import java.util.Map;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.FlowStatus;
import org.keycloak.authentication.authenticators.broker.IdpReviewProfileAuthenticator;
import org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext;
import org.keycloak.authentication.requiredactions.TermsAndConditions;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.common.util.Time;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.FormMessage;

/**
 * « Finaliser la création de votre espace » : la revue de profil de Keycloak, montrée à
 * chaque création de compte par un fournisseur d'identité et jamais quand un compte existe
 * déjà, qui exige les conditions générales et garde l'identité transmise par le fournisseur.
 */
public class EtapeIdpReviewProfile extends IdpReviewProfileAuthenticator {

    @Override
    protected boolean requiresUpdateProfilePage(AuthenticationFlowContext context,
            SerializedBrokeredIdentityContext userCtx, BrokeredIdentityContext brokerContext) {
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

        Map<String, String> locked =
                BrokeredIdentityLock.lockedValues(userCtx.getFirstName(), userCtx.getLastName(), userCtx.getEmail());
        BrokeredIdentityLock.apply(formData, locked);

        super.actionImpl(context, userCtx, brokerContext);

        if (context.getStatus() == FlowStatus.SUCCESS) {
            restoreLockedIdentity(userCtx, locked);
            userCtx.setAttribute(TermsAndConditions.USER_ATTRIBUTE, List.of(Integer.toString(Time.currentTime())));
            userCtx.saveToAuthenticationSession(context.getAuthenticationSession(), BROKERED_CONTEXT_NOTE);
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
        String username = realm.isRegistrationEmailAsUsername() && email != null ? email : userCtx.getUsername();
        return username != null && context.getSession().users().getUserByUsername(realm, username) != null;
    }

    private static void restoreLockedIdentity(SerializedBrokeredIdentityContext userCtx, Map<String, String> locked) {
        if (locked.containsKey(UserModel.FIRST_NAME)) {
            userCtx.setFirstName(locked.get(UserModel.FIRST_NAME));
        }
        if (locked.containsKey(UserModel.LAST_NAME)) {
            userCtx.setLastName(locked.get(UserModel.LAST_NAME));
        }
        if (locked.containsKey(UserModel.EMAIL)) {
            userCtx.setEmail(locked.get(UserModel.EMAIL));
        }
    }
}

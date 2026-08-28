import { Button } from "@etape/ui/components/button";
import { useUserProfileForm } from "keycloakify/login/lib/useUserProfileForm";
import { useLayoutEffect, useMemo, useState } from "react";

import { CheckboxField, FieldError } from "../components/form";
import { SocialProviders } from "../components/franceconnect";
import { AccountSwitch } from "../components/prose";
import { PasswordStrength, UserProfileFields } from "../components/user-profile-fields";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

type RegisterProps = EtapePageProps<Extract<KcContext, { pageId: "register.ftl" }>> & {
  doMakeUserConfirmPassword: boolean;
};

export default function Register(props: RegisterProps) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes, doMakeUserConfirmPassword } = props;

  const {
    url,
    messagesPerField,
    recaptchaRequired,
    recaptchaVisible,
    recaptchaSiteKey,
    recaptchaAction,
    termsAcceptanceRequired,
  } = kcContext;

  const { msg, msgStr } = i18n;

  /*
   * Keycloak sert bien ces deux valeurs sur `register.ftl`, mais les types de
   * Keycloakify 11.15 ne les déclarent pas — et pour `passwordRequired`, le
   * gabarit généré ne la recopie même pas dans le contexte. D'où cette lecture
   * explicite, à retirer si une version ultérieure les expose.
   */
  const { passwordRequired, social, profile } = kcContext as typeof kcContext & {
    passwordRequired?: boolean;
    social?: { providers?: { alias: string; displayName: string; loginUrl: string }[] };
    profile: { context?: string };
  };

  /*
   * Sans mot de passe demandé, le compte se crée sans moyen de connexion. La
   * page sert aussi à compléter un profil venu d'un fournisseur d'identité
   * (`context` vaut alors autre chose) : là, il n'y a effectivement rien à
   * définir, l'authentification restant du ressort du fournisseur.
   */
  const isPasswordRequired = passwordRequired ?? profile.context === "REGISTRATION";

  /*
   * `useMemo` obligatoire : `useUserProfileForm` initialise son état à partir de
   * l'objet reçu et le réinitialise s'il change d'identité. Un littéral recréé à
   * chaque rendu vidait les champs déjà saisis à la frappe suivante.
   */
  const patchedKcContext = useMemo(
    () => ({ ...kcContext, passwordRequired: isPasswordRequired }),
    [kcContext, isPasswordRequired],
  );

  const { formState, dispatchFormAction } = useUserProfileForm({
    kcContext: patchedKcContext,
    i18n,
    doMakeUserConfirmPassword,
  });

  const [areTermsAccepted, setAreTermsAccepted] = useState(false);

  useLayoutEffect(() => {
    // Le reCAPTCHA invisible rappelle une fonction globale : elle doit exister
    // avant que son script ne s'exécute, d'où le `useLayoutEffect`.
    (window as unknown as Record<string, unknown>)["onSubmitRecaptcha"] = () => {
      (document.getElementById("kc-register-form") as HTMLFormElement | null)?.requestSubmit();
    };

    return () => {
      delete (window as unknown as Record<string, unknown>)["onSubmitRecaptcha"];
    };
  }, []);

  const isSubmitDisabled =
    !formState.isFormSubmittable || (termsAcceptanceRequired && !areTermsAccepted);

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("etapeRegisterTitle")}
      subtitle={msg("etapeRegisterSubtitle")}
      displayMessage={messagesPerField.exists("global")}
      socialProvidersNode={
        <SocialProviders
          providers={social?.providers}
          separatorLabel={msgStr("etapeOrRegisterEmail")}
          i18n={i18n}
        />
      }
    >
      <form
        id="kc-register-form"
        action={url.registrationAction}
        method="post"
        className="flex flex-col gap-8"
      >
        <UserProfileFields
          formFieldStates={formState.formFieldStates}
          dispatchFormAction={dispatchFormAction}
          i18n={i18n}
          passwordAddon={(value) => <PasswordStrength value={value} i18n={i18n} />}
        />

        {termsAcceptanceRequired && (
          <div className="flex flex-col gap-2">
            <CheckboxField
              id="termsAccepted"
              name="termsAccepted"
              checked={areTermsAccepted}
              onChange={(event) => setAreTermsAccepted(event.target.checked)}
              label={msg("acceptTerms")}
              aria-describedby={
                messagesPerField.existsError("termsAccepted")
                  ? "input-error-terms-accepted"
                  : undefined
              }
            />
            {messagesPerField.existsError("termsAccepted") && (
              <FieldError
                id="input-error-terms-accepted"
                message={messagesPerField.get("termsAccepted")}
              />
            )}
          </div>
        )}

        {recaptchaRequired && (recaptchaVisible || recaptchaAction === undefined) && (
          <div
            className="g-recaptcha"
            data-size="compact"
            data-sitekey={recaptchaSiteKey}
            data-action={recaptchaAction}
          />
        )}

        <div className="flex flex-col gap-4">
          {recaptchaRequired && !recaptchaVisible && recaptchaAction !== undefined ? (
            <Button
              type="submit"
              size="xl"
              className="g-recaptcha w-full rounded-lg"
              data-sitekey={recaptchaSiteKey}
              data-callback="onSubmitRecaptcha"
              data-action={recaptchaAction}
            >
              {msg("doRegister")}
            </Button>
          ) : (
            <Button
              type="submit"
              size="xl"
              disabled={isSubmitDisabled}
              className="w-full rounded-lg"
            >
              {msg("doRegister")}
            </Button>
          )}

          <AccountSwitch
            question={msg("etapeAlreadyAccount")}
            href={url.loginUrl}
            label={msg("doLogIn")}
          />
        </div>
      </form>
    </Template>
  );
}

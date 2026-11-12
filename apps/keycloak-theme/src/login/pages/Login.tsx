import { Button } from "@etape/ui/components/button";
import { StatusRegion } from "@etape/ui/components/status-region";

import { Alert, MESSAGE_TYPE } from "../components/alert";
import { Field, FieldError, PasswordInput, TextInput } from "../components/form";
import { SocialProviders } from "../components/franceconnect";
import { HeaderAccountSwitch } from "../components/prose";
import { LOGIN_FIELD, useLoginForm } from "../hooks/use-login-form";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

const EMAIL_FORMAT_ERROR_ID = "input-error-username";
const CREDENTIALS_ERROR_ID = "input-error";
const INCOMPLETE_HINT_ID = "login-incomplete-hint";

export default function Login(props: EtapePageProps<Extract<KcContext, { pageId: "login.ftl" }>>) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const {
    social,
    realm,
    url,
    usernameHidden,
    login,
    auth,
    registrationDisabled,
    messagesPerField,
  } = kcContext;

  const { msg, msgStr } = i18n;

  const isUsernameHidden = usernameHidden ?? false;
  const isEmailIdentifier = realm.loginWithEmailAllowed && realm.registrationEmailAsUsername;

  const form = useLoginForm({
    initialUsername: login.username ?? "",
    isUsernameHidden,
    shouldCheckEmailFormat: isEmailIdentifier,
  });

  /*
   * Keycloak ne dit jamais lequel des deux champs est en cause — répondre
   * « mot de passe incorrect » révélerait que l'adresse existe. L'erreur porte
   * donc sur les deux champs à la fois.
   */
  const hasCredentialsError = messagesPerField.existsError(
    LOGIN_FIELD.USERNAME,
    LOGIN_FIELD.PASSWORD,
  );

  const isRegistrationAllowed = realm.registrationAllowed && !registrationDisabled;

  const usernameLabel = !realm.loginWithEmailAllowed
    ? msg("username")
    : !realm.registrationEmailAsUsername
      ? msg("usernameOrEmail")
      : msg("email");

  const usernameDescribedBy = form.hasEmailFormatError
    ? EMAIL_FORMAT_ERROR_ID
    : hasCredentialsError
      ? CREDENTIALS_ERROR_ID
      : undefined;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("etapeLoginTitle")}
      displayMessage={!hasCredentialsError}
      slots={{
        accountSwitch: isRegistrationAllowed && (
          <HeaderAccountSwitch
            question={msg("etapeNoAccount")}
            href={url.registrationUrl}
            label={msg("etapeCreateAccount")}
          />
        ),
      }}
      socialProvidersNode={
        <SocialProviders
          providers={social?.providers}
          separatorLabel={msgStr("etapeOrCredentials")}
          i18n={i18n}
        />
      }
    >
      {realm.password && (
        <form
          id="kc-form-login"
          action={url.loginAction}
          method="post"
          noValidate
          onSubmit={form.submit}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              {!isUsernameHidden && (
                <Field
                  id="username"
                  label={usernameLabel}
                  required
                  error={
                    form.hasEmailFormatError ? (
                      <FieldError
                        id={EMAIL_FORMAT_ERROR_ID}
                        message={msgStr("etapeEmailFormatInvalid")}
                      />
                    ) : undefined
                  }
                >
                  <TextInput
                    id="username"
                    name={LOGIN_FIELD.USERNAME}
                    type="text"
                    inputMode={isEmailIdentifier ? "email" : undefined}
                    autoFocus
                    autoComplete="username"
                    aria-required
                    aria-describedby={usernameDescribedBy}
                    aria-invalid={hasCredentialsError || undefined}
                    defaultValue={login.username ?? ""}
                    onChange={form.changeUsername}
                    onAnimationStart={form.detectAutofill(LOGIN_FIELD.USERNAME)}
                    onBlur={form.checkEmailFormat}
                    invalid={form.hasEmailFormatError}
                  />
                </Field>
              )}

              <Field
                id="password"
                label={msg("password")}
                required
                labelAction={
                  realm.resetPasswordAllowed && (
                    <a
                      href={url.loginResetCredentialsUrl}
                      className="text-foreground text-sm font-normal hover:underline"
                    >
                      {msg("doForgotPassword")}
                    </a>
                  )
                }
              >
                <PasswordInput
                  id="password"
                  name={LOGIN_FIELD.PASSWORD}
                  i18n={i18n}
                  autoComplete="current-password"
                  aria-required
                  aria-describedby={hasCredentialsError ? CREDENTIALS_ERROR_ID : undefined}
                  aria-invalid={hasCredentialsError || undefined}
                  onChange={form.changePassword}
                  onAnimationStart={form.detectAutofill(LOGIN_FIELD.PASSWORD)}
                />
              </Field>
            </div>

            {hasCredentialsError && (
              <Alert
                id={CREDENTIALS_ERROR_ID}
                type={MESSAGE_TYPE.ERROR}
                summary={messagesPerField.getFirstError(LOGIN_FIELD.USERNAME, LOGIN_FIELD.PASSWORD)}
              />
            )}
          </div>

          <input type="hidden" name="credentialId" value={auth.selectedCredential} readOnly />

          <Button
            type="submit"
            id="kc-login"
            name="login"
            size="form"
            aria-disabled={!form.isSubmittable || form.isSubmitting}
            aria-busy={form.isSubmitting}
            aria-describedby={form.isSubmittable ? undefined : INCOMPLETE_HINT_ID}
            className="w-full"
          >
            {msg("doLogIn")}
          </Button>

          {!form.isSubmittable && (
            <span id={INCOMPLETE_HINT_ID} className="sr-only">
              {msg("etapeLoginIncomplete")}
            </span>
          )}

          <StatusRegion
            message={form.shouldAnnounceIncomplete ? msgStr("etapeLoginIncomplete") : ""}
          />
        </form>
      )}
    </Template>
  );
}

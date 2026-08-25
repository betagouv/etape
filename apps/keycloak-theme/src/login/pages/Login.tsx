import { Button } from "@etape/ui/components/button";
import { Mail } from "lucide-react";
import { useState } from "react";

import { CheckboxField, Field, FieldError, PasswordInput, TextInput } from "../components/form";
import { SocialProviders } from "../components/franceconnect";
import { AccountSwitch } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

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

  const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

  /*
   * Keycloak ne dit jamais lequel des deux champs est en cause — répondre
   * « mot de passe incorrect » révélerait que l'adresse existe. L'erreur porte
   * donc sur les deux champs à la fois.
   */
  const hasCredentialsError = messagesPerField.existsError("username", "password");

  const isRegistrationAllowed = realm.registrationAllowed && !registrationDisabled;

  const usernameLabel = !realm.loginWithEmailAllowed
    ? msg("username")
    : !realm.registrationEmailAsUsername
      ? msg("usernameOrEmail")
      : msg("email");

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("etapeLoginTitle")}
      subtitle={msg("etapeLoginSubtitle")}
      displayMessage={!hasCredentialsError}
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
          onSubmit={() => {
            // Empêche le double envoi : le formulaire part vers Keycloak, la
            // page reste affichée le temps de la redirection.
            setIsLoginButtonDisabled(true);
            return true;
          }}
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col gap-4">
            {!usernameHidden && (
              <Field
                id="username"
                label={usernameLabel}
                required
                error={
                  hasCredentialsError && (
                    <FieldError
                      id="input-error"
                      message={messagesPerField.getFirstError("username", "password")}
                    />
                  )
                }
              >
                <TextInput
                  id="username"
                  name="username"
                  type="text"
                  icon={Mail}
                  autoFocus
                  autoComplete="username"
                  aria-required
                  defaultValue={login.username ?? ""}
                  invalid={hasCredentialsError}
                />
              </Field>
            )}

            <Field
              id="password"
              label={msg("password")}
              required
              error={
                usernameHidden &&
                hasCredentialsError && (
                  <FieldError
                    id="input-error"
                    message={messagesPerField.getFirstError("username", "password")}
                  />
                )
              }
            >
              <PasswordInput
                id="password"
                name="password"
                i18n={i18n}
                autoComplete="current-password"
                aria-required
                invalid={hasCredentialsError}
              />
            </Field>

            {(realm.rememberMe || realm.resetPasswordAllowed) && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                {realm.rememberMe && !usernameHidden ? (
                  <CheckboxField
                    id="rememberMe"
                    name="rememberMe"
                    defaultChecked={Boolean(login.rememberMe)}
                    label={msg("rememberMe")}
                  />
                ) : (
                  <span />
                )}
                {realm.resetPasswordAllowed && (
                  <a
                    href={url.loginResetCredentialsUrl}
                    className="text-label-lg text-content-accent hover:text-content-accent-hover font-semibold hover:underline"
                  >
                    {msg("doForgotPassword")}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <input type="hidden" name="credentialId" value={auth.selectedCredential} readOnly />

            <Button
              type="submit"
              id="kc-login"
              name="login"
              size="xl"
              disabled={isLoginButtonDisabled}
              className="w-full rounded-lg"
            >
              {msg("doLogIn")}
            </Button>

            {isRegistrationAllowed && (
              <AccountSwitch
                question={msg("etapeNoAccount")}
                href={url.registrationUrl}
                label={msg("etapeCreateAccount")}
              />
            )}
          </div>
        </form>
      )}
    </Template>
  );
}

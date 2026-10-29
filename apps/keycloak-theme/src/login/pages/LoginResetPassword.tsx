import { Button } from "@etape/ui/components/button";

import { AltchaField } from "../components/altcha/altcha-field";
import { Field, FieldError, TextInput } from "../components/form";
import { BackLink, CreateAccountSwitch } from "../components/prose";
import { RESET_PASSWORD_FIELD, useResetPasswordForm } from "../hooks/use-reset-password-form";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

const USERNAME_ERROR_ID = "input-error-username";

export default function LoginResetPassword(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-reset-password.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, realm, auth, login, messagesPerField, altchaChallenge, altchaUnavailable } =
    kcContext;
  const { msg, msgStr } = i18n;

  const form = useResetPasswordForm({
    initialUsername: auth.attemptedUsername ?? login?.username ?? "",
    shouldCheckEmailFormat: realm.loginWithEmailAllowed && realm.registrationEmailAsUsername,
  });

  const hasError = messagesPerField.existsError("username");
  const hasUsernameError = form.hasEmailFormatError || hasError;
  const hasAltchaError = messagesPerField.existsError("altcha");
  const shouldFocusAltcha = hasAltchaError && altchaChallenge !== undefined;

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
      headerNode={msg("etapeResetPasswordTitle")}
      displayMessage={!hasError && !hasAltchaError}
      backLinkNode={<BackLink href={url.loginUrl} label={msg("etapeBackToLogin")} />}
      accountSwitchNode={
        <CreateAccountSwitch
          isAllowed={realm.registrationAllowed}
          href={url.registrationUrl}
          i18n={i18n}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-body text-accent-foreground">{msg("etapeResetPasswordSubtitle")}</p>

        <form
          id="kc-reset-password-form"
          action={url.loginAction}
          method="post"
          onSubmit={form.submit}
          className="flex flex-col gap-6"
        >
          <Field
            id="username"
            label={usernameLabel}
            required
            hint={msg("etapeResetPasswordFranceConnectHint")}
            error={
              form.hasEmailFormatError ? (
                <FieldError id={USERNAME_ERROR_ID} message={msgStr("etapeEmailFormatInvalid")} />
              ) : hasError ? (
                <FieldError id={USERNAME_ERROR_ID} message={messagesPerField.get("username")} />
              ) : undefined
            }
          >
            <TextInput
              id="username"
              name={RESET_PASSWORD_FIELD.USERNAME}
              type="text"
              inputMode={realm.registrationEmailAsUsername ? "email" : undefined}
              autoFocus={!shouldFocusAltcha}
              autoComplete="username"
              aria-required
              aria-describedby={hasUsernameError ? USERNAME_ERROR_ID : undefined}
              value={form.username}
              onChange={(event) => form.changeUsername(event.target.value)}
              onBlur={form.checkEmailFormat}
              invalid={hasUsernameError}
            />
          </Field>

          <AltchaField
            challenge={altchaChallenge}
            isUnavailable={altchaUnavailable ?? false}
            serverError={hasAltchaError ? messagesPerField.get("altcha") : undefined}
            i18n={i18n}
          />

          <Button type="submit" size="form" className="w-full">
            {msg("etapeResetPasswordCta")}
          </Button>
        </form>
      </div>
    </Template>
  );
}

import { Button } from "@etape/ui/components/button";

import { AltchaField } from "../components/altcha/altcha-field";
import { Field, FieldError, TextInput } from "../components/form";
import { BackLink, CreateAccountSwitch } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function LoginResetPassword(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-reset-password.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, realm, auth, login, messagesPerField, altchaChallenge, altchaUnavailable } =
    kcContext;
  const { msg } = i18n;

  const hasError = messagesPerField.existsError("username");
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
          className="flex flex-col gap-6"
        >
          <Field
            id="username"
            label={usernameLabel}
            required
            hint={msg("etapeResetPasswordFranceConnectHint")}
            error={
              hasError ? (
                <FieldError id="input-error-username" message={messagesPerField.get("username")} />
              ) : undefined
            }
          >
            <TextInput
              id="username"
              name="username"
              type="text"
              inputMode={realm.registrationEmailAsUsername ? "email" : undefined}
              autoFocus={!shouldFocusAltcha}
              autoComplete="username"
              aria-required
              aria-describedby={hasError ? "input-error-username" : undefined}
              defaultValue={auth.attemptedUsername ?? login?.username ?? ""}
              invalid={hasError}
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

import { Button } from "@etape/ui/components/button";
import { useState } from "react";

import { CheckboxField, Field, FieldError, PasswordInput } from "../components/form";
import { PasswordStrength } from "../components/user-profile-fields";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function LoginUpdatePassword(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-update-password.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, messagesPerField, isAppInitiatedAction } = kcContext;
  const { msg } = i18n;

  const [password, setPassword] = useState("");

  const hasError = messagesPerField.existsError("password", "password-confirm");

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("updatePasswordTitle")}
      subtitle={msg("etapeUpdatePasswordSubtitle")}
      displayMessage={!hasError}
    >
      <form
        id="kc-passwd-update-form"
        action={url.loginAction}
        method="post"
        className="flex flex-col gap-8"
      >
        <div className="flex flex-col gap-4">
          <Field
            id="password-new"
            label={msg("passwordNew")}
            required
            error={
              messagesPerField.existsError("password") ? (
                <FieldError id="input-error-password" message={messagesPerField.get("password")} />
              ) : undefined
            }
          >
            <PasswordInput
              id="password-new"
              name="password-new"
              i18n={i18n}
              autoFocus
              autoComplete="new-password"
              aria-required
              aria-describedby={
                messagesPerField.existsError("password") ? "input-error-password" : undefined
              }
              invalid={hasError}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordStrength value={password} i18n={i18n} />
          </Field>

          <Field
            id="password-confirm"
            label={msg("passwordConfirm")}
            required
            error={
              messagesPerField.existsError("password-confirm") ? (
                <FieldError
                  id="input-error-password-confirm"
                  message={messagesPerField.get("password-confirm")}
                />
              ) : undefined
            }
          >
            <PasswordInput
              id="password-confirm"
              name="password-confirm"
              i18n={i18n}
              autoComplete="new-password"
              aria-required
              aria-describedby={
                messagesPerField.existsError("password-confirm")
                  ? "input-error-password-confirm"
                  : undefined
              }
              invalid={hasError}
            />
          </Field>

          <CheckboxField
            id="logout-sessions"
            name="logout-sessions"
            value="on"
            defaultChecked
            label={msg("logoutOtherSessions")}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Button type="submit" size="xl" className="w-full rounded-lg">
            {msg("etapeUpdatePasswordCta")}
          </Button>
          {/*
           * Le changement de mot de passe peut être déclenché par
           * l'application elle-même : dans ce cas seulement, on peut y
           * renoncer et poursuivre.
           */}
          {isAppInitiatedAction && (
            <Button
              type="submit"
              name="cancel-aia"
              value="true"
              variant="outline"
              size="xl"
              className="w-full rounded-lg"
            >
              {msg("doCancel")}
            </Button>
          )}
        </div>
      </form>
    </Template>
  );
}

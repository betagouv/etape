import { Button } from "@etape/ui/components/button";
import { Mail } from "lucide-react";

import { Field, FieldError, TextInput } from "../components/form";
import { BackToLogin } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function LoginResetPassword(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-reset-password.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, realm, auth, messagesPerField } = kcContext;
  const { msg } = i18n;

  const hasError = messagesPerField.existsError("username");

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
      subtitle={msg("etapeResetPasswordSubtitle")}
      displayMessage={!hasError}
    >
      <form
        id="kc-reset-password-form"
        action={url.loginAction}
        method="post"
        className="flex flex-col gap-8"
      >
        <Field
          id="username"
          label={usernameLabel}
          required
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
            icon={Mail}
            autoFocus
            autoComplete="username"
            aria-required
            defaultValue={auth.attemptedUsername ?? ""}
            invalid={hasError}
          />
        </Field>

        <div className="flex flex-col gap-4">
          <Button type="submit" size="xl" className="w-full rounded-lg">
            {msg("etapeResetPasswordCta")}
          </Button>
          <BackToLogin href={url.loginUrl} label={msg("backToLogin")} />
        </div>
      </form>
    </Template>
  );
}

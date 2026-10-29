import { Button } from "@etape/ui/components/button";

import { MESSAGE_TYPE } from "../components/alert";
import { Field, FieldError, PasswordInput } from "../components/form";
import { CreateAccountSwitch } from "../components/prose";
import { PASSWORD_RULES_ID, PasswordRules } from "../components/user-profile-fields";
import { useUpdatePasswordForm } from "../hooks/use-update-password-form";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

const PASSWORD_ERROR_ID = "input-error-password";

/**
 * « Choisir un nouveau mot de passe » (Figma FRONT-OFFICE, écran 10).
 *
 * Un seul champ : Keycloak exige quand même `password-confirm`, recopié en champ
 * caché. Les autres sessions sont fermées d'office, la maquette ne proposant
 * plus de case pour le choisir, ni l'avertissement « Vous devez changer votre
 * mot de passe », qui redit le titre.
 */
export default function LoginUpdatePassword(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-update-password.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, realm, username, message, messagesPerField, isAppInitiatedAction } = kcContext;
  const { msg } = i18n;

  const form = useUpdatePasswordForm();

  const hasError = messagesPerField.existsError("password", "password-confirm");
  const isActionWarning = message?.type === MESSAGE_TYPE.WARNING;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("etapeUpdatePasswordTitle")}
      displayMessage={!hasError && !isActionWarning}
      accountSwitchNode={
        <CreateAccountSwitch
          isAllowed={realm.registrationAllowed}
          href={url.registrationUrl}
          i18n={i18n}
        />
      }
    >
      <form
        id="kc-passwd-update-form"
        action={url.loginAction}
        method="post"
        noValidate
        onSubmit={form.submit}
        className="flex flex-col gap-6"
      >
        {username !== undefined && username !== "" && (
          <p className="text-body-sm text-foreground flex flex-wrap gap-x-1">
            {msg("etapeUpdatePasswordAccount")}
            <span className="font-medium break-all">{username}</span>
          </p>
        )}

        <Field
          id="password-new"
          label={msg("passwordNew")}
          required
          error={
            hasError ? (
              <FieldError
                id={PASSWORD_ERROR_ID}
                message={messagesPerField.getFirstError("password", "password-confirm")}
              />
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
              hasError ? `${PASSWORD_ERROR_ID} ${PASSWORD_RULES_ID}` : PASSWORD_RULES_ID
            }
            invalid={hasError}
            value={form.password}
            onChange={(event) => form.changePassword(event.target.value)}
          />
          <div hidden={form.password === ""}>
            <PasswordRules value={form.password} i18n={i18n} />
          </div>
        </Field>

        <input type="hidden" name="password-confirm" value={form.password} readOnly />
        <input type="hidden" name="logout-sessions" value="on" readOnly />

        <div className="flex flex-col gap-4">
          <Button
            type="submit"
            size="form"
            className="w-full aria-busy:cursor-progress"
            aria-disabled={form.isSubmitBlocked}
            aria-busy={form.isSubmitting}
          >
            {msg("etapeUpdatePasswordCta")}
          </Button>
          {isAppInitiatedAction && (
            <Button
              type="submit"
              name="cancel-aia"
              value="true"
              variant="outline"
              size="form"
              className="w-full"
            >
              {msg("doCancel")}
            </Button>
          )}
        </div>
      </form>
    </Template>
  );
}

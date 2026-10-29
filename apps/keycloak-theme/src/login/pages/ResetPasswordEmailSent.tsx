import { Button } from "@etape/ui/components/button";
import { StatusRegion } from "@etape/ui/components/status-region";

import { CreateAccountSwitch, InlineAction } from "../components/prose";
import { SUPPORT_EMAIL } from "../components/support-footer";
import { useResendCountdown } from "../hooks/use-resend-countdown";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

const RESEND_COUNTDOWN_ID = "resend-countdown";
const EMAIL_NOT_RECEIVED_TITLE_ID = "email-not-received-title";

/**
 * « Consultez votre boîte e-mail » (Figma FRONT-OFFICE, écrans 08 et 09).
 *
 * Keycloak n'a pas d'écran pour cela : c'est `login-reset-password.ftl`, rendu
 * par l'extension `etape-reset-credential-email` avec `etapeResetLinkSent`.
 */
export default function ResetPasswordEmailSent(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-reset-password.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const {
    url,
    realm,
    etapeResetLinkLifespanMinutes,
    etapeResendDelaySeconds = 0,
    etapeResetLinkResent = false,
  } = kcContext;
  const { msg } = i18n;

  const resend = useResendCountdown({
    initialSeconds: etapeResendDelaySeconds,
    isResent: etapeResetLinkResent,
    i18n,
  });

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("etapeResetEmailSentTitle")}
      displayMessage={false}
      accountSwitchNode={
        <CreateAccountSwitch
          isAllowed={realm.registrationAllowed}
          href={url.registrationUrl}
          i18n={i18n}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-body text-accent-foreground">{msg("etapeResetEmailSentBody")}</p>
        {etapeResetLinkLifespanMinutes !== undefined && (
          <p className="text-body text-accent-foreground">
            {msg("etapeResetLinkLifespan", String(etapeResetLinkLifespanMinutes))}
          </p>
        )}

        <section
          aria-labelledby={EMAIL_NOT_RECEIVED_TITLE_ID}
          className="bg-secondary flex flex-col gap-3 rounded-md px-4 py-3"
        >
          <h2
            id={EMAIL_NOT_RECEIVED_TITLE_ID}
            className="text-body text-accent-foreground font-medium"
          >
            {msg("etapeEmailNotReceivedTitle")}
          </h2>
          <p className="text-body-sm text-muted-foreground">{msg("etapeEmailNotReceivedHint")}</p>
          <form
            action={url.loginAction}
            method="post"
            onSubmit={resend.submit}
            className="flex flex-wrap items-center gap-2"
          >
            <Button
              type="submit"
              name="resend"
              value="true"
              size="form-sm"
              aria-disabled={!resend.isAvailable || resend.isSubmitting}
              aria-busy={resend.isSubmitting}
              aria-describedby={resend.isAvailable ? undefined : RESEND_COUNTDOWN_ID}
            >
              {msg("etapeResendEmail")}
            </Button>
            {!resend.isAvailable && (
              <p id={RESEND_COUNTDOWN_ID} className="text-body-sm text-foreground">
                {msg("etapeResendAvailableIn")}{" "}
                <span className="text-primary">{resend.remainingLabel}</span>
              </p>
            )}
          </form>
          <StatusRegion message={resend.announcement} />
        </section>

        <div className="flex flex-col gap-3">
          <form action={url.loginAction} method="post">
            <InlineAction question={msg("etapeWrongEmail")}>
              <Button type="submit" name="edit-email" value="true" variant="link" size="inline">
                {msg("etapeEditEmail")}
              </Button>
            </InlineAction>
          </form>
          <InlineAction question={msg("etapeNoEmailAccess")}>
            <Button asChild variant="link" size="inline">
              <a href={`mailto:${SUPPORT_EMAIL}`}>{msg("etapeContactSupport")}</a>
            </Button>
          </InlineAction>
        </div>
      </div>
    </Template>
  );
}

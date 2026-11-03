import { Button } from "@etape/ui/components/button";
import { MailCheck } from "lucide-react";
import { useState } from "react";

import { Alert, MESSAGE_TYPE } from "../components/alert";
import { Prose } from "../components/prose";
import { readSubmittedForm, SUBMITTED_FORM } from "../components/submitted-form";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

type LoginVerifyEmailProps = EtapePageProps<
  Extract<KcContext, { pageId: "login-verify-email.ftl" }>
>;

export default function LoginVerifyEmail(props: LoginVerifyEmailProps) {
  const [submittedForm] = useState(readSubmittedForm);

  return submittedForm === SUBMITTED_FORM.LOGIN ? (
    <AccountNotActivated {...props} />
  ) : (
    <ActivationEmailSent {...props} />
  );
}

function AccountNotActivated(props: LoginVerifyEmailProps) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, user } = kcContext;
  const { msg, msgStr } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("etapeLoginTitle")}
    >
      <Alert type={MESSAGE_TYPE.ERROR} summary={msgStr("etapeAccountNotActivated")}>
        <p className="text-foreground">{msg("etapeAccountNotActivatedHint", user?.email ?? "")}</p>
        <div>
          <Button asChild variant="outline" size="sm" className="rounded-lg">
            <a href={url.loginAction}>{msg("etapeResendActivationEmail")}</a>
          </Button>
        </div>
      </Alert>
    </Template>
  );
}

function ActivationEmailSent(props: LoginVerifyEmailProps) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, user } = kcContext;
  const { msg } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("emailVerifyTitle")}
      subtitle={msg("etapeVerifyEmailSubtitle")}
    >
      <div className="flex flex-col gap-4">
        <span className="bg-secondary text-content-accent flex size-12 items-center justify-center rounded-full">
          <MailCheck aria-hidden className="size-6" />
        </span>
        <Prose>
          <p>{msg("emailVerifyInstruction1", user?.email ?? "")}</p>
          <p>
            {msg("emailVerifyInstruction2")} <a href={url.loginAction}>{msg("doClickHere")}</a>{" "}
            {msg("emailVerifyInstruction3")}
          </p>
        </Prose>
      </div>
    </Template>
  );
}

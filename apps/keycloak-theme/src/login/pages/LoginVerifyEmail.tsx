import { MailCheck } from "lucide-react";

import { Prose } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function LoginVerifyEmail(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-verify-email.ftl" }>>,
) {
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

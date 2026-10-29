import { Button } from "@etape/ui/components/button";

import { Alert, MESSAGE_TYPE } from "../components/alert";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function LoginVerifyEmail(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-verify-email.ftl" }>>,
) {
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

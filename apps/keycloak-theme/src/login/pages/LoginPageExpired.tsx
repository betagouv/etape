import { Button } from "@etape/ui/components/button";

import { Prose } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function LoginPageExpired(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-page-expired.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url } = kcContext;
  const { msg } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("pageExpiredTitle")}
      subtitle={msg("etapePageExpiredSubtitle")}
    >
      <Prose>
        <p id="instruction1">{msg("pageExpiredMsg1")}</p>
      </Prose>
      <div className="flex flex-col gap-4">
        {/*
         * Deux issues, et l'ordre compte : reprendre la connexion depuis le
         * début est le cas courant ; poursuivre là où la session s'est
         * interrompue ne fonctionne que si l'étape en cours est encore valide.
         */}
        <Button asChild size="xl" className="w-full rounded-lg">
          <a id="loginRestartLink" href={url.loginRestartFlowUrl}>
            {msg("etapePageExpiredRestart")}
          </a>
        </Button>
        <Button asChild variant="outline" size="xl" className="w-full rounded-lg">
          <a id="loginContinueLink" href={url.loginAction}>
            {msg("etapePageExpiredContinue")}
          </a>
        </Button>
      </div>
    </Template>
  );
}

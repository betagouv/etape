import { Button } from "@etape/ui/components/button";
import { kcSanitize } from "keycloakify/lib/kcSanitize";

import { Prose } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function Error(props: EtapePageProps<Extract<KcContext, { pageId: "error.ftl" }>>) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { message, client, skipLink, url } = kcContext;
  const { msg, msgStr } = i18n;

  // Extrait plutôt que testé sur place : `Boolean(client?.baseUrl)` en garde de
  // rendu ne dit rien au typage, et obligeait à réaffirmer l'existence en dessous.
  const backToApplicationUrl = skipLink ? undefined : client?.baseUrl;

  const isExpiredLink =
    message.summary === msgStr("expiredActionTokenNoSessionMessage") ||
    message.summary === msgStr("expiredActionTokenSessionExistsMessage");

  const resetCredentialsUrl = isExpiredLink ? url.loginResetCredentialsUrl : undefined;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      displayMessage={false}
      headerNode={isExpiredLink ? msg("etapeExpiredLinkTitle") : msg("errorTitle")}
      subtitle={isExpiredLink ? undefined : msg("etapeErrorSubtitle")}
    >
      <div id="kc-error-message" className="flex flex-col gap-8">
        <Prose>
          <p dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }} />
        </Prose>
        {(resetCredentialsUrl ?? backToApplicationUrl) !== undefined && (
          <div className="flex flex-col gap-4">
            {resetCredentialsUrl !== undefined && (
              <Button asChild size="xl" className="w-full rounded-lg">
                <a id="resetPasswordLink" href={resetCredentialsUrl}>
                  {msg("etapeExpiredLinkRestart")}
                </a>
              </Button>
            )}
            {backToApplicationUrl !== undefined && (
              <Button
                asChild
                variant={resetCredentialsUrl !== undefined ? "outline" : "default"}
                size="xl"
                className="w-full rounded-lg"
              >
                <a id="backToApplication" href={backToApplicationUrl}>
                  {msg("backToApplication")}
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </Template>
  );
}

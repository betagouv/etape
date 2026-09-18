import { Button } from "@etape/ui/components/button";
import { kcSanitize } from "keycloakify/lib/kcSanitize";

import { Prose } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function Info(props: EtapePageProps<Extract<KcContext, { pageId: "info.ftl" }>>) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { messageHeader, message, requiredActions, skipLink, pageRedirectUri, actionUri, client } =
    kcContext;

  const { msg, advancedMsgStr } = i18n;

  const continueUrl = pageRedirectUri ?? actionUri ?? client.baseUrl;
  const continueLabel =
    actionUri !== undefined ? msg("proceedWithAction") : msg("backToApplication");

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      displayMessage={false}
      headerNode={
        <span
          dangerouslySetInnerHTML={{
            __html: kcSanitize(messageHeader ? advancedMsgStr(messageHeader) : message.summary),
          }}
        />
      }
    >
      <div id="kc-info-message" className="flex flex-col gap-8">
        <Prose>
          <p dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary?.trim() ?? "") }} />
          {requiredActions !== undefined && (
            <p className="text-foreground font-semibold">
              {requiredActions
                .map((requiredAction) => advancedMsgStr(`requiredAction.${requiredAction}`))
                .join(", ")}
            </p>
          )}
        </Prose>
        {!skipLink && continueUrl !== undefined && (
          <Button asChild size="xl" className="w-full rounded-lg">
            <a href={continueUrl}>{continueLabel}</a>
          </Button>
        )}
      </div>
    </Template>
  );
}

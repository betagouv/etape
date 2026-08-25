import { Button } from "@etape/ui/components/button";
import { kcSanitize } from "keycloakify/lib/kcSanitize";

import { Prose } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function Error(props: EtapePageProps<Extract<KcContext, { pageId: "error.ftl" }>>) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { message, client, skipLink } = kcContext;
  const { msg } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      displayMessage={false}
      headerNode={msg("errorTitle")}
      subtitle={msg("etapeErrorSubtitle")}
    >
      <div id="kc-error-message" className="flex flex-col gap-8">
        <Prose>
          <p dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }} />
        </Prose>
        {!skipLink && Boolean(client?.baseUrl) && (
          <Button asChild size="xl" className="w-full rounded-lg">
            <a id="backToApplication" href={client!.baseUrl}>
              {msg("backToApplication")}
            </a>
          </Button>
        )}
      </div>
    </Template>
  );
}

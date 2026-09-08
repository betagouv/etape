import { Button } from "@etape/ui/components/button";

import { BackToLogin, Prose } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

export default function LogoutConfirm(
  props: EtapePageProps<Extract<KcContext, { pageId: "logout-confirm.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, client, logoutConfirm } = kcContext;
  const { msg } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("logoutConfirmTitle")}
    >
      <div id="kc-logout-confirm" className="flex flex-col gap-8">
        <Prose>
          <p>{msg("logoutConfirmHeader")}</p>
        </Prose>
        <form action={url.logoutConfirmAction} method="POST" className="flex flex-col gap-4">
          <input type="hidden" name="session_code" value={logoutConfirm.code} readOnly />
          <Button
            type="submit"
            name="confirmLogout"
            id="kc-logout"
            size="xl"
            className="w-full rounded-lg"
          >
            {msg("doLogout")}
          </Button>
          {!logoutConfirm.skipLink && Boolean(client.baseUrl) && (
            <BackToLogin href={client.baseUrl!} label={msg("backToApplication")} />
          )}
        </form>
      </div>
    </Template>
  );
}

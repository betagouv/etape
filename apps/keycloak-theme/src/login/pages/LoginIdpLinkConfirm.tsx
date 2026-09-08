import { Button } from "@etape/ui/components/button";

import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

/**
 * Première étape de la liaison de comptes : une identité FranceConnect arrive
 * avec une adresse email qui existe déjà en compte local.
 *
 * C'est l'écran le plus sensible du parcours — accepter la fusion sans preuve
 * de maîtrise de la boîte mail serait une prise de contrôle de compte. Le flux
 * `first broker login` enchaîne ensuite sur une vérification par email ; ce que
 * l'on confirme ici, c'est seulement l'intention de lier.
 */
export default function LoginIdpLinkConfirm(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-idp-link-confirm.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, idpAlias } = kcContext;
  const { msg } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("confirmLinkIdpTitle")}
    >
      <form id="kc-link-idp-form" action={url.loginAction} method="post">
        <div className="flex flex-col gap-4">
          <Button
            type="submit"
            name="submitAction"
            id="linkAccount"
            value="linkAccount"
            size="xl"
            className="w-full rounded-lg"
          >
            {msg("confirmLinkIdpContinue", idpAlias)}
          </Button>
          <Button
            type="submit"
            name="submitAction"
            id="updateProfile"
            value="updateProfile"
            variant="outline"
            size="xl"
            className="w-full rounded-lg"
          >
            {msg("confirmLinkIdpReviewProfile")}
          </Button>
        </div>
      </form>
    </Template>
  );
}

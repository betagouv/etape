import { MailCheck } from "lucide-react";

import { Prose } from "../components/prose";
import type { EtapePageProps } from "./PageProps";
import type { KcContext } from "../KcContext";

/**
 * Seconde étape de la liaison de comptes : l'email de vérification est parti.
 *
 * C'est cette vérification qui rend la fusion sûre — sans elle, n'importe qui
 * pourrait créer un compte avec l'adresse d'autrui et récupérer son dossier à
 * la première connexion FranceConnect.
 */
export default function LoginIdpLinkEmail(
  props: EtapePageProps<Extract<KcContext, { pageId: "login-idp-link-email.ftl" }>>,
) {
  const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

  const { url, realm, brokerContext, idpAlias } = kcContext;
  const { msg } = i18n;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      headerNode={msg("emailLinkIdpTitle", idpAlias)}
    >
      <div className="flex flex-col gap-4">
        <span className="bg-secondary text-content-accent flex size-12 items-center justify-center rounded-full">
          <MailCheck aria-hidden className="size-6" />
        </span>
        <Prose>
          <p id="instruction1">
            {msg("emailLinkIdp1", idpAlias, brokerContext.username, realm.displayName)}
          </p>
          <p id="instruction2">
            {msg("emailLinkIdp2")} <a href={url.loginAction}>{msg("doClickHere")}</a>{" "}
            {msg("emailLinkIdp3")}
          </p>
          <p id="instruction3">
            {msg("emailLinkIdp4")} <a href={url.loginAction}>{msg("doClickHere")}</a>{" "}
            {msg("emailLinkIdp5")}
          </p>
        </Prose>
      </div>
    </Template>
  );
}

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
  const retourApplication = skipLink ? undefined : client?.baseUrl;

  /*
   * Un lien de réinitialisation périmé aboutit ici, et c'est le seul écran du
   * parcours « mot de passe oublié » dont on ne peut pas repartir : sans issue,
   * il faut retrouver la page de connexion à la main pour tout recommencer.
   *
   * Keycloak ne transmet pas la clé du message, seulement son texte déjà
   * traduit — d'où cette comparaison. Elle tient parce que les deux chaînes
   * sortent de la même source : Keycloakify recopie nos traductions dans le
   * paquet de messages que le serveur utilise pour composer `message.summary`.
   * Les deux libellés visés sont écrits sans apostrophe pour cette raison,
   * `MessageFormat` la doublant d'un côté et pas de l'autre.
   *
   * En cas d'écart, la page reprend simplement son apparence d'avant.
   */
  const lienExpire =
    message.summary === msgStr("expiredActionTokenNoSessionMessage") ||
    message.summary === msgStr("expiredActionTokenSessionExistsMessage");

  const nouvelleDemande = lienExpire ? url.loginResetCredentialsUrl : undefined;

  return (
    <Template
      kcContext={kcContext}
      i18n={i18n}
      doUseDefaultCss={doUseDefaultCss}
      classes={classes}
      displayMessage={false}
      headerNode={lienExpire ? msg("etapeExpiredLinkTitle") : msg("errorTitle")}
      subtitle={lienExpire ? undefined : msg("etapeErrorSubtitle")}
    >
      <div id="kc-error-message" className="flex flex-col gap-8">
        <Prose>
          <p dangerouslySetInnerHTML={{ __html: kcSanitize(message.summary) }} />
        </Prose>
        {(nouvelleDemande ?? retourApplication) !== undefined && (
          <div className="flex flex-col gap-4">
            {/*
             * Redemander un lien passe avant la connexion : qui arrive ici n'a
             * toujours pas de mot de passe utilisable.
             */}
            {nouvelleDemande !== undefined && (
              <Button asChild size="xl" className="w-full rounded-lg">
                <a id="resetPasswordLink" href={nouvelleDemande}>
                  {msg("etapeExpiredLinkRestart")}
                </a>
              </Button>
            )}
            {retourApplication !== undefined && (
              <Button
                asChild
                variant={nouvelleDemande !== undefined ? "outline" : "default"}
                size="xl"
                className="w-full rounded-lg"
              >
                <a id="backToApplication" href={retourApplication}>
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

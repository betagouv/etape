import { ExternalLink } from "lucide-react";

import franceConnectLogo from "../../assets/franceconnect-logo.svg";
import type { I18n } from "../i18n";

/**
 * Alias de l'identity provider FranceConnect dans le realm.
 *
 * Le thème ne lit pas la configuration de l'API : il reconnaît le fournisseur à
 * son alias pour lui appliquer le bouton officiel. Tout autre fournisseur (un
 * ProConnect ajouté plus tard, par exemple) retombe sur le bouton générique.
 */
const FRANCE_CONNECT_ALIAS = "franceconnect";

type Provider = {
  alias: string;
  displayName: string;
  loginUrl: string;
};

/**
 * Bouton FranceConnect, conforme au kit d'implémentation.
 *
 * Les dimensions, la couleur `#000091`, la police Marianne et le lien
 * « Qu'est-ce que FranceConnect ? » ne sont pas des choix de design : ils sont
 * vérifiés à l'homologation. Le lien est indissociable du bouton — les deux
 * vivent donc dans ce composant, et pas seulement côte à côte dans une page.
 *
 * @see https://gouvfr.atlassian.net/wiki/spaces/DB/pages/967868417/
 */
export function FranceConnectButton(props: { loginUrl: string; i18n: I18n }) {
  const { loginUrl, i18n } = props;
  const { msgStr } = i18n;

  return (
    <div className="flex flex-col items-start gap-3">
      <a
        id={`social-${FRANCE_CONNECT_ALIAS}`}
        href={loginUrl}
        className="bg-france-blue focus-visible:outline-france-blue flex items-center justify-center gap-3 px-3 py-1 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <img src={franceConnectLogo} alt="" aria-hidden className="h-12 w-10" />
        <span className="text-france-blue-text font-marianne flex flex-col items-center whitespace-nowrap">
          <span className="text-[17px] leading-[17px]">
            {msgStr("etapeFranceConnectSignInWith")}
          </span>
          <span className="text-[18px] leading-[18px] font-bold">FranceConnect</span>
        </span>
      </a>
      <a
        href="https://franceconnect.gouv.fr/"
        target="_blank"
        rel="noopener noreferrer"
        title={msgStr("etapeFranceConnectAboutTitle")}
        className="text-france-blue font-marianne inline-flex items-center gap-2 text-[14px] leading-6 underline underline-offset-4"
      >
        {msgStr("etapeFranceConnectAbout")}
        <ExternalLink aria-hidden className="size-4" />
      </a>
    </div>
  );
}

/** Bouton d'un fournisseur d'identité autre que FranceConnect. */
function GenericProviderButton(props: { provider: Provider }) {
  const { provider } = props;

  return (
    <a
      id={`social-${provider.alias}`}
      href={provider.loginUrl}
      className="border-border-strong hover:bg-accent text-label-lg flex min-h-11 items-center justify-center rounded-lg border px-4 py-3 font-semibold"
    >
      {provider.displayName}
    </a>
  );
}

/**
 * Bloc « fournisseurs d'identité », suivi du séparateur qui introduit le
 * formulaire email / mot de passe.
 *
 * Le séparateur reste affiché même sans fournisseur configuré : il porte le
 * libellé qui annonce le formulaire, et son absence laisserait la carte
 * démarrer sans transition.
 */
export function SocialProviders(props: {
  providers: Provider[] | undefined;
  separatorLabel: string;
  i18n: I18n;
}) {
  const { providers, separatorLabel, i18n } = props;

  const franceConnect = providers?.find((provider) => provider.alias === FRANCE_CONNECT_ALIAS);
  const others = providers?.filter((provider) => provider.alias !== FRANCE_CONNECT_ALIAS) ?? [];

  return (
    <>
      {(franceConnect !== undefined || others.length !== 0) && (
        <div id="kc-social-providers" className="flex flex-col items-start gap-4">
          {franceConnect !== undefined && (
            <FranceConnectButton loginUrl={franceConnect.loginUrl} i18n={i18n} />
          )}
          {others.map((provider) => (
            <GenericProviderButton key={provider.alias} provider={provider} />
          ))}
        </div>
      )}
      <Separator label={separatorLabel} />
    </>
  );
}

/** Trait horizontal coupé par un libellé centré. */
export function Separator(props: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span aria-hidden className="bg-divider h-px flex-1" />
      <span className="text-body-sm text-muted-foreground">{props.label}</span>
      <span aria-hidden className="bg-divider h-px flex-1" />
    </div>
  );
}

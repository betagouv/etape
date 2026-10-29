import type { TemplateProps } from "keycloakify/login/TemplateProps";
import { useInitialize } from "keycloakify/login/Template.useInitialize";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { useEffect, type ReactNode } from "react";

import { Alert, MESSAGE_TYPE } from "./components/alert";
import { Logo } from "./components/logo";
import { SupportFooter } from "./components/support-footer";
import type { I18n } from "./i18n";
import type { KcContext } from "./KcContext";

type Props = TemplateProps<KcContext, I18n> & {
  /** Phrase d'accroche sous le titre. Propre à ETAPE, donc absente des pages non dessinées. */
  subtitle?: ReactNode;
  accountSwitchNode?: ReactNode;
  backLinkNode?: ReactNode;
};

/**
 * Gabarit commun à tous les écrans de connexion : illustration à gauche,
 * contenu à droite.
 *
 * Il ne charge jamais la CSS de Keycloak — `doUseDefaultCss` est reçu pour
 * respecter le contrat de Keycloakify, et volontairement ignoré. Les écrans que
 * nous n'avons pas dessinés passent par `DefaultPage`, dont le balisage brut est
 * rattrapé par les règles `.kc-fallback` de `styles/theme.css`.
 */
export default function Template(props: Props) {
  const {
    displayInfo = false,
    displayMessage = true,
    headerNode,
    subtitle,
    accountSwitchNode = null,
    backLinkNode = null,
    socialProvidersNode = null,
    infoNode = null,
    documentTitle,
    kcContext,
    i18n,
    doUseDefaultCss,
    children,
  } = props;

  const { msg, msgStr, currentLanguage, enabledLanguages } = i18n;
  const { realm, auth, url, message, isAppInitiatedAction } = kcContext;

  const title = documentTitle ?? msgStr("loginTitle", realm.displayName || realm.name);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useSetClassName({ qualifiedName: "html", className: "h-full" });
  useSetClassName({ qualifiedName: "body", className: "h-full" });

  const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss });

  if (!isReadyToRender) {
    return null;
  }

  return (
    <div className="kc-split">
      {/*
       * Mêmes classes que le squelette d'`index.html`, pour que le passage de
       * l'un à l'autre ne déplace rien. L'illustration disparaît sous `lg` : sur
       * mobile elle mangerait la moitié de l'écran au moment précis où l'on
       * demande de saisir un mot de passe.
       */}
      <div className="kc-illustration" />

      <main className="kc-panel">
        <div className="mx-auto flex w-full max-w-[572px] flex-col justify-between gap-12 px-6 py-6 lg:px-0 lg:py-2">
          <div className="flex min-h-5 flex-wrap items-center justify-end gap-x-6 gap-y-2">
            {enabledLanguages.length > 1 && (
              <nav aria-label={msgStr("languages")} className="flex gap-3">
                {enabledLanguages.map(({ languageTag, label, href }) =>
                  languageTag === currentLanguage.languageTag ? (
                    <span
                      key={languageTag}
                      aria-current="true"
                      className="text-body-sm font-semibold"
                    >
                      {label}
                    </span>
                  ) : (
                    <a
                      key={languageTag}
                      href={href}
                      className="text-body-sm text-content-accent hover:underline"
                    >
                      {label}
                    </a>
                  ),
                )}
              </nav>
            )}
            {accountSwitchNode}
          </div>

          <div className="flex flex-col gap-6">
            {backLinkNode}
            <Logo />

            <header className="flex flex-col gap-3">
              {auth?.showUsername && !auth.showResetCredentials ? (
                /*
                 * Étape intermédiaire d'un parcours déjà engagé (double
                 * authentification, action requise…) : Keycloak affiche l'identité
                 * tentée et un lien pour repartir de zéro.
                 */
                <div id="kc-username" className="flex items-center gap-3">
                  <span className="text-body text-foreground font-semibold">
                    {auth.attemptedUsername}
                  </span>
                  <a
                    id="reset-login"
                    href={url.loginRestartFlowUrl}
                    aria-label={msgStr("restartLoginTooltip")}
                    className="text-body-sm text-content-accent hover:underline"
                  >
                    {msg("restartLoginTooltip")}
                  </a>
                </div>
              ) : (
                <h1 id="kc-page-title" className="font-heading text-heading-md text-foreground">
                  {headerNode}
                </h1>
              )}
              {subtitle !== undefined && (
                <p className="text-body text-content-secondary">{subtitle}</p>
              )}
            </header>

            {/*
             * Les avertissements d'une action déclenchée par l'application ne
             * concernent pas la personne qui se connecte : Keycloak demande de les
             * masquer dans ce cas.
             */}
            {displayMessage &&
              message !== undefined &&
              (message.type !== MESSAGE_TYPE.WARNING || !isAppInitiatedAction) && (
                <Alert type={message.type} summary={message.summary} />
              )}

            {socialProvidersNode}

            <div className="kc-fallback flex flex-col gap-8">{children}</div>

            {auth?.showTryAnotherWayLink && (
              <form id="kc-select-try-another-way-form" action={url.loginAction} method="post">
                <input type="hidden" name="tryAnotherWay" value="on" />
                <button
                  type="submit"
                  className="text-body-sm text-content-accent cursor-pointer font-semibold hover:underline"
                >
                  {msg("doTryAnotherWay")}
                </button>
              </form>
            )}

            {displayInfo && (
              <div id="kc-info" className="text-body-sm text-content-secondary text-center">
                {infoNode}
              </div>
            )}
          </div>

          <SupportFooter i18n={i18n} />
        </div>
      </main>
    </div>
  );
}

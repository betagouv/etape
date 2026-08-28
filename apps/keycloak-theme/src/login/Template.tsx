import type { TemplateProps } from "keycloakify/login/TemplateProps";
import { useInitialize } from "keycloakify/login/Template.useInitialize";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { useEffect, type ReactNode } from "react";

import { Alert } from "./components/alert";
import type { I18n } from "./i18n";
import type { KcContext } from "./KcContext";

type Props = TemplateProps<KcContext, I18n> & {
  /** Phrase d'accroche sous le titre. Propre à ETAPE, donc absente des pages non dessinées. */
  subtitle?: ReactNode;
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

  useEffect(() => {
    document.title = documentTitle ?? msgStr("loginTitle", realm.displayName || realm.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <main className="kc-panel flex flex-col items-center justify-center px-6 py-12 lg:p-16">
        <div className="flex w-full max-w-[600px] flex-col gap-8">
          {enabledLanguages.length > 1 && (
            <nav aria-label={msgStr("languages")} className="flex justify-end gap-3">
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
              <h1 id="kc-page-title" className="text-h1 text-foreground font-bold">
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
            (message.type !== "warning" || !isAppInitiatedAction) && (
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
      </main>
    </div>
  );
}

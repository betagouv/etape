import type { ClassKey } from "keycloakify/login";
import DefaultPage from "keycloakify/login/DefaultPage";
import { lazy, Suspense } from "react";

import { useI18n } from "./i18n";
import type { KcContext } from "./KcContext";
import Template from "./Template";

const UserProfileFormFields = lazy(() => import("keycloakify/login/UserProfileFormFields"));

/**
 * Faire ressaisir le mot de passe à l'inscription. Keycloak ne l'impose pas ;
 * les maquettes le prévoient, et une faute de frappe sur un mot de passe de
 * douze caractères se paie par un parcours de réinitialisation.
 */
const doMakeUserConfirmPassword = true;

const Error = lazy(() => import("./pages/Error"));
const Info = lazy(() => import("./pages/Info"));
const Login = lazy(() => import("./pages/Login"));
const LoginIdpLinkConfirm = lazy(() => import("./pages/LoginIdpLinkConfirm"));
const LoginIdpLinkEmail = lazy(() => import("./pages/LoginIdpLinkEmail"));
const LoginPageExpired = lazy(() => import("./pages/LoginPageExpired"));
const LoginResetPassword = lazy(() => import("./pages/LoginResetPassword"));
const LoginUpdatePassword = lazy(() => import("./pages/LoginUpdatePassword"));
const LoginVerifyEmail = lazy(() => import("./pages/LoginVerifyEmail"));
const LogoutConfirm = lazy(() => import("./pages/LogoutConfirm"));
const Register = lazy(() => import("./pages/Register"));

/**
 * Aiguillage des écrans.
 *
 * Les pages listées ici sont dessinées d'après les maquettes. Toutes les autres
 * — double authentification, WebAuthn, consentement… — tombent sur
 * `DefaultPage`, qui reçoit malgré tout notre gabarit : le cadre reste celui
 * d'ETAPE, seul l'intérieur du formulaire garde le balisage de Keycloakify.
 */
export default function KcPage(props: { kcContext: KcContext }) {
  const { kcContext } = props;

  const { i18n } = useI18n({ kcContext });

  const common = {
    i18n,
    classes,
    Template,
    doUseDefaultCss: false,
  } as const;

  return (
    <Suspense>
      {(() => {
        switch (kcContext.pageId) {
          case "login.ftl":
            return <Login {...common} kcContext={kcContext} />;
          case "register.ftl":
            return (
              <Register
                {...common}
                kcContext={kcContext}
                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
              />
            );
          case "login-reset-password.ftl":
            return <LoginResetPassword {...common} kcContext={kcContext} />;
          case "login-update-password.ftl":
            return <LoginUpdatePassword {...common} kcContext={kcContext} />;
          case "login-verify-email.ftl":
            return <LoginVerifyEmail {...common} kcContext={kcContext} />;
          case "login-page-expired.ftl":
            return <LoginPageExpired {...common} kcContext={kcContext} />;
          case "login-idp-link-confirm.ftl":
            return <LoginIdpLinkConfirm {...common} kcContext={kcContext} />;
          case "login-idp-link-email.ftl":
            return <LoginIdpLinkEmail {...common} kcContext={kcContext} />;
          case "logout-confirm.ftl":
            return <LogoutConfirm {...common} kcContext={kcContext} />;
          case "info.ftl":
            return <Info {...common} kcContext={kcContext} />;
          case "error.ftl":
            return <Error {...common} kcContext={kcContext} />;
          default:
            return (
              <DefaultPage
                {...common}
                kcContext={kcContext}
                UserProfileFormFields={UserProfileFormFields}
                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
              />
            );
        }
      })()}
    </Suspense>
  );
}

const classes = {} satisfies { [key in ClassKey]?: string };

import { i18nBuilder } from "keycloakify/login";

import type { ThemeName } from "../kc.gen";

/*
 * Traductions propres à ETAPE.
 *
 * Tout ce qui existe déjà dans le jeu de messages de Keycloak (`doLogIn`,
 * `password`, `doForgotPassword`…) est réutilisé tel quel : ces libellés sont
 * traduits, testés et cohérents avec les emails que Keycloak envoie. Ne sont
 * repris ici que les textes ajoutés par les maquettes, et le petit nombre de
 * messages de Keycloak dont la formulation ne convient pas à ce produit.
 *
 * Ces derniers ne sont pas qu'affaire de rendu : Keycloakify les recopie dans
 * le paquet de messages du thème, dont le serveur se sert pour composer
 * `message.summary`. Les redéfinir change donc aussi ce que Keycloak écrit.
 */
// `ofTypeI18n` n'existe que pour en dériver un type — c'est l'idiome de
// Keycloakify, qui n'a pas d'équivalent purement statique.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { useI18n, ofTypeI18n } = i18nBuilder
  .withThemeName<ThemeName>()
  .withCustomTranslations({
    fr: {
      /*
       * Trois libellés de Keycloak repris pour coller aux maquettes : « Courriel »
       * → « Adresse email », « Se souvenir de moi » → « Rester connecté », et
       * « Connexion » → « Se connecter » pour que le bouton porte un verbe là où
       * l'onglet porte un nom.
       */
      email: "Adresse email",
      rememberMe: "Rester connecté",
      doLogIn: "Se connecter",
      doRegister: "Créer mon compte",
      emailVerifyTitle: "Confirmez votre adresse email",

      /*
       * Messages que Keycloak rend lui-même, repris pour ce produit.
       *
       * Keycloakify les recopie dans le paquet de messages du thème, côté
       * serveur : ces traductions valent donc aussi pour ce que Keycloak place
       * dans `message.summary`, et pas seulement pour ce que rend React.
       *
       * `backToApplication` porte un « &laquo; » dans le jeu d'origine, hérité
       * d'un lien ; dans un bouton, ce chevron n'a plus de sens.
       */
      missingUsernameMessage: "Veuillez renseigner votre adresse email.",
      invalidEmailMessage: "Adresse email invalide : il y manque un « @ ».",
      missingEmailMessage: "Veuillez renseigner votre adresse email.",
      /*
       * `registrationEmailAsUsername` fait de l'adresse l'identifiant : Keycloak
       * peut signaler le doublon sous l'un ou l'autre nom selon le chemin, et
       * « nom d'utilisateur » ne désigne rien à l'écran.
       */
      emailExistsMessage: "Un compte existe déjà avec cette adresse email.",
      usernameExistsMessage: "Un compte existe déjà avec cette adresse email.",
      backToApplication: "Se connecter à ETAPE",
      /*
       * Volontairement muet sur l'existence du compte : Keycloak affiche le même
       * message dans les deux cas, et le contredire ici ferait de cet écran un
       * moyen de savoir qui est inscrit.
       */
      emailSentMessage:
        "Si un compte existe pour cette adresse, un lien de réinitialisation vient de partir. Pensez à regarder vos indésirables.",
      /*
       * Les deux formulations que Keycloak choisit selon qu'une session est
       * ouverte ou non. Elles disent la même chose à qui les lit — le lien est
       * mort — et `Error.tsx` s'en sert pour reconnaître ce cas.
       *
       * Sans apostrophe, délibérément : elles sont comparées à la chaîne rendue
       * par le serveur, et l'échappement `MessageFormat` d'une apostrophe est un
       * écart de trop.
       */
      expiredActionTokenNoSessionMessage:
        "Ce lien de réinitialisation a expiré. Un lien reste valable 15 minutes et ne peut servir que pour une seule demande.",
      expiredActionTokenSessionExistsMessage:
        "Ce lien de réinitialisation a expiré. Un lien reste valable 15 minutes et ne peut servir que pour une seule demande.",

      etapeLoginTitle: "Une nouvelle étape pour votre avenir.",
      etapeLoginSubtitle: "Connectez-vous pour continuer votre démarche de transition.",
      etapeRegisterTitle: "Créer votre compte personnel",
      etapeRegisterSubtitle:
        "Suivez en temps réel l'avancement de votre projet de transition professionnelle.",
      etapeNoAccount: "Pas encore de compte ?",
      etapeRegisterTerms:
        "En créant votre compte, vous acceptez les conditions générales d'utilisation.",
      etapeCreateAccount: "Créer un compte usager",
      etapeAlreadyAccount: "Déjà un compte ?",
      etapeOrCredentials: "ou renseignez vos identifiants",
      etapeOrRegisterEmail: "ou inscrivez-vous par email",

      // Libellés du bouton FranceConnect. Imposés au mot près par le kit
      // d'implémentation : ne pas reformuler.
      etapeFranceConnectSignInWith: "S'identifier avec",
      etapeFranceConnectAbout: "Qu'est-ce que FranceConnect ?",
      etapeFranceConnectAboutTitle: "Qu'est-ce que FranceConnect ? — nouvelle fenêtre",

      etapeResetPasswordTitle: "Mot de passe oublié ?",
      etapeResetPasswordSubtitle:
        "Renseignez votre adresse email : nous vous envoyons un lien pour en choisir un nouveau.",
      etapeResetPasswordCta: "Envoyer le lien",
      etapeUpdatePasswordSubtitle: "Choisissez un mot de passe d'au moins 12 caractères.",
      etapeUpdatePasswordCta: "Enregistrer le mot de passe",
      etapeVerifyEmailSubtitle: "Plus qu'une étape avant d'accéder à votre espace.",
      etapePageExpiredSubtitle: "Votre session de connexion a expiré.",
      etapePageExpiredRestart: "Recommencer la connexion",
      etapePageExpiredContinue: "Poursuivre là où j'en étais",
      etapeErrorSubtitle: "L'opération n'a pas pu aboutir.",
      etapeExpiredLinkTitle: "Lien expiré",
      etapeExpiredLinkRestart: "Demander un nouveau lien",

      /*
       * Les cinq règles reprennent la politique du realm, terme pour terme.
       * Les modifier ici sans toucher `passwordPolicy` annoncerait des règles
       * que le serveur n'applique pas — ou l'inverse.
       */
      etapePasswordRulesTitle: "Votre mot de passe doit contenir :",
      etapePasswordRuleLength: "au moins 12 caractères",
      etapePasswordRuleUpper: "une lettre majuscule",
      etapePasswordRuleLower: "une lettre minuscule",
      etapePasswordRuleDigit: "un chiffre",
      etapePasswordRuleSpecial: "un caractère spécial",
      // Lus par les lecteurs d'écran seulement : la couleur ne dit rien à qui
      // ne la perçoit pas.
      etapePasswordRuleMet: "(satisfait)",
      etapePasswordRuleUnmet: "(non satisfait)",

      etapeIllustrationAlt: "",
    },
    en: {
      email: "Email address",
      rememberMe: "Stay signed in",
      doLogIn: "Sign in",
      doRegister: "Create my account",
      emailVerifyTitle: "Confirm your email address",

      missingUsernameMessage: "Please enter your email address.",
      invalidEmailMessage: "Invalid email address: an « @ » is missing.",
      missingEmailMessage: "Please enter your email address.",
      emailExistsMessage: "An account already exists with this email address.",
      usernameExistsMessage: "An account already exists with this email address.",
      backToApplication: "Sign in to ETAPE",
      emailSentMessage:
        "If an account exists for this address, a reset link has just been sent. Remember to check your spam folder.",
      expiredActionTokenNoSessionMessage:
        "This reset link has expired. A link stays valid for 15 minutes and can only be used once.",
      expiredActionTokenSessionExistsMessage:
        "This reset link has expired. A link stays valid for 15 minutes and can only be used once.",

      etapeLoginTitle: "A new step towards your future.",
      etapeLoginSubtitle: "Sign in to continue your career transition.",
      etapeRegisterTitle: "Create your personal account",
      etapeRegisterSubtitle: "Follow your career transition project in real time.",
      etapeNoAccount: "No account yet?",
      etapeRegisterTerms: "By creating your account, you accept the terms of use.",
      etapeCreateAccount: "Create an account",
      etapeAlreadyAccount: "Already have an account?",
      etapeOrCredentials: "or enter your credentials",
      etapeOrRegisterEmail: "or sign up by email",

      etapeFranceConnectSignInWith: "S'identifier avec",
      etapeFranceConnectAbout: "Qu'est-ce que FranceConnect ?",
      etapeFranceConnectAboutTitle: "Qu'est-ce que FranceConnect ? — new window",

      etapeResetPasswordTitle: "Forgot your password?",
      etapeResetPasswordSubtitle:
        "Enter your email address and we will send you a link to choose a new one.",
      etapeResetPasswordCta: "Send the link",
      etapeUpdatePasswordSubtitle: "Choose a password of at least 12 characters.",
      etapeUpdatePasswordCta: "Save the password",
      etapeVerifyEmailSubtitle: "One last step before accessing your account.",
      etapePageExpiredSubtitle: "Your sign-in session has expired.",
      etapePageExpiredRestart: "Start over",
      etapePageExpiredContinue: "Continue where I left off",
      etapeErrorSubtitle: "The operation could not be completed.",
      etapeExpiredLinkTitle: "Link expired",
      etapeExpiredLinkRestart: "Request a new link",

      etapePasswordRulesTitle: "Your password must contain:",
      etapePasswordRuleLength: "at least 12 characters",
      etapePasswordRuleUpper: "an uppercase letter",
      etapePasswordRuleLower: "a lowercase letter",
      etapePasswordRuleDigit: "a digit",
      etapePasswordRuleSpecial: "a special character",
      etapePasswordRuleMet: "(met)",
      etapePasswordRuleUnmet: "(not met)",

      etapeIllustrationAlt: "",
    },
  })
  .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };

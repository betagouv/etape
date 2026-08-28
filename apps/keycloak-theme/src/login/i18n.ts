import { i18nBuilder } from "keycloakify/login";

import type { ThemeName } from "../kc.gen";

/*
 * Traductions propres à ETAPE.
 *
 * Tout ce qui existe déjà dans le jeu de messages de Keycloak (`doLogIn`,
 * `password`, `doForgotPassword`…) est réutilisé tel quel : ces libellés sont
 * traduits, testés et cohérents avec les emails que Keycloak envoie. Seuls les
 * textes que les maquettes ajoutent sont définis ici.
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

      etapeLoginTitle: "Une nouvelle étape pour votre avenir.",
      etapeLoginSubtitle: "Connectez-vous pour continuer votre démarche de transition.",
      etapeRegisterTitle: "Créer votre compte personnel",
      etapeRegisterSubtitle:
        "Suivez en temps réel l'avancement de votre projet de transition professionnelle.",
      etapeNoAccount: "Pas encore de compte ?",
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

      etapePasswordStrength: "Force du mot de passe",
      etapePasswordStrengthWeak: "faible",
      etapePasswordStrengthMedium: "moyen",
      etapePasswordStrengthStrong: "solide",

      etapeIllustrationAlt: "",
    },
    en: {
      email: "Email address",
      rememberMe: "Stay signed in",
      doLogIn: "Sign in",
      doRegister: "Create my account",
      emailVerifyTitle: "Confirm your email address",

      etapeLoginTitle: "A new step towards your future.",
      etapeLoginSubtitle: "Sign in to continue your career transition.",
      etapeRegisterTitle: "Create your personal account",
      etapeRegisterSubtitle: "Follow your career transition project in real time.",
      etapeNoAccount: "No account yet?",
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

      etapePasswordStrength: "Password strength",
      etapePasswordStrengthWeak: "weak",
      etapePasswordStrengthMedium: "medium",
      etapePasswordStrengthStrong: "strong",

      etapeIllustrationAlt: "",
    },
  })
  .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };

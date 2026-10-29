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
       * → « Adresse e-mail », « Se souvenir de moi » → « Rester connecté », et
       * « Connexion » → « Se connecter » pour que le bouton porte un verbe là où
       * l'onglet porte un nom.
       */
      email: "Adresse e-mail",
      rememberMe: "Rester connecté",
      doLogIn: "Se connecter",
      doForgotPassword: "Mot de passe oublié",
      showPassword: "Afficher le mot de passe",
      hidePassword: "Masquer le mot de passe",
      invalidUserMessage: "Adresse e-mail ou mot de passe incorrect",
      emailVerifiedMessage: "Votre espace est activé. Vous pouvez vous connecter.",
      doRegister: "Créer mon compte",
      emailVerifyTitle: "Confirmez votre adresse e-mail",

      missingUsernameMessage: "Veuillez renseigner votre adresse e-mail.",
      invalidEmailMessage: "Adresse e-mail invalide : il y manque un « @ ».",
      missingEmailMessage: "Veuillez renseigner votre adresse e-mail.",
      emailExistsMessage: "Un compte existe déjà avec cette adresse e-mail.",
      usernameExistsMessage: "Un compte existe déjà avec cette adresse e-mail.",
      backToApplication: "Se connecter à ETAPE",
      emailSentMessage:
        "Si un compte existe pour cette adresse, un lien de réinitialisation vient de partir. Pensez à regarder vos indésirables.",
      expiredActionTokenNoSessionMessage:
        "Ce lien de réinitialisation a expiré. Un lien reste valable 15 minutes et ne peut servir que pour une seule demande.",
      expiredActionTokenSessionExistsMessage:
        "Ce lien de réinitialisation a expiré. Un lien reste valable 15 minutes et ne peut servir que pour une seule demande.",
      expiredActionMessage:
        "Ce lien a expiré ou a déjà été utilisé. Un lien reste valable 15 minutes et ne peut servir que pour une seule demande.",

      etapeLoginTitle: "Se connecter à votre espace personnel",
      etapeEmailFormatInvalid: "Adresse e-mail incorrecte",
      etapeSupportHelp: "Besoin d'aide ? Écrivez au support :",
      etapeRegisterTitle: "Créer votre compte personnel",
      etapeRegisterSubtitle:
        "Suivez en temps réel l'avancement de votre projet de transition professionnelle.",
      etapeNoAccount: "Vous n'avez pas encore d'espace ?",
      etapeRegisterTerms:
        "En créant votre compte, vous acceptez les conditions générales d'utilisation.",
      etapeCreateAccount: "Créer mon espace",
      etapeAlreadyAccount: "Déjà un compte ?",
      etapeOrCredentials: "OU",
      etapeOrRegisterEmail: "ou inscrivez-vous par e-mail",

      // Libellés du bouton FranceConnect. Imposés au mot près par le kit
      // d'implémentation : ne pas reformuler.
      etapeFranceConnectSignInWith: "S'identifier avec",
      etapeFranceConnectAbout: "Qu'est-ce que FranceConnect ?",
      etapeFranceConnectAboutTitle: "Qu'est-ce que FranceConnect ? — nouvelle fenêtre",

      etapeBackToLogin: "Retour à la connexion",
      etapeResetPasswordTitle: "Réinitialiser votre mot de passe",
      etapeResetPasswordSubtitle:
        "Saisissez l'adresse e-mail de votre espace. Vous recevrez un lien pour choisir un nouveau mot de passe.",
      etapeResetPasswordFranceConnectHint:
        "Vous vous connectez avec FranceConnect ? Votre mot de passe est géré par votre compte FranceConnect (impots.gouv, ameli…), pas par ETAPE.",
      etapeResetPasswordCta: "Recevoir le lien",

      etapeResetEmailSentTitle: "Consultez votre boîte e-mail",
      etapeResetEmailSentBody:
        "Si un espace est associé à l'adresse saisie, vous allez recevoir un e-mail avec un lien de réinitialisation.",
      etapeResetLinkLifespan: "Ce lien est valable {0} min.",
      etapeEmailNotReceivedTitle: "Vous ne trouvez pas l'e-mail ?",
      etapeEmailNotReceivedHint:
        "Vérifiez vos courriers indésirables. S'il n'y est pas, demandez un nouvel envoi.",
      etapeResendEmail: "Renvoyer l'e-mail",
      etapeResendAvailableIn: "Nouvel envoi possible dans",
      etapeResendAvailable: "Vous pouvez demander un nouvel envoi.",
      etapeResendDone:
        "Si un espace est associé à l'adresse saisie, un nouvel e-mail vient d'être envoyé.",
      etapeWrongEmail: "Ce n'est pas la bonne adresse ?",
      etapeEditEmail: "Modifier l'adresse e-mail",
      etapeNoEmailAccess: "Vous n'avez plus accès à cette adresse ?",
      etapeContactSupport: "Contactez le support",

      etapeAltchaRequired:
        "Le contrôle de sécurité est obligatoire : cochez « Je ne suis pas un robot ».",
      etapeAltchaFailed:
        "La vérification de sécurité a échoué. Cochez à nouveau la case pour réessayer.",
      etapeAltchaPending:
        "La vérification de sécurité est en cours : patientez avant d'envoyer le formulaire.",
      etapeAltchaUnavailable:
        "Le contrôle de sécurité est momentanément indisponible. Réessayez dans quelques minutes.",
      etapeAltchaVerifying: "Vérification de sécurité en cours…",
      etapeAltchaVerified: "Vérification de sécurité réussie.",

      etapeUpdatePasswordTitle: "Choisir un nouveau mot de passe",
      etapeUpdatePasswordAccount: "Adresse concernée :",
      etapeUpdatePasswordCta: "Enregistrer le mot de passe",
      etapeAccountNotActivated: "Votre espace n'est pas encore activé.",
      etapeAccountNotActivatedHint: "Consultez l'e-mail envoyé à {0}.",
      etapeResendActivationEmail: "Renvoyer l'e-mail d'activation",
      etapePageExpiredSubtitle: "Votre session de connexion a expiré.",
      etapePageExpiredRestart: "Recommencer la connexion",
      etapePageExpiredContinue: "Poursuivre là où j'en étais",
      etapeErrorSubtitle: "L'opération n'a pas pu aboutir.",
      etapeExpiredLinkTitle: "Lien expiré",
      etapeExpiredLinkRestart: "Demander un nouveau lien",

      etapePasswordRulesTitle: "Il doit contenir au moins :",
      etapePasswordRuleLength: "12 caractères",
      etapePasswordRuleUpper: "Une majuscule (A-Z)",
      etapePasswordRuleLower: "Une minuscule (a-z)",
      etapePasswordRuleDigit: "Un chiffre (1-9)",
      etapePasswordRuleSpecial: "Un caractère spécial (!@#%^&*)",
      etapePasswordRuleMet: "(satisfait)",
      etapePasswordRuleUnmet: "(non satisfait)",

      etapeIllustrationAlt: "",
    },
    en: {
      email: "Email address",
      rememberMe: "Stay signed in",
      doLogIn: "Sign in",
      doForgotPassword: "Forgot password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      invalidUserMessage: "Incorrect email address or password",
      emailVerifiedMessage: "Your space is activated. You can now sign in.",
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
      expiredActionMessage:
        "This link has expired or has already been used. A link stays valid for 15 minutes and can only be used once.",

      etapeLoginTitle: "Sign in to your personal space",
      etapeEmailFormatInvalid: "Incorrect email address",
      etapeSupportHelp: "Need help? Email support:",
      etapeRegisterTitle: "Create your personal account",
      etapeRegisterSubtitle: "Follow your career transition project in real time.",
      etapeNoAccount: "Don't have a space yet?",
      etapeRegisterTerms: "By creating your account, you accept the terms of use.",
      etapeCreateAccount: "Create my space",
      etapeAlreadyAccount: "Already have an account?",
      etapeOrCredentials: "OR",
      etapeOrRegisterEmail: "or sign up by email",

      etapeFranceConnectSignInWith: "S'identifier avec",
      etapeFranceConnectAbout: "Qu'est-ce que FranceConnect ?",
      etapeFranceConnectAboutTitle: "Qu'est-ce que FranceConnect ? — new window",

      etapeBackToLogin: "Back to sign in",
      etapeResetPasswordTitle: "Reset your password",
      etapeResetPasswordSubtitle:
        "Enter the email address of your space. You will receive a link to choose a new password.",
      etapeResetPasswordFranceConnectHint:
        "Do you sign in with FranceConnect? Your password is managed by your FranceConnect account (impots.gouv, ameli…), not by ETAPE.",
      etapeResetPasswordCta: "Get the link",

      etapeResetEmailSentTitle: "Check your inbox",
      etapeResetEmailSentBody:
        "If a space is linked to the address you entered, you will receive an email with a reset link.",
      etapeResetLinkLifespan: "This link is valid for {0} min.",
      etapeEmailNotReceivedTitle: "Can't find the email?",
      etapeEmailNotReceivedHint: "Check your spam folder. If it isn't there, ask for a new one.",
      etapeResendEmail: "Resend the email",
      etapeResendAvailableIn: "New email possible in",
      etapeResendAvailable: "You can now ask for a new email.",
      etapeResendDone:
        "If a space is linked to the address you entered, a new email has just been sent.",
      etapeWrongEmail: "Wrong address?",
      etapeEditEmail: "Change the email address",
      etapeNoEmailAccess: "No longer have access to this address?",
      etapeContactSupport: "Contact support",

      etapeAltchaRequired: 'The security check is required: tick the "I am not a robot" box.',
      etapeAltchaFailed: "The security check failed. Tick the box again to retry.",
      etapeAltchaPending: "The security check is in progress: wait before submitting the form.",
      etapeAltchaUnavailable:
        "The security check is temporarily unavailable. Try again in a few minutes.",
      etapeAltchaVerifying: "Security check in progress…",
      etapeAltchaVerified: "Security check passed.",

      etapeUpdatePasswordTitle: "Choose a new password",
      etapeUpdatePasswordAccount: "Account:",
      etapeUpdatePasswordCta: "Save the password",
      etapeAccountNotActivated: "Your space is not activated yet.",
      etapeAccountNotActivatedHint: "Check the email sent to {0}.",
      etapeResendActivationEmail: "Resend the activation email",
      etapePageExpiredSubtitle: "Your sign-in session has expired.",
      etapePageExpiredRestart: "Start over",
      etapePageExpiredContinue: "Continue where I left off",
      etapeErrorSubtitle: "The operation could not be completed.",
      etapeExpiredLinkTitle: "Link expired",
      etapeExpiredLinkRestart: "Request a new link",

      etapePasswordRulesTitle: "It must contain at least:",
      etapePasswordRuleLength: "12 characters",
      etapePasswordRuleUpper: "One uppercase letter (A-Z)",
      etapePasswordRuleLower: "One lowercase letter (a-z)",
      etapePasswordRuleDigit: "One digit (1-9)",
      etapePasswordRuleSpecial: "One special character (!@#%^&*)",
      etapePasswordRuleMet: "(met)",
      etapePasswordRuleUnmet: "(not met)",

      etapeIllustrationAlt: "",
    },
  })
  .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };

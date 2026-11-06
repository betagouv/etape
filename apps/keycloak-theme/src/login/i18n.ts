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
       * Deux libellés de Keycloak repris pour coller aux maquettes : « Courriel »
       * → « Adresse e-mail », et « Connexion » → « Se connecter » pour que le
       * bouton porte un verbe là où l'onglet porte un nom.
       */
      email: "Adresse e-mail",
      doLogIn: "Se connecter",
      doForgotPassword: "Mot de passe oublié",
      showPassword: "Afficher le mot de passe",
      hidePassword: "Masquer le mot de passe",
      invalidUserMessage: "Adresse e-mail ou mot de passe incorrect",
      emailVerifiedMessage: "Votre espace est activé. Vous pouvez vous connecter.",
      doRegister: "Créer mon espace",
      emailVerifyTitle: "Confirmez votre adresse e-mail",

      missingUsernameMessage: "Veuillez renseigner votre adresse e-mail.",
      invalidEmailMessage: "Adresse e-mail incorrecte",
      missingEmailMessage: "Veuillez renseigner votre adresse e-mail.",
      emailExistsMessage: "Un espace existe déjà avec cette adresse e-mail.",
      usernameExistsMessage: "Un espace existe déjà avec cette adresse e-mail.",
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
      etapeLoginIncomplete: "Renseignez tous les champs pour vous connecter.",
      etapeSupportHelp: "Besoin d'aide ? Écrivez au support :",
      etapeRegisterTitle: "Créer votre espace personnel",
      etapeRegisterStep: "Étape {0} sur {1}",
      etapeRegisterStepOneAnnouncement: "Étape 1 sur 2 : vos informations",
      etapeRegisterStepTwoAnnouncement: "Étape 2 sur 2 : identifiants de connexion",
      etapeRegisterInformations: "Vos informations",
      etapeRegisterResidence: "Votre lieu de résidence principale",
      etapeRegisterCredentials: "Identifiants de connexion",
      etapeRegisterContinue: "Continuer",
      etapeRegisterIncomplete: "Complétez ou corrigez vos informations pour continuer.",
      etapeRegisterBackToStepOne: "Retour à l'étape 1",
      etapeRegisterEmailHint:
        "Ce sera votre identifiant. Choisissez une adresse personnelle, que vous garderez même si vous quittez votre emploi : elle ne pourra plus être modifiée depuis votre espace.",
      etapeRegisterActivationHint: "Vous recevrez un e-mail pour activer votre espace.",
      etapeRegisterCepNote:
        "Vous êtes conseiller ou conseillère en évolution professionnelle ? Inutile de créer un espace : vous accédez au dossier par le lien qui vous a été transmis par le bénéficiaire.",
      etapeTermsAccept: "J'accepte les",
      etapeTermsCgu: "conditions générales d'utilisation",
      etapeTermsAnd: "et les",
      etapeTermsCgi: "conditions générales d'intervention",
      etapeTermsPrivacyNotice:
        "ETAPE Nouvelle-Aquitaine traite vos données dans le cadre de ses missions d'intérêt public, pour instruire et suivre votre dossier. Pour en savoir plus et exercer vos droits, consultez notre",
      etapeTermsPrivacyLink: "politique de confidentialité",
      etapeAdresseLabel: "Adresse",
      etapeAdresseHint:
        "Elle détermine la Transitions Pro qui traitera votre dossier. Commencez à saisir votre adresse, puis choisissez-la dans la liste.",
      etapeAdresseClear: "Effacer l'adresse",
      etapeAdresseResultsOne: "1 adresse trouvée",
      etapeAdresseResultsMany: "{0} adresses trouvées",
      etapeAdresseEmptyTitle: "Aucune adresse ne correspond à cette recherche",
      etapeAdresseEmptyHint: "Vérifiez l'orthographe ou ajoutez le code postal ou la commune.",
      etapeAdresseUnavailableTitle: "La recherche d'adresse ne répond pas pour le moment",
      etapeAdresseUnavailableHint:
        "Vous pouvez saisir vous-même votre adresse. Elle sera vérifiée de la même façon pour confirmer votre région.",
      etapeAdresseManual: "Saisir mon adresse moi-même",
      etapeAdresseRetry: "Relancer la recherche",
      etapeAdresseManualLoading: "Chargement du formulaire…",
      etapeAdresseManualLoadFailed: "Le formulaire de saisie n'a pas pu se charger.",
      etapeAdresseHorsRegionTitle:
        "Cette adresse n'est pas située dans une région présente sur ce portail",
      etapeAdresseHorsRegionHint:
        "Votre dossier relève de Transitions Pro {0} : faites votre demande sur son site.",
      etapeAdresseHorsRegionLink: "Accéder au site de Transitions Pro {0}",
      etapeAdresseHorsRegionUnknownHint:
        "Votre dossier relève d'une autre Transitions Pro : retrouvez-la dans la liste nationale.",
      etapeAdresseHorsRegionUnknownLink: "Voir les Transitions Pro en région",
      etapeAdresseNumeroVoie: "Numéro de voie",
      etapeAdresseTypeVoie: "Type de voie",
      etapeAdresseNomVoie: "Nom de la voie",
      etapeAdresseComplement: "Complément d'adresse",
      etapeAdresseCodePostal: "Code postal",
      etapeAdresseCodePostalUnknown: "Aucune commune ne correspond à ce code postal.",
      etapeAdresseCommune: "Commune",
      etapeAdresseCommunesUnavailable: "La liste des communes ne répond pas pour le moment",
      etapeNoAccount: "Vous n'avez pas encore d'espace ?",
      etapeCreateAccount: "Créer mon espace",
      etapeAlreadyAccount: "Vous avez déjà un espace ?",
      etapeOrCredentials: "OU",

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
      etapeVerifyEmailSubtitle: "Plus qu'une étape avant d'accéder à votre espace.",
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
      etapePasswordRuleDigit: "Un chiffre (0-9)",
      etapePasswordRuleSpecial: "Un caractère spécial (!@#%^&*)",
      etapePasswordRuleMet: "(satisfait)",
      etapePasswordRuleUnmet: "(non satisfait)",

      etapeIllustrationAlt: "",
    },
    en: {
      email: "Email address",
      doLogIn: "Sign in",
      doForgotPassword: "Forgot password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      invalidUserMessage: "Incorrect email address or password",
      emailVerifiedMessage: "Your space is activated. You can now sign in.",
      doRegister: "Create my space",
      emailVerifyTitle: "Confirm your email address",

      missingUsernameMessage: "Please enter your email address.",
      invalidEmailMessage: "Incorrect email address",
      missingEmailMessage: "Please enter your email address.",
      emailExistsMessage: "A space already exists with this email address.",
      usernameExistsMessage: "A space already exists with this email address.",
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
      etapeLoginIncomplete: "Fill in all the fields to sign in.",
      etapeSupportHelp: "Need help? Email support:",
      etapeRegisterTitle: "Create your personal space",
      etapeRegisterStep: "Step {0} of {1}",
      etapeRegisterStepOneAnnouncement: "Step 1 of 2: your details",
      etapeRegisterStepTwoAnnouncement: "Step 2 of 2: sign-in details",
      etapeRegisterInformations: "Your details",
      etapeRegisterResidence: "Your main place of residence",
      etapeRegisterCredentials: "Sign-in details",
      etapeRegisterContinue: "Continue",
      etapeRegisterIncomplete: "Complete or correct your details to continue.",
      etapeRegisterBackToStepOne: "Back to step 1",
      etapeRegisterEmailHint:
        "This will be your username. Choose a personal address that you will keep even if you leave your job: it cannot be changed from your space afterwards.",
      etapeRegisterActivationHint: "You will receive an email to activate your space.",
      etapeRegisterCepNote:
        "Are you a career development adviser? No need to create a space: you access the file through the link the beneficiary sent you.",
      etapeTermsAccept: "I accept the",
      etapeTermsCgu: "terms of use",
      etapeTermsAnd: "and the",
      etapeTermsCgi: "terms of service",
      etapeTermsPrivacyNotice:
        "ETAPE Nouvelle-Aquitaine processes your data as part of its public-interest missions, to review and follow your file. To learn more and exercise your rights, see our",
      etapeTermsPrivacyLink: "privacy policy",
      etapeAdresseLabel: "Address",
      etapeAdresseHint:
        "It determines which Transitions Pro will handle your file. Start typing your address, then choose it from the list.",
      etapeAdresseClear: "Clear the address",
      etapeAdresseResultsOne: "1 address found",
      etapeAdresseResultsMany: "{0} addresses found",
      etapeAdresseEmptyTitle: "No address matches this search",
      etapeAdresseEmptyHint: "Check the spelling or add the postcode or town.",
      etapeAdresseUnavailableTitle: "The address search is not responding right now",
      etapeAdresseUnavailableHint:
        "You can enter your address yourself. It will be checked the same way to confirm your region.",
      etapeAdresseManual: "Enter my address myself",
      etapeAdresseRetry: "Retry the search",
      etapeAdresseManualLoading: "Loading the form…",
      etapeAdresseManualLoadFailed: "The entry form could not be loaded.",
      etapeAdresseHorsRegionTitle: "This address is not in a region covered by this portal",
      etapeAdresseHorsRegionHint:
        "Your file falls under Transitions Pro {0}: please apply on its website.",
      etapeAdresseHorsRegionLink: "Go to the Transitions Pro {0} website",
      etapeAdresseHorsRegionUnknownHint:
        "Your file falls under another Transitions Pro: find it in the national list.",
      etapeAdresseHorsRegionUnknownLink: "See the regional Transitions Pro",
      etapeAdresseNumeroVoie: "Street number",
      etapeAdresseTypeVoie: "Street type",
      etapeAdresseNomVoie: "Street name",
      etapeAdresseComplement: "Address line 2",
      etapeAdresseCodePostal: "Postcode",
      etapeAdresseCodePostalUnknown: "No town matches this postcode.",
      etapeAdresseCommune: "Town",
      etapeAdresseCommunesUnavailable: "The list of towns is not responding right now",
      etapeNoAccount: "Don't have a space yet?",
      etapeCreateAccount: "Create my space",
      etapeAlreadyAccount: "Already have a space?",
      etapeOrCredentials: "OR",

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
      etapeVerifyEmailSubtitle: "One last step before accessing your account.",
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
      etapePasswordRuleDigit: "One digit (0-9)",
      etapePasswordRuleSpecial: "One special character (!@#%^&*)",
      etapePasswordRuleMet: "(met)",
      etapePasswordRuleUnmet: "(not met)",

      etapeIllustrationAlt: "",
    },
  })
  .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };

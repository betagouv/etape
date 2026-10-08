import {
  AUTH_FLOW_ERROR,
  AUTH_FLOW_STEP,
  type AuthFlowError,
  type AuthFlowFailure,
  type AuthFlowStep,
} from "./auth-flow";

// Les textes de l'avis d'échec vivent à côté des constantes qu'ils indexent :
// une seule définition, partagée par front-office et back-office, et un
// `Record` qui ne compile plus si une étape ou une erreur est ajoutée sans son
// texte. La vue, elle, reste générique dans `packages/ui` (`NoticeScreen`).

export const AUTH_FLOW_TITLES: Record<AuthFlowStep, string> = {
  [AUTH_FLOW_STEP.LOGIN]: "La connexion n'a pas abouti",
  [AUTH_FLOW_STEP.LOGOUT]: "La déconnexion est incomplète",
};

export const AUTH_FLOW_MESSAGES: Record<AuthFlowStep, Record<AuthFlowError, string>> = {
  [AUTH_FLOW_STEP.LOGIN]: {
    [AUTH_FLOW_ERROR.EXPIRED]: "Le délai de connexion est dépassé. Veuillez recommencer.",
    [AUTH_FLOW_ERROR.FAILED]: "Une erreur est survenue pendant la connexion. Veuillez réessayer.",
    [AUTH_FLOW_ERROR.UNAVAILABLE]:
      "Le service de connexion est momentanément indisponible. Veuillez réessayer dans quelques minutes.",
    [AUTH_FLOW_ERROR.TOO_MANY_REQUESTS]:
      "Trop de tentatives de connexion en peu de temps. Veuillez patienter une minute avant de réessayer.",
  },
  [AUTH_FLOW_STEP.LOGOUT]: {
    [AUTH_FLOW_ERROR.EXPIRED]:
      "Vous êtes déconnecté d'ETAPE. Fermez votre navigateur pour terminer la session d'identification.",
    [AUTH_FLOW_ERROR.FAILED]:
      "Vous êtes déconnecté d'ETAPE, mais pas du service d'identification. Fermez votre navigateur pour terminer la session.",
    [AUTH_FLOW_ERROR.UNAVAILABLE]:
      "Vous êtes déconnecté d'ETAPE, mais le service d'identification est injoignable. Fermez votre navigateur pour terminer la session.",
    [AUTH_FLOW_ERROR.TOO_MANY_REQUESTS]:
      "Trop de demandes en peu de temps. Veuillez patienter une minute avant de vous déconnecter à nouveau.",
  },
};

/**
 * Après un échec de connexion, on réessaie ; après une déconnexion, même
 * incomplète, la personne n'est plus connectée à ETAPE : on lui propose de se
 * connecter. Dans les deux cas, c'est un clic qui relance le parcours, jamais
 * une redirection automatique, qui bouclerait si le service restait en panne.
 */
export const AUTH_FLOW_ACTION_LABELS: Record<AuthFlowStep, string> = {
  [AUTH_FLOW_STEP.LOGIN]: "Réessayer",
  [AUTH_FLOW_STEP.LOGOUT]: "Se connecter",
};

/** De quoi remplir un avis (`NoticeScreen`, dans `packages/ui`). */
export interface NoticeContent {
  title: string;
  message: string;
  actionLabel: string;
}

export function describeAuthFlowFailure(failure: AuthFlowFailure): NoticeContent {
  return {
    title: AUTH_FLOW_TITLES[failure.step],
    message: AUTH_FLOW_MESSAGES[failure.step][failure.error],
    actionLabel: AUTH_FLOW_ACTION_LABELS[failure.step],
  };
}

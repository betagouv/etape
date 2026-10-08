import { isTransientApiError } from "./api-error";
import type { NoticeContent } from "./auth-flow-messages";

// Les avis qui remplacent un écran, communs à front-office et back-office. La
// vue reste générique dans `packages/ui` (`NoticeScreen`).

/** L'API ne répond pas : on le dit, et c'est la personne qui relance. */
export const SERVICE_UNAVAILABLE_NOTICE: NoticeContent = {
  title: "Le service est momentanément indisponible",
  message: "Veuillez réessayer dans quelques minutes.",
  actionLabel: "Réessayer",
};

/** Un écran a planté, ou une réponse ne respecte pas le contrat. */
export const UNEXPECTED_ERROR_NOTICE: NoticeContent = {
  title: "Une erreur inattendue est survenue",
  message: "Veuillez recharger la page. Si le problème persiste, réessayez plus tard.",
  actionLabel: "Recharger la page",
};

export const NOT_FOUND_NOTICE: NoticeContent = {
  title: "Page introuvable",
  message: "L'adresse demandée n'existe pas ou n'est plus disponible.",
  actionLabel: "Revenir à l'accueil",
};

/**
 * « Service indisponible » seulement quand c'est vrai : une erreur passagère de
 * l'API. Tout le reste est une erreur inattendue, plutôt qu'une panne qui n'en
 * est pas une et qu'un rechargement ne réglerait pas.
 */
export function describeAppError(error: unknown): NoticeContent {
  return isTransientApiError(error) ? SERVICE_UNAVAILABLE_NOTICE : UNEXPECTED_ERROR_NOTICE;
}

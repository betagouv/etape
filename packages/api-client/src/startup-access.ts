import type { PublicSession } from "@etape/api-contract";

import { readAuthFlowFailure, type AuthFlowFailure } from "./auth-flow";
import type { NoticeContent } from "./auth-flow-messages";

/** Ce que l'app fait au démarrage, une fois la session connue. */
export type StartupAccess =
  | { kind: "auth-flow-failure"; failure: AuthFlowFailure }
  | { kind: "login-required" }
  | { kind: "authenticated"; session: PublicSession };

/**
 * L'échec d'un parcours passe avant l'absence de session : l'API y renvoie
 * justement quelqu'un qui n'est pas connecté. Rediriger vers le formulaire à ce
 * moment-là bouclerait dès que le service de connexion est en panne ; on affiche
 * l'échec, et c'est la personne qui relance.
 */
export function resolveStartupAccess(
  search: URLSearchParams,
  session: PublicSession | null,
): StartupAccess {
  const failure = readAuthFlowFailure(search);
  if (failure) return { kind: "auth-flow-failure", failure };

  if (!session) return { kind: "login-required" };

  return { kind: "authenticated", session };
}

/** Textes du démarrage, communs à front-office et back-office. */
export const STARTUP_PENDING_MESSAGE = "Vérification de votre session…";

/** L'API ne répond pas : on le dit, et c'est la personne qui relance. */
export const STARTUP_ERROR_NOTICE: NoticeContent = {
  title: "Le service est momentanément indisponible",
  message: "Veuillez réessayer dans quelques minutes.",
  actionLabel: "Réessayer",
};

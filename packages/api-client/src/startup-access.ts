import type { PublicSession } from "@etape/api-contract";

import { LOGIN_LOOP_NOTICE } from "./app-notices";
import { AUTH_FLOW_STEP, readAuthFlowFailure, type AuthFlowFailure } from "./auth-flow";
import { describeAuthFlowFailure, type NoticeContent } from "./auth-flow-messages";

/** Ce que l'app fait au démarrage, une fois la session connue. */
export type StartupAccess =
  | { kind: "auth-flow-failure"; failure: AuthFlowFailure }
  | { kind: "login-loop" }
  | { kind: "login-required" }
  | { kind: "authenticated"; session: PublicSession };

/**
 * L'échec d'un parcours passe avant l'absence de session : l'API y renvoie
 * justement quelqu'un qui n'est pas connecté. Rediriger vers le formulaire à ce
 * moment-là bouclerait dès que le service de connexion est en panne ; on affiche
 * l'échec, et c'est la personne qui relance.
 *
 * Une session valide passe en revanche avant un ancien échec de connexion
 * (favori, bouton Précédent, autre onglet) : la connexion a abouti depuis.
 * L'échec d'une déconnexion, lui, s'affiche toujours : la limite de débit peut
 * l'avoir refusée, et la session est alors encore ouverte.
 *
 * Sans session, on ne repart pas vers la connexion si l'on y est déjà parti
 * plusieurs fois à l'instant (`isLoginLoopSuspected`, voir `login-attempts.ts`) :
 * le cookie de session n'est pas conservé, et l'on bouclerait.
 */
export function resolveStartupAccess(
  search: URLSearchParams,
  session: PublicSession | null,
  isLoginLoopSuspected: boolean,
): StartupAccess {
  const failure = readAuthFlowFailure(search);
  const isOutdatedLoginFailure = session !== null && failure?.step === AUTH_FLOW_STEP.LOGIN;
  if (failure && !isOutdatedLoginFailure) return { kind: "auth-flow-failure", failure };

  if (session) return { kind: "authenticated", session };

  return isLoginLoopSuspected ? { kind: "login-loop" } : { kind: "login-required" };
}

/**
 * L'avis qui remplace l'app, ou `null` quand elle s'affiche. Dans les deux cas,
 * c'est un clic qui relance la connexion, jamais une redirection automatique.
 */
export function describeStartupNotice(access: StartupAccess): NoticeContent | null {
  if (access.kind === "auth-flow-failure") return describeAuthFlowFailure(access.failure);
  if (access.kind === "login-loop") return LOGIN_LOOP_NOTICE;
  return null;
}

/** Texte du démarrage, commun à front-office et back-office. */
export const STARTUP_PENDING_MESSAGE = "Vérification de votre session…";

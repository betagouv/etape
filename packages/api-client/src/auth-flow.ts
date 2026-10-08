// Copie de `apps/api/src/auth/auth-flow-error.ts`, à garder alignée : l'API ne
// peut importer du contrat que des types (il est publié en TypeScript source),
// donc ces valeurs ne peuvent pas encore y être partagées.
//
// Ces constantes pourraient être centralisées dans `packages/api-contract`, à
// condition de le compiler en JavaScript pour que l'API puisse en importer des
// valeurs. C'est un autre chantier, à mener plus tard si l'équipe est d'accord.

export const AUTH_FLOW_STEP = {
  LOGIN: "login",
  LOGOUT: "logout",
} as const;

export type AuthFlowStep = (typeof AUTH_FLOW_STEP)[keyof typeof AUTH_FLOW_STEP];

export const AUTH_FLOW_ERROR = {
  EXPIRED: "expired",
  FAILED: "failed",
  UNAVAILABLE: "unavailable",
  TOO_MANY_REQUESTS: "too-many-requests",
} as const;

export type AuthFlowError = (typeof AUTH_FLOW_ERROR)[keyof typeof AUTH_FLOW_ERROR];

export interface AuthFlowFailure {
  step: AuthFlowStep;
  error: AuthFlowError;
}

export function isAuthFlowError(value: string | null): value is AuthFlowError {
  return Object.values<string | null>(AUTH_FLOW_ERROR).includes(value);
}

/**
 * L'API renvoie un échec du parcours sur `/?login=<erreur>` ou
 * `/?logout=<erreur>`. Une valeur inconnue est ignorée plutôt qu'affichée.
 */
export function readAuthFlowFailure(search: URLSearchParams): AuthFlowFailure | null {
  for (const step of Object.values(AUTH_FLOW_STEP)) {
    const error = search.get(step);
    if (isAuthFlowError(error)) return { step, error };
  }

  return null;
}

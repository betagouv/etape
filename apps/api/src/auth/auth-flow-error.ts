// Copié dans `packages/api-client/src/auth-flow.ts`, que lisent front-office et
// back-office : toute modification ici doit y être reportée.

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

export function buildAuthFlowErrorUrl(
  frontBaseUrl: string,
  step: AuthFlowStep,
  error: AuthFlowError,
): string {
  return `${frontBaseUrl}/?${step}=${error}`;
}

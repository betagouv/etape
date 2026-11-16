/** Raison de renvoyer vers l'inscription la connexion que Keycloak affiche. */
export const REGISTRATION_RETURN = {
  /** FranceConnect a été choisi depuis l'inscription. */
  FRANCECONNECT_CHOSEN: "franceconnect-chosen",
  /** « Annuler et revenir à l'inscription » sur « Finaliser la création de votre espace ». */
  IDP_REVIEW_CANCELLED: "idp-review-cancelled",
} as const;

/** Raison de renvoyer vers l'inscription. */
export type RegistrationReturn = (typeof REGISTRATION_RETURN)[keyof typeof REGISTRATION_RETURN];

const STORAGE_KEY = "etape-registration-return";
const FRANCECONNECT_ENDPOINT_SUFFIX = "/broker/franceconnect/endpoint";
const LOGIN_PAGE_SUFFIX = "/login-actions/authenticate";
const CANCELLED_ERROR = "access_denied";

const isRegistrationReturn = (value: string | null): value is RegistrationReturn =>
  Object.values<string | null>(REGISTRATION_RETURN).includes(value);

/** Retient la raison, juste avant de quitter la page. */
export function rememberRegistrationReturn(reason: RegistrationReturn): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, reason);
  } catch {
    return;
  }
}

/** Raison retenue, ou `undefined` sans raison ou sans stockage. */
export function readRegistrationReturn(): RegistrationReturn | undefined {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return isRegistrationReturn(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Oublie la raison : elle ne sert qu'à la page qui suit. */
export function forgetRegistrationReturn(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

/**
 * Vrai quand la connexion affichée doit céder la place à l'inscription.
 *
 * Après « Revenir sur Transitions Pro », Keycloak rend la connexion à l'adresse de retour de
 * FranceConnect, avec `error=access_denied` ; après « Annuler », il la rend à la reprise du flux.
 */
export function shouldReturnToRegistration(
  reason: RegistrationReturn | undefined,
  location: Pick<Location, "pathname" | "search">,
): boolean {
  if (reason === REGISTRATION_RETURN.IDP_REVIEW_CANCELLED) {
    return location.pathname.endsWith(LOGIN_PAGE_SUFFIX);
  }
  return (
    reason === REGISTRATION_RETURN.FRANCECONNECT_CHOSEN &&
    location.pathname.endsWith(FRANCECONNECT_ENDPOINT_SUFFIX) &&
    new URLSearchParams(location.search).get("error") === CANCELLED_ERROR
  );
}

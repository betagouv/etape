const ACTION_ONLY_PARAMS = ["execution", "session_code"] as const;

/**
 * Page d'inscription à ouvrir de nouveau, tirée de l'adresse d'envoi du formulaire :
 * Keycloak refuse un GET qui porte encore l'étape et le code de session.
 */
export function toRegistrationPageUrl(registrationAction: string): string {
  const url = new URL(registrationAction, window.location.href);
  ACTION_ONLY_PARAMS.forEach((param) => url.searchParams.delete(param));
  return url.toString();
}

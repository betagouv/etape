const ACTION_ONLY_PARAMS = ["execution", "session_code"] as const;

/**
 * Page à ouvrir de nouveau, tirée de l'adresse d'envoi de son formulaire (inscription,
 * « Finaliser la création de votre espace ») : Keycloak refuse un GET qui porte encore
 * l'étape et le code de session.
 */
export function toReloadablePageUrl(formAction: string): string {
  const url = new URL(formAction, window.location.href);
  ACTION_ONLY_PARAMS.forEach((param) => url.searchParams.delete(param));
  return url.toString();
}

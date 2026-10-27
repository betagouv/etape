/** Ce qu'il faut à Matomo pour mesurer une app : l'instance et le site. */
export interface MatomoConfig {
  /** Adresse de l'instance, sans slash final (`https://stats.beta.gouv.fr`). */
  url: string;
  siteId: string;
}

export interface MatomoEnv {
  url: string | undefined;
  siteId: string | undefined;
}

/** Une boucle plutôt qu'une expression régulière, qui serait lente sur une longue suite de `/`. */
function withoutTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end -= 1;
  return value.slice(0, end);
}

/**
 * Lit la configuration figée au build. Sans site ID, la mesure est désactivée et
 * aucun script n'est chargé : c'est le cas de `main.dev` et du dev local, qui
 * n'envoient aucune visite dans les statistiques.
 */
export function readMatomoConfig({ url, siteId }: MatomoEnv): MatomoConfig | null {
  const trimmedUrl = url === undefined ? undefined : withoutTrailingSlashes(url.trim());
  const trimmedSiteId = siteId?.trim();

  if (!trimmedUrl || !trimmedSiteId) return null;

  return { url: trimmedUrl, siteId: trimmedSiteId };
}

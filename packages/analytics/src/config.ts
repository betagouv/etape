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

/**
 * Lit la configuration figée au build. Sans site ID, la mesure est désactivée et
 * aucun script n'est chargé : c'est le cas des previews, de `main.dev` et du dev
 * local, qui ne doivent jamais envoyer de visites dans les statistiques.
 */
export function readMatomoConfig({ url, siteId }: MatomoEnv): MatomoConfig | null {
  const trimmedUrl = url?.trim().replace(/\/+$/, "");
  const trimmedSiteId = siteId?.trim();

  if (!trimmedUrl || !trimmedSiteId) return null;

  return { url: trimmedUrl, siteId: trimmedSiteId };
}

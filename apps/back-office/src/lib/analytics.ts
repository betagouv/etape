import { readMatomoConfig } from "@etape/analytics";

/**
 * Figée au build par Vite : chaque environnement construit son image avec son
 * site ID (`docs/deploiement.md`). Absente, la mesure est désactivée.
 */
export const MATOMO_CONFIG = readMatomoConfig({
  url: import.meta.env.VITE_MATOMO_URL,
  siteId: import.meta.env.VITE_MATOMO_SITE_ID,
});

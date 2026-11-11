import { readMatomoConfig } from "@etape/analytics";

/**
 * Figée au build : chaque environnement construit son image avec son site ID
 * (`docs/deploiement.md`). Absente, la mesure est désactivée.
 */
export const MATOMO_CONFIG = readMatomoConfig({
  url: process.env.NEXT_PUBLIC_MATOMO_URL,
  siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
});

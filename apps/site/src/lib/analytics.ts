import { readMatomoConfig } from "@etape/analytics";

/**
 * Figée au build : chaque environnement construit son image avec son site ID
 * (`docs/deploiement.md`). Absente, la mesure est désactivée.
 */
export const MATOMO_CONFIG = readMatomoConfig({
  url: process.env.NEXT_PUBLIC_MATOMO_URL,
  siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
});

/** D'où l'on part vers le simulateur : libellé de l'event `acces_simulateur`. */
export const EMPLACEMENT_ACCES_SIMULATEUR = {
  HERO: "hero",
  AUDIENCE: "audience",
  APPEL_FINAL: "appel_final",
  LE_SAVIEZ_VOUS: "le_saviez_vous",
} as const;

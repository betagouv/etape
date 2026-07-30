import figma from "@figma/code-connect";

import { SiteFooter } from "@/components/site-footer";

/**
 * Association Code Connect : section `Footer` de la maquette → `SiteFooter`.
 *
 * `SiteFooter` ne prend aucune prop : son contenu vient de `@/lib/footer`.
 * Même réserve que pour les autres associations — l'URL cible une instance et
 * doit être régénérée via `npm run figma:create` avant publication.
 */
figma.connect(SiteFooter, "<SIMULATEUR_V2>?node-id=3504-44774", {
  example: () => <SiteFooter />,
});

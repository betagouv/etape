import figma from "@figma/code-connect";

import { SiteHeader } from "@/components/site-header";

/**
 * Association Code Connect : composant Figma `Navbar` → composant `SiteHeader`.
 *
 * `SiteHeader` ne prend aucune prop : les entrées du menu viennent de
 * `@/lib/navigation`. L'exemple montré aux designers dans Figma est donc le
 * simple montage du composant, tel qu'il apparaît dans `app/layout.tsx`.
 *
 * Même réserve que pour `nav-link.figma.tsx` : l'URL cible une instance et doit
 * être régénérée via `npm run figma:create` avant publication.
 */
figma.connect(SiteHeader, "<SIMULATEUR_V2>?node-id=3504-44656", {
  example: () => <SiteHeader />,
});

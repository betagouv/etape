import { BackToTop } from "@etape/ui/components/back-to-top";

import { Audience } from "@/components/sections/audience";
import { DidYouKnow } from "@/components/sections/did-you-know";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Impact } from "@/components/sections/impact";
import { Testimonials } from "@/components/sections/testimonials";
import { Trust } from "@/components/sections/trust";
import { CONTENT_ID } from "@/lib/nav";

/**
 * Page d'accueil du site.
 *
 * Reprend la maquette « Desktop - Home » / « Mobile - Home » de SIMULATEUR v2,
 * moins les trois blocs écartés par l'US : Couverture (la liste des
 * dispositifs), Partenariat et FAQ.
 *
 * En-tête et pied de page sont hors périmètre : ils sont traités ailleurs. Les
 * sections gardent leurs ancres (`#comment-ca-marche`, `#pour-qui`,
 * `#temoignages`) pour que la navigation puisse s'y raccrocher sans y revenir.
 *
 * Server Component : seul `BackToTop` embarque du JavaScript côté client.
 */
export default function Home() {
  return (
    <>
      {/* En tête d'arbre : le composant y dépose la sentinelle qui commande son
          affichage (cf. sa documentation). */}
      <BackToTop targetId={CONTENT_ID} />

      <main id={CONTENT_ID} tabIndex={-1} className="flex-1 focus-visible:outline-none">
        <Hero />
        <HowItWorks />
        <Trust />
        <DidYouKnow />
        <Audience />
        <Impact />
        <Testimonials />
        <FinalCta />
      </main>
    </>
  );
}

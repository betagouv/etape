import type { Metadata } from "next";

import { Audience } from "@/components/sections/audience";
import { DidYouKnow } from "@/components/sections/did-you-know";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Impact } from "@/components/sections/impact";
import { Testimonials } from "@/components/sections/testimonials";
import { Trust } from "@/components/sections/trust";

/**
 * Métadonnées propres à l'accueil. Elles vivent ici et non dans le layout
 * racine, qui couvre aussi les autres routes du menu.
 */
export const metadata: Metadata = {
  title: "ETAPE — En pleine réflexion sur votre vie professionnelle ?",
  description:
    "Le simulateur ETAPE vous aide à identifier les dispositifs, accompagnements et financements qui peuvent soutenir votre projet de reconversion ou d'évolution professionnelle, selon votre situation.",
};

/**
 * Page d'accueil du site.
 *
 * Reprend la maquette « Desktop - Home » / « Mobile - Home » de SIMULATEUR v2,
 * moins les trois blocs écartés par l'US : Couverture (la liste des
 * dispositifs), Partenariat et FAQ.
 *
 * Les repères de page — `<main>`, en-tête, pied de page — sont posés par le
 * layout racine : cette page ne rend que ses sections. Elles conservent leurs
 * ancres (`#comment-ca-marche`, `#pour-qui`, `#temoignages`), qui sont les
 * cibles du menu principal.
 *
 * Server Component : aucun JavaScript côté client.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Trust />
      <DidYouKnow />
      <Audience />
      <Impact />
      <Testimonials />
      <FinalCta />
    </>
  );
}

import type { Metadata } from "next";

import { Audience } from "@/components/sections/audience";
import { DidYouKnow } from "@/components/sections/did-you-know";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Impact } from "@/components/sections/impact";
import { Testimonials } from "@/components/sections/testimonials";
import { Trust } from "@/components/sections/trust";

export const metadata: Metadata = {
  title: "ETAPE — En pleine réflexion sur votre vie professionnelle ?",
  description:
    "Le simulateur ETAPE vous aide à identifier les dispositifs, accompagnements et financements qui peuvent soutenir votre projet de reconversion ou d'évolution professionnelle, selon votre situation.",
};

/**
 * Maquette « Desktop / Mobile - Home » de SIMULATEUR v2, moins les blocs écartés
 * par l'US : Couverture (liste des dispositifs) et Partenariat.
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
      <Faq />
      <FinalCta />
    </>
  );
}

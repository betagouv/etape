import Image from "next/image";

import { Button } from "@etape/ui/components/button";
import { Section } from "@etape/ui/components/section";

import formationImage from "@/assets/formation-collective.jpg";
import { didYouKnow } from "@/content/home";
import { SIMULATEUR_URL } from "@/lib/navigation";

/**
 * « Le saviez-vous ? » — le chiffre clé.
 *
 * La maquette met « 24 000 personnes » en exergue dans un encart teal au milieu
 * de la phrase. L'encart est un simple fond appliqué au texte : le titre reste
 * une seule phrase continue pour la restitution vocale, sans balisage qui
 * viendrait la fragmenter.
 */
export function DidYouKnow() {
  return (
    <Section
      surface="secondary"
      aria-labelledby="titre-le-saviez-vous"
      /** Gouttière `Padding/8XL` : cette bande est plus resserrée que les autres. */
      width="md"
      // 3/5 de texte, 2/5 d'image : les proportions de la maquette (552 / 344)
      // exprimées en fractions de grille plutôt qu'en largeurs figées.
      containerClassName="lg:grid lg:grid-cols-5 lg:items-center lg:gap-8"
    >
      <div className="flex flex-col items-start gap-6 lg:col-span-3">
        <p className="text-caption text-primary font-medium tracking-wide uppercase">
          {didYouKnow.caption}
        </p>

        <h2 id="titre-le-saviez-vous" className="text-h2 flex flex-col items-start gap-2 font-bold">
          {/* `flex-wrap` plutôt qu'un point de rupture : l'encart passe à la
              ligne d'un seul bloc quand il ne tient plus à côté de « Chaque
              année, », ce qui reproduit les deux maquettes sans les distinguer. */}
          <span className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span>{didYouKnow.sentenceBefore}</span>
            {/* `Padding/L` × `Padding/S` sur `Surface/Base/Primary`, `Radius/M`. */}
            <span className="bg-primary text-primary-foreground rounded-lg px-4 py-2 whitespace-nowrap">
              {didYouKnow.highlight}
            </span>
          </span>
          {didYouKnow.sentenceAfter.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>

        <Button asChild variant="outline-primary" size="xl" className="w-full sm:w-auto">
          <a href={SIMULATEUR_URL}>{didYouKnow.cta}</a>
        </Button>
      </div>

      <div className="mt-8 aspect-[358/260] overflow-hidden rounded-xl lg:col-span-2 lg:mt-0 lg:aspect-square">
        <Image
          src={formationImage}
          alt=""
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="size-full object-cover"
        />
      </div>
    </Section>
  );
}

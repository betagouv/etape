import Image from "next/image";

import { Button } from "@etape/ui/components/button";
import { Section } from "@etape/ui/components/section";

import accompagnementImage from "@/assets/accompagnement-equipe.jpg";
import { audience } from "@/content/home";
import { SIMULATEUR_URL } from "@/lib/navigation";

/**
 * « Pour qui » — le bandeau teal.
 *
 * Sur cette surface, le texte hérite de `--primary-foreground` : rien ne doit
 * réintroduire une couleur de contenu, sous peine de casser le contraste.
 */
export function Audience() {
  return (
    <Section
      id="pour-qui"
      surface="primary"
      aria-labelledby="titre-pour-qui"
      /** Mêmes gouttière et proportions que « Le saviez-vous », mais inversées. */
      width="md"
      containerClassName="lg:grid lg:grid-cols-5 lg:items-center lg:gap-8"
    >
      <div className="aspect-[358/220] overflow-hidden rounded-xl lg:col-span-2 lg:aspect-square">
        <Image
          src={accompagnementImage}
          alt=""
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="size-full object-cover"
        />
      </div>

      <div className="mt-8 flex flex-col items-start gap-6 lg:col-span-3 lg:mt-0">
        {/* Pas de chapô « POUR QUI ? » : le calque existe dans la maquette mais
            y est rendu invisible (teal sur teal). L'afficher ajouterait un
            élément que le design ne montre pas. */}
        <h2 id="titre-pour-qui" className="text-h2 font-bold">
          {audience.title}
        </h2>
        <p className="text-body-lg">{audience.subtext}</p>

        <Button asChild variant="inverse" size="xl" className="w-full sm:w-auto">
          <a href={SIMULATEUR_URL}>{audience.cta}</a>
        </Button>
      </div>
    </Section>
  );
}

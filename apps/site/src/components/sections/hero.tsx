import Image from "next/image";

import { Button } from "@etape/ui/components/button";
import { Section } from "@etape/ui/components/section";

import heroImage from "@/assets/hero-reflexion.jpg";
import { hero } from "@/content/home";
import { SIMULATEUR_URL } from "@/lib/navigation";

/**
 * Bloc d'accroche.
 *
 * L'image est purement illustrative : `alt=""` la retire de la restitution
 * vocale plutôt que d'imposer une description qui n'apporte rien (RGAA 1.2).
 * C'est le seul visuel au-dessus de la ligne de flottaison, donc le seul à
 * porter `preload` (`priority` est déprécié depuis Next 16).
 */
export function Hero() {
  return (
    <Section
      aria-labelledby="titre-accroche"
      // Répartition de la maquette : image 520 + `Gap/4XL` (64) + texte 600,
      // soit les 1184 de contenu de la section.
      //
      // Elle n'est appliquée qu'à partir de `xl` : c'est le palier où la largeur
      // de contenu est déjà plafonnée à 1184 (le `max-width` du conteneur mord
      // dès 1248px), donc le seul où les 520px tombent juste. Entre `lg` et
      // `xl`, la largeur est encore fluide et deux colonnes égales évitent
      // d'écraser la colonne de texte.
      containerClassName="lg:grid lg:grid-cols-2 lg:gap-16 xl:grid-cols-[32.5rem_minmax(0,1fr)]"
    >
      <div className="mb-8 aspect-square overflow-hidden rounded-xl lg:mb-0">
        <Image
          src={heroImage}
          alt=""
          sizes="(min-width: 1280px) 520px, (min-width: 1024px) 50vw, 100vw"
          className="size-full object-cover"
          preload
        />
      </div>

      <div className="flex flex-col items-start gap-6 lg:justify-center lg:gap-8">
        <h1 id="titre-accroche" className="text-h1 font-bold">
          {/* Un `block` par ligne plutôt qu'un `<br />` : le retour suit la
              maquette en desktop et disparaît de lui-même quand le titre se
              réagence sur mobile. */}
          {hero.titleLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>

        <p className="text-body-lg text-content-secondary">{hero.subtext}</p>

        <Button asChild size="xl" className="w-full sm:w-auto">
          <a href={SIMULATEUR_URL}>{hero.cta}</a>
        </Button>
      </div>
    </Section>
  );
}

import Image from "next/image";

import { Button } from "@etape/ui/components/button";
import { Section } from "@etape/ui/components/section";

import heroImage from "@/assets/hero-reflexion.jpg";
import { hero } from "@/content/home";
import { SIMULATEUR_URL } from "@/lib/navigation";

export function Hero() {
  return (
    <Section
      aria-labelledby="titre-accroche"
      // Les 520/600 de la maquette ne tombent juste qu'à partir de `xl`, palier
      // où la largeur de contenu est déjà plafonnée à 1184. En dessous elle est
      // fluide, d'où deux colonnes égales.
      containerClassName="lg:grid lg:grid-cols-2 lg:gap-16 xl:grid-cols-[32.5rem_minmax(0,1fr)]"
    >
      <div className="mb-8 aspect-square overflow-hidden rounded-xl lg:mb-0">
        <Image
          src={heroImage}
          alt=""
          sizes="(min-width: 1280px) 520px, (min-width: 1024px) 50vw, 100vw"
          className="size-full object-cover"
          // `priority` est déprécié depuis Next 16.
          preload
        />
      </div>

      <div className="flex flex-col items-start gap-6 lg:justify-center lg:gap-8">
        <h1 id="titre-accroche" className="text-h1 font-bold">
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

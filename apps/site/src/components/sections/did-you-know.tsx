import Image from "next/image";

import { ANALYTICS_EVENT, analyticsEventProps } from "@etape/analytics";
import { Button } from "@etape/ui/components/button";
import { Section } from "@etape/ui/components/section";

import formationImage from "@/assets/formation-collective.jpg";
import { didYouKnow } from "@/content/home";
import { EMPLACEMENT_ACCES_SIMULATEUR } from "@/lib/analytics";
import { SIMULATEUR_URL } from "@/lib/navigation";

export function DidYouKnow() {
  return (
    <Section
      surface="secondary"
      aria-labelledby="titre-le-saviez-vous"
      width="md"
      containerClassName="lg:grid lg:grid-cols-5 lg:items-center lg:gap-8"
    >
      <div className="flex flex-col items-start gap-6 lg:col-span-3">
        <p className="text-caption text-primary font-medium tracking-wide uppercase">
          {didYouKnow.caption}
        </p>

        <h2
          id="titre-le-saviez-vous"
          className="font-heading text-heading-sm flex flex-col items-start gap-2"
        >
          <span className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span>{didYouKnow.sentenceBefore}</span>
            <span className="bg-primary text-primary-foreground rounded-lg px-4 py-2 whitespace-nowrap">
              {didYouKnow.highlight}
            </span>
          </span>
          {didYouKnow.sentenceAfter.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>

        <Button asChild variant="outline-primary" size="xl" className="w-full sm:w-auto">
          <a
            href={SIMULATEUR_URL}
            {...analyticsEventProps(
              ANALYTICS_EVENT.ACCES_SIMULATEUR,
              EMPLACEMENT_ACCES_SIMULATEUR.LE_SAVIEZ_VOUS,
            )}
          >
            {didYouKnow.cta}
          </a>
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

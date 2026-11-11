import { ANALYTICS_EVENT, analyticsEventProps } from "@etape/analytics";
import { Button } from "@etape/ui/components/button";
import { Section } from "@etape/ui/components/section";

import { ReassuranceList } from "@/components/reassurance-list";
import { finalCta } from "@/content/home";
import { EMPLACEMENT_ACCES_SIMULATEUR } from "@/lib/analytics";
import { SIMULATEUR_URL } from "@/lib/navigation";

export function FinalCta() {
  return (
    <Section
      aria-labelledby="titre-cta-final"
      containerClassName="flex flex-col items-center gap-6 text-center"
    >
      <h2 id="titre-cta-final" className="font-heading text-heading-sm">
        {finalCta.title}
      </h2>
      <p className="text-body-lg text-muted-foreground max-w-2xl">{finalCta.subtext}</p>

      <Button asChild size="xl" className="w-full sm:w-auto">
        <a
          href={SIMULATEUR_URL}
          {...analyticsEventProps(
            ANALYTICS_EVENT.ACCES_SIMULATEUR,
            EMPLACEMENT_ACCES_SIMULATEUR.APPEL_FINAL,
          )}
        >
          {finalCta.cta}
        </a>
      </Button>

      <ReassuranceList items={finalCta.items} variant="inline" className="mt-2" />
    </Section>
  );
}

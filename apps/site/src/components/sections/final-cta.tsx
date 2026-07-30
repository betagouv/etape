import { Button } from "@etape/ui/components/button";
import { Section } from "@etape/ui/components/section";

import { ReassuranceList } from "@/components/reassurance-list";
import { finalCta } from "@/content/home";
import { SIMULATEUR_URL } from "@/lib/navigation";

/** Dernière relance avant le pied de page. */
export function FinalCta() {
  return (
    <Section
      aria-labelledby="titre-cta-final"
      containerClassName="flex flex-col items-center gap-6 text-center"
    >
      <h2 id="titre-cta-final" className="text-h2 font-bold">
        {finalCta.title}
      </h2>
      <p className="text-body-lg text-muted-foreground max-w-2xl">{finalCta.subtext}</p>

      <Button asChild size="xl" className="w-full sm:w-auto">
        <a href={SIMULATEUR_URL}>{finalCta.cta}</a>
      </Button>

      <ReassuranceList items={finalCta.items} variant="inline" className="mt-2" />
    </Section>
  );
}

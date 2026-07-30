import { Section, SectionHeader } from "@etape/ui/components/section";

import { ReassuranceList } from "@/components/reassurance-list";
import { trust } from "@/content/home";

/** « Une démarche simple et sécurisée » — les arguments de réassurance. */
export function Trust() {
  return (
    <Section surface="grey" aria-labelledby="titre-confiance">
      <SectionHeader caption={trust.caption} title={trust.title} titleId="titre-confiance" />

      <ReassuranceList items={trust.items} className="mt-8 lg:mt-10" />
    </Section>
  );
}

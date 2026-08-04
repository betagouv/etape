import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@etape/ui/components/accordion";
import { Section, SectionHeader } from "@etape/ui/components/section";

import { faq } from "@/content/home";

/**
 * `type="single" collapsible` porte à lui seul la règle métier « ouvrir une
 * réponse ferme la précédente » : aucun état local à tenir. Aucun item n'est
 * ouvert au chargement — la maquette en montre un déplié pour illustrer l'état,
 * pas pour fixer la valeur initiale.
 *
 * La liste est unique, sans variante responsive : c'est le critère d'acceptation.
 */
export function Faq() {
  return (
    <Section id="faq" aria-labelledby="titre-faq">
      <SectionHeader caption={faq.caption} title={faq.title} titleId="titre-faq" />

      {/* `_InnerContent` de la maquette : 640 de large, centré dans la section. */}
      <Accordion type="single" collapsible className="mx-auto mt-8 max-w-[40rem]">
        {faq.items.map(({ id, question, lead, answer }) => (
          <AccordionItem key={id} value={id}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              <p className="font-semibold">{lead}</p>
              <p>{answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

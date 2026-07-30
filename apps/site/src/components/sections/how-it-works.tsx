import { Section, SectionHeader } from "@etape/ui/components/section";

import { howItWorks } from "@/content/home";

/**
 * « Comment ça marche » — les trois étapes du parcours.
 *
 * Les étapes sont sans habillage de carte (ni fond ni bordure dans les deux
 * maquettes) : ce sont des blocs simples, pas des `Card`. La liste est ordonnée
 * (`<ol>`) parce que la séquence porte du sens.
 */
export function HowItWorks() {
  return (
    <Section id="comment-ca-marche" aria-labelledby="titre-comment-ca-marche">
      <SectionHeader
        caption={howItWorks.caption}
        title={howItWorks.title}
        titleId="titre-comment-ca-marche"
        subtext={howItWorks.subtext}
      />

      <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
        {howItWorks.steps.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex flex-col items-center gap-3 px-6 text-center">
            <Icon aria-hidden="true" focusable="false" className="text-primary size-12" />
            <h3 className="text-body-lg font-bold">{title}</h3>
            <p className="text-body text-content-secondary">{description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

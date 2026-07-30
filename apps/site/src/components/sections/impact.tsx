import { Card } from "@etape/ui/components/card";
import { Section, SectionHeader } from "@etape/ui/components/section";

import { impact } from "@/content/home";

/**
 * « Mesurer notre impact » — les indicateurs clés.
 *
 * Chaque indicateur se lit « 160 000 → reconversions financées → description » :
 * l'ordre du DOM suit l'ordre de lecture, la valeur mise en avant visuellement
 * n'étant qu'une question de taille de police.
 */
export function Impact() {
  return (
    <Section aria-labelledby="titre-impact">
      <SectionHeader
        caption={impact.caption}
        title={impact.title}
        titleId="titre-impact"
        subtext={impact.subtext}
        align="start"
      />

      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
        {impact.stats.map(({ value, label, description }) => (
          <li key={label} className="flex">
            <Card variant="muted" className="w-full px-6">
              <p className="text-display-lg text-primary font-bold">{value}</p>
              <p className="text-caption text-muted-foreground tracking-wide uppercase">{label}</p>
              <p className="text-body text-content-secondary">{description}</p>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

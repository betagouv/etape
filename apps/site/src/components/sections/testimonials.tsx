import { Card } from "@etape/ui/components/card";
import { Section, SectionHeader } from "@etape/ui/components/section";

import { testimonials } from "@/content/home";

export function Testimonials() {
  return (
    <Section id="temoignages" aria-labelledby="titre-temoignages">
      <SectionHeader
        caption={testimonials.caption}
        title={testimonials.title}
        titleId="titre-temoignages"
        subtext={testimonials.subtext}
      />

      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
        {testimonials.items.map(({ name, role, quote }) => (
          <li key={name} className="flex">
            <Card variant="muted" asChild className="w-full px-6">
              <figure>
                <figcaption className="flex flex-col">
                  <span className="text-base font-bold">{name}</span>
                  <span className="text-muted-foreground text-sm">{role}</span>
                </figcaption>
                <blockquote className="text-content-secondary text-base">
                  <span aria-hidden="true">«&nbsp;</span>
                  {quote}
                  <span aria-hidden="true">&nbsp;»</span>
                </blockquote>
              </figure>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}

import { useId, type ReactNode, type Ref } from "react";

import { Button } from "@etape/ui/components/button";
import { Card } from "@etape/ui/components/card";
import { Container } from "@etape/ui/components/container";
import { SectionHeader } from "@etape/ui/components/section";
import { Separator } from "@etape/ui/components/separator";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import type { Volet, VoletPosition } from "../domain/volets";
import { FormSidebar } from "./form-sidebar";
import { VoletLink } from "./volet-link";

export interface FormLayoutProps {
  volets: Volet[];
  position: VoletPosition;
  headingRef: Ref<HTMLHeadingElement>;
  children?: ReactNode;
}

/** Cadre d'un volet du dossier, posé à cheval sur le bas de `DossierHeader`. */
export function FormLayout({ volets, position, headingRef, children }: FormLayoutProps) {
  const titleId = useId();
  const { index, current, previous, next } = position;

  return (
    <Container size="app" className="relative -mt-22">
      <Card variant="panel" className="grid lg:grid-cols-[auto_auto_minmax(0,1fr)]">
        <FormSidebar volets={volets} />
        <Separator orientation="vertical" className="hidden lg:block" />
        <div className="flex min-w-0 flex-col gap-6">
          <SectionHeader
            variant="compact"
            align="start"
            caption={`Section ${index + 1} sur ${volets.length}`}
            title={current.title}
            titleId={titleId}
            titleRef={headingRef}
            subtext={current.description}
          />
          {children}
          <div className="flex justify-end border-t pt-5">
            {previous && (
              <Button asChild variant="secondary" size="md" className="mr-auto">
                <VoletLink voletId={previous.id}>
                  <ArrowLeftIcon aria-hidden="true" />
                  Étape précédente
                </VoletLink>
              </Button>
            )}
            {next && (
              <Button asChild size="md">
                <VoletLink voletId={next.id}>
                  Étape suivante
                  <ArrowRightIcon aria-hidden="true" />
                </VoletLink>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </Container>
  );
}

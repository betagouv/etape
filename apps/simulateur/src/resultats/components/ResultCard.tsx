import type { Ref } from "react";
import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter } from "@etape/ui/components/card";
import { Separator } from "@etape/ui/components/separator";
import { focusRing } from "@etape/ui/lib/focus";

import type { ResultatAffiche } from "../domain/types";
import { CategorieTag } from "./CategorieTag";

interface ResultCardProps {
  resultat: ResultatAffiche;
  headingRef?: Ref<HTMLHeadingElement>;
}

export function ResultCard({ resultat, headingRef }: ResultCardProps) {
  const { nom, description, url, categorie, isPrioritaire } = resultat;

  return (
    <Card variant={isPrioritaire ? "primary" : "outline"} asChild>
      <article>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-col-reverse items-start gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
            <h3
              ref={headingRef}
              tabIndex={headingRef ? -1 : undefined}
              className={`font-heading text-heading-sm rounded-sm ${focusRing}`}
            >
              {nom}
            </h3>
            <CategorieTag categorie={categorie} />
          </div>
          <CardDescription>{description}</CardDescription>
        </CardContent>

        <CardContent>
          <Separator />
        </CardContent>

        <CardFooter>
          <Button asChild variant="secondary" size="responsive-sm">
            <a href={url} target="_blank" rel="noopener noreferrer">
              En savoir plus
              <span className="sr-only"> sur {nom} (nouvelle fenêtre)</span>
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          </Button>
        </CardFooter>
      </article>
    </Card>
  );
}

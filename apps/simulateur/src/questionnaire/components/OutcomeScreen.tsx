import type { RefObject } from "react";
import Image from "next/image";
import { MapPin, PencilLine, RotateCcw } from "lucide-react";
import { Alert, AlertTitle } from "@etape/ui/components/alert";
import { Button } from "@etape/ui/components/button";
import { Card } from "@etape/ui/components/card";

import { buildRecap } from "@/resultats/domain/recap";

import type { Answers, Outcome, TextPart } from "../domain/types";

// `basePath` ne s'applique pas au `src` de `next/image` : voir `app/page.tsx`.
const assets = process.env.NEXT_PUBLIC_BASE_PATH;

interface OutcomeScreenProps {
  outcome: Outcome;
  /** Réponses du parcours, dont celles qui ont mené ici sont rappelées. */
  answers: Answers;
  /**
   * Retour à la dernière question répondue. Un écran terminal reste atteint
   * par une réponse : sans porte de sortie, une faute de clic obligerait à
   * tout recommencer.
   */
  onBack?: () => void;
  onRestart: () => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

/** Un morceau de texte ; mis en avant, il passe en couleur pleine (maquette). */
function renderPart(part: TextPart, index: number) {
  if (typeof part === "string") return part;
  return (
    <span key={index} className="text-foreground">
      {part.emphasis}
    </span>
  );
}

/**
 * Fin de la simulation, quand les réponses sortent du champ du simulateur
 * (maquette « Résultats / No result ») : ce qui l'a arrêtée, la réponse en
 * cause, un conseil pour la suite, et de quoi corriger ou recommencer.
 */
export function OutcomeScreen({
  outcome,
  answers,
  onBack,
  onRestart,
  headingRef,
}: OutcomeScreenProps) {
  const causes = buildRecap(answers).filter((entry) => outcome.causes.includes(entry.questionId));

  return (
    <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-8 md:justify-center md:py-16">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Décorative : le titre dit déjà tout. */}
        <Image
          src={`${assets}/illustration-fin-simulation.svg`}
          alt=""
          width={280}
          height={219}
          className="h-auto w-52 md:w-70"
        />

        <div className="flex w-full flex-col gap-4 text-center">
          <p className="text-body-lg text-primary leading-none font-semibold uppercase">
            Fin de la simulation
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-heading-sm md:text-heading-md text-foreground focus-visible:outline-ring rounded-sm text-balance focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {outcome.title}
          </h1>
          <p className="text-body-lg text-muted-foreground">{outcome.text.map(renderPart)}</p>

          {causes.length > 0 && (
            <Card className="flex-row flex-wrap items-center justify-between gap-4 px-5 py-4 text-start">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="bg-secondary flex size-13 shrink-0 items-center justify-center rounded-md">
                  <MapPin aria-hidden="true" className="text-primary size-8" />
                </div>
                <dl className="flex min-w-0 flex-col gap-2">
                  {causes.map((entry) => (
                    <div key={entry.fieldName}>
                      <dt className="text-body text-muted-foreground">{entry.question}</dt>
                      <dd className="text-body-lg text-foreground font-medium">{entry.answer}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              {onBack && (
                <Button type="button" variant="outline" size="sm" onClick={onBack}>
                  <PencilLine aria-hidden="true" />
                  Modifier ma réponse
                </Button>
              )}
            </Card>
          )}
        </div>

        {outcome.advice && (
          <Alert variant="emphasis">
            <AlertTitle>{outcome.advice}</AlertTitle>
          </Alert>
        )}

        <Button type="button" size="responsive" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          Recommencer la simulation
        </Button>
      </div>
    </main>
  );
}

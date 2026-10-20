import type { RefObject } from "react";
import Image from "next/image";
import { MapPin, PencilLine, RotateCcw } from "lucide-react";
import { Alert, AlertTitle } from "@etape/ui/components/alert";
import { Button } from "@etape/ui/components/button";
import { Card } from "@etape/ui/components/card";

import { buildOutcomeRecap } from "@/resultats/domain/recap";

import type { Answers, Outcome } from "../domain/types";
import { TextParts } from "./TextParts";

// `basePath` ne s'applique pas au `src` de `next/image` : voir `app/page.tsx`.
const assets = process.env.NEXT_PUBLIC_BASE_PATH;

interface OutcomeScreenProps {
  outcome: Outcome;
  answers: Answers;
  /** Retour à la dernière question répondue : une faute de clic ne condamne pas la simulation. */
  onBack: () => void;
  onRestart: () => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/** Fin de la simulation quand les réponses sortent du champ du simulateur. */
export function OutcomeScreen({
  outcome,
  answers,
  onBack,
  onRestart,
  headingRef,
}: OutcomeScreenProps) {
  const causes = buildOutcomeRecap(outcome, answers);

  return (
    <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-8 md:justify-center md:py-16">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8">
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
          <p className="text-body-lg text-muted-foreground">
            <TextParts parts={outcome.text} emphasisClassName="text-foreground" />
          </p>

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
              <Button type="button" variant="outline" size="sm" onClick={onBack}>
                <PencilLine aria-hidden="true" />
                Modifier ma réponse
              </Button>
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

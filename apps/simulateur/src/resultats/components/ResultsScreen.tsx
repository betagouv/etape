"use client";

import { useMemo, useState, type RefObject } from "react";

import { Button } from "@etape/ui/components/button";
import { Tabs, TabsContent } from "@etape/ui/components/tabs";

import { walkFlow } from "@/questionnaire/domain/flow";
import { regionFromAnswers } from "@/questionnaire/domain/regions";
import type { Answers } from "@/questionnaire/domain/types";

import { cepUrl } from "../domain/cep";
import { evaluateDevices, groupByTier, TIERS } from "../domain/eligibility";
import type { Tier } from "../domain/types";
import { AnswersRecap } from "./AnswersRecap";
import { DeviceCard } from "./DeviceCard";
import { EmptyResults } from "./EmptyResults";
import { ResultsTabs } from "./ResultsTabs";
import { RESULTS_TOP_ID, ScrollToTopButton } from "./ScrollToTopButton";

interface ResultsScreenProps {
  answers: Answers;
  onEdit: (questionId: string) => void;
  onRestart: () => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

const CONTAINER = "mx-auto w-full max-w-[1184px] px-4 md:px-10";

export function ResultsScreen({ answers, onEdit, onRestart, headingRef }: ResultsScreenProps) {
  const region = useMemo(() => regionFromAnswers(answers), [answers]);
  const grouped = useMemo(() => {
    const { flags } = walkFlow(answers);
    return groupByTier(evaluateDevices(flags, region));
  }, [answers, region]);

  const counts: Record<Tier, number> = {
    eligible: grouped.eligible.length,
    "sous-reserve": grouped["sous-reserve"].length,
    "non-eligible": grouped["non-eligible"].length,
  };
  const total = counts.eligible + counts["sous-reserve"] + counts["non-eligible"];
  const defaultTier = TIERS.find((tier) => counts[tier] > 0) ?? "eligible";
  const [active, setActive] = useState<Tier>(defaultTier);

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-border bg-background border-b">
        <div className={`${CONTAINER} flex flex-col gap-3 py-4 md:gap-4 md:py-16`}>
          <h1
            ref={headingRef}
            id={RESULTS_TOP_ID}
            tabIndex={-1}
            className="text-foreground focus-visible:outline-ring rounded-sm text-[28px] leading-9 font-bold focus-visible:outline-2 focus-visible:outline-offset-4 md:text-[32px] md:leading-10"
          >
            Résultats
          </h1>
          <p className="text-content-secondary max-w-3xl text-base leading-6 md:text-lg md:leading-7">
            Sur la base de vos réponses, voici tous les dispositifs analysés. Chacun est classé
            selon votre éligibilité, avec le motif et un accès direct à l’organisme.
          </p>
        </div>
      </header>

      {total === 0 ? (
        <div className={`${CONTAINER} flex flex-col gap-4 py-12 md:gap-8`}>
          <p className="text-content-secondary py-12 text-center text-base">
            Aucun dispositif n’a pu être analysé à partir de vos réponses. Essayez de les modifier.
          </p>
        </div>
      ) : (
        <Tabs
          value={active}
          onValueChange={(value) => setActive(value as Tier)}
          className="flex flex-1 flex-col gap-0"
        >
          <div className="border-border bg-background sticky top-0 z-10 border-b">
            <div className={`${CONTAINER} pt-3 md:pt-4`}>
              <ResultsTabs counts={counts} />
            </div>
          </div>

          {TIERS.map((tier) => (
            <TabsContent
              key={tier}
              value={tier}
              className={`${CONTAINER} flex flex-col gap-4 py-12 md:gap-8`}
            >
              {grouped[tier].length === 0 ? (
                <EmptyResults />
              ) : (
                grouped[tier].map((evaluated) => (
                  <DeviceCard key={evaluated.device.id} evaluated={evaluated} />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <section className="border-border bg-muted border-t">
        <div className={`${CONTAINER} py-12 md:py-14`}>
          <AnswersRecap answers={answers} onEdit={onEdit} />
        </div>
      </section>

      <footer className="border-border border-t">
        <div
          className={`${CONTAINER} flex flex-col items-center gap-6 pt-8 pb-24 text-center md:pb-8`}
        >
          <p className="text-muted-foreground max-w-2xl text-sm leading-6">
            Cet outil donne une orientation indicative, susceptible d’évoluer, et ne remplace pas
            l’accompagnement personnalisé et gratuit d’un{" "}
            <a
              href={cepUrl(region)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-content-accent font-semibold"
            >
              conseiller CEP
            </a>
            .
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onRestart}
            className="border-primary text-primary hover:bg-secondary hover:text-secondary-foreground min-h-11 w-full rounded-lg px-6 text-sm font-semibold sm:w-auto md:text-base"
          >
            Recommencer la simulation
          </Button>
        </div>
      </footer>

      <ScrollToTopButton />
    </main>
  );
}

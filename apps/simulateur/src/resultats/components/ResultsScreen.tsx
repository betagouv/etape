"use client";

import { useMemo, type RefObject } from "react";

import { Button } from "@etape/ui/components/button";

import type { Answers } from "@/questionnaire/domain/types";

import { cepUrl } from "../domain/cep";
import { buildProfil } from "../domain/profil";
import { selectResultats } from "../domain/selection";
import { AnswersRecap } from "./AnswersRecap";
import { EmptyResults } from "./EmptyResults";
import { ResultCard } from "./ResultCard";
import { RESULTS_TOP_ID, ScrollToTopButton } from "./ScrollToTopButton";

interface ResultsScreenProps {
  answers: Answers;
  onEdit: (questionId: string) => void;
  onRestart: () => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

const CONTAINER = "mx-auto w-full max-w-[1184px] px-4 md:px-10";

/** « 1 résultat correspond » / « 12 résultats correspondent ». */
function decompte(total: number): string {
  return total <= 1
    ? `${total} résultat correspond à votre situation`
    : `${total} résultats correspondent à votre situation`;
}

export function ResultsScreen({ answers, onEdit, onRestart, headingRef }: ResultsScreenProps) {
  const profil = useMemo(() => buildProfil(answers), [answers]);
  const resultats = useMemo(() => selectResultats(profil), [profil]);

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-border bg-background border-b">
        <div className={`${CONTAINER} flex flex-col gap-3 py-8 md:gap-4 md:py-16`}>
          <h1
            ref={headingRef}
            id={RESULTS_TOP_ID}
            tabIndex={-1}
            className="text-foreground focus-visible:outline-ring rounded-sm text-[28px] leading-9 font-bold focus-visible:outline-2 focus-visible:outline-offset-4 md:text-[32px] md:leading-10"
          >
            Résultats
          </h1>
          <p className="text-content-secondary max-w-3xl text-base leading-6 md:text-lg md:leading-7">
            Voici les interlocuteurs à contacter, les outils à votre disposition et les dispositifs
            qui correspondent à vos réponses. Rien n’est automatique&nbsp;: un conseiller vous
            aidera à choisir par où commencer.
          </p>
        </div>
      </header>

      <section aria-labelledby="resultats-decompte" className={`${CONTAINER} py-8 md:py-12`}>
        {resultats.length === 0 ? (
          <EmptyResults />
        ) : (
          <>
            <h2
              id="resultats-decompte"
              className="text-foreground mb-6 text-lg leading-7 font-bold md:mb-8"
            >
              {decompte(resultats.length)}
            </h2>
            <ul className="grid list-none grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resultats.map((resultat) => (
                <li key={resultat.id} className="h-full">
                  <ResultCard resultat={resultat} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

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
              href={cepUrl(profil.region)}
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

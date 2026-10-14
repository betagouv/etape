"use client";

import { useMemo, type RefObject } from "react";

import { BackToTop } from "@etape/ui/components/back-to-top";
import { Container } from "@etape/ui/components/container";
import { focusRing } from "@etape/ui/lib/focus";

import type { Answers, TextPart } from "@/questionnaire/domain/types";

import { buildPhraseRecapitulative } from "../domain/phrase-recapitulative";
import { buildProfil } from "../domain/profil";
import { buildRecap } from "../domain/recap";
import { selectResultats } from "../domain/selection";
import { AnswersRecap } from "./AnswersRecap";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { EmptyResults } from "./EmptyResults";
import { ResultsList } from "./ResultsList";

/** Cible du retour en haut : le titre de l'écran, focusable par programme. */
const RESULTATS_TOP_ID = "resultats-top";

interface ResultsScreenProps {
  answers: Answers;
  onEdit: (questionId: string) => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

/** « 1 résultat correspond » / « 12 résultats correspondent ». */
function decompte(total: number): string {
  return total <= 1
    ? `${total} résultat correspond à votre situation`
    : `${total} résultats correspondent à votre situation`;
}

function renderPart(part: TextPart, index: number) {
  if (typeof part === "string") return part;
  return (
    <span key={index} className="text-foreground font-medium">
      {part.emphasis}
    </span>
  );
}

export function ResultsScreen({ answers, onEdit, headingRef }: ResultsScreenProps) {
  const profil = useMemo(() => buildProfil(answers), [answers]);
  const resultats = useMemo(() => selectResultats(profil), [profil]);
  const recapEntries = useMemo(() => buildRecap(answers), [answers]);
  const phrase = useMemo(() => buildPhraseRecapitulative(answers), [answers]);

  return (
    <main className="bg-background md:bg-muted flex flex-1 flex-col">
      {/* Haut dans l'arbre : la sentinelle de `BackToTop` se place à son point d'insertion. */}
      <BackToTop
        targetId={RESULTATS_TOP_ID}
        label="Revenir en haut de la page"
        className="md:hidden"
      />

      <Container size="md" className="flex flex-col gap-6 pt-6 pb-24 md:pt-16 md:pb-16">
        <header className="flex flex-col gap-3">
          <h1
            ref={headingRef}
            id={RESULTATS_TOP_ID}
            tabIndex={-1}
            className={`font-heading text-heading-md text-foreground rounded-sm ${focusRing}`}
          >
            Les dispositifs accessibles avec votre profil
          </h1>
          <p className="text-muted-foreground text-body">{phrase.map(renderPart)}</p>

          {resultats.length > 0 && (
            <DownloadPdfButton resultats={resultats} recapEntries={recapEntries} />
          )}
        </header>

        <section aria-labelledby="resultats-decompte">
          {resultats.length === 0 ? (
            <EmptyResults />
          ) : (
            <>
              {/* Absent de la maquette : donne le décompte et tient la hiérarchie h1 > h2 > h3. */}
              <h2 id="resultats-decompte" className="sr-only">
                {decompte(resultats.length)}
              </h2>
              <ResultsList resultats={resultats} />
            </>
          )}
        </section>

        <AnswersRecap answers={answers} onEdit={onEdit} />
      </Container>
    </main>
  );
}

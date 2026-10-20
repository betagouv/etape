"use client";

import { CircleArrowDownIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { TooltipProvider } from "@etape/ui/components/tooltip";

import { INITIAL_RESULTAT_COUNT } from "../domain/selection";
import type { ResultatAffiche } from "../domain/types";
import { useVisibleResultats } from "../hooks/useVisibleResultats";
import { ResultCard } from "./ResultCard";

interface ResultsListProps {
  resultats: ResultatAffiche[];
}

export function ResultsList({ resultats }: ResultsListProps) {
  const { visibleResultats, hiddenCount, announcement, firstRevealedRef, showMore } =
    useVisibleResultats(resultats);

  return (
    <div className="flex flex-col gap-4">
      <TooltipProvider>
        <ul className="flex list-none flex-col gap-4">
          {visibleResultats.map((resultat, index) => (
            <li key={resultat.id}>
              <ResultCard
                resultat={resultat}
                headingRef={index === INITIAL_RESULTAT_COUNT ? firstRevealedRef : undefined}
              />
            </li>
          ))}
        </ul>
      </TooltipProvider>

      {hiddenCount > 0 && (
        <Button
          type="button"
          variant="ghost-primary"
          size="responsive-sm"
          onClick={showMore}
          className="self-center"
        >
          Afficher plus de résultats
          <CircleArrowDownIcon aria-hidden="true" />
        </Button>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

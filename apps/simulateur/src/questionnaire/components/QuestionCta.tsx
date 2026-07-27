"use client";

import { Button } from "@etape/ui/components/button";

interface QuestionCtaProps {
  isFirst: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
}

/** Barre d'actions : Précédent (désactivé sur la 1re question) / Suivant. */
export function QuestionCta({
  isFirst,
  canGoNext,
  onPrev,
  onNext,
  nextLabel = "Suivant",
}: QuestionCtaProps) {
  return (
    /*
     * Mobile — "DockedCTA" (Figma) : barre ancrée au bas de la zone défilante,
     * fond translucide + filet supérieur, boutons à largeur égale.
     * Desktop (md+) : simple ligne centrée au bas de la carte.
     */
    <div className="border-border bg-background/70 sticky bottom-0 mt-auto flex items-center gap-4 self-stretch border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm md:static md:justify-center md:border-0 md:bg-transparent md:px-0 md:pt-0 md:pb-12 md:backdrop-blur-none">
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={isFirst}
        onClick={onPrev}
        className="border-primary text-primary hover:bg-secondary hover:text-secondary-foreground min-h-11 flex-1 rounded-lg px-4 py-3 text-sm font-semibold md:flex-none md:py-2 md:text-base"
      >
        Précédent
      </Button>
      <Button
        type="button"
        size="lg"
        disabled={!canGoNext}
        onClick={onNext}
        className="min-h-11 flex-1 rounded-lg px-4 py-3 text-sm font-semibold md:flex-none md:py-2 md:text-base"
      >
        {nextLabel}
      </Button>
    </div>
  );
}

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
    // Conteneur CTA (Figma) : remplit la hauteur restante, boutons alignés en bas.
    <div className="flex flex-[1_0_0] items-end justify-center gap-4 self-stretch pb-12">
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={isFirst}
        onClick={onPrev}
        className="border-primary text-primary hover:bg-secondary hover:text-secondary-foreground min-h-11 rounded-lg px-4 text-base font-semibold"
      >
        Précédent
      </Button>
      <Button
        type="button"
        size="lg"
        disabled={!canGoNext}
        onClick={onNext}
        className="min-h-11 rounded-lg px-4 text-base font-semibold"
      >
        {nextLabel}
      </Button>
    </div>
  );
}

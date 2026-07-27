"use client";

import { Button } from "@etape/ui/components/button";

interface QuestionCtaProps {
  isFirst: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
}

const NEXT_HINT_ID = "question-cta-next-hint";

export function QuestionCta({
  isFirst,
  canGoNext,
  onPrev,
  onNext,
  nextLabel = "Suivant",
}: QuestionCtaProps) {
  return (
    <div className="border-border bg-background/70 sticky bottom-0 mt-auto flex items-center gap-4 self-stretch border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm md:justify-center md:border-0 md:px-0 md:pb-12">
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
        aria-disabled={!canGoNext}
        aria-describedby={canGoNext ? undefined : NEXT_HINT_ID}
        onClick={onNext}
        className="aria-disabled:hover:bg-primary min-h-11 flex-1 rounded-lg px-4 py-3 text-sm font-semibold aria-disabled:cursor-not-allowed aria-disabled:opacity-50 md:flex-none md:py-2 md:text-base"
      >
        {nextLabel}
      </Button>

      {!canGoNext && (
        <span id={NEXT_HINT_ID} className="sr-only">
          Sélectionne une réponse pour continuer.
        </span>
      )}
    </div>
  );
}

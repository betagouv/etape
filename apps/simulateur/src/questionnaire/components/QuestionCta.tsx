"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@etape/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@etape/ui/components/dialog";

interface QuestionCtaProps {
  isFirst: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
}

const NEXT_HINT_ID = "question-cta-next-hint";

// TODO (ticket dédié) : sur la 1re question, « Précédent » sort du simulateur,
// ce qui double le « Quitter » de la navbar. Et comme quitter ne détruit plus
// rien, la confirmation protège d'une perte qui n'existe pas. À trancher :
// soit « Précédent » redevient inerte, soit « Quitter » disparaît d'ici.
export function QuestionCta({
  isFirst,
  canGoNext,
  onPrev,
  onNext,
  nextLabel = "Suivant",
}: QuestionCtaProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="border-border bg-background/70 sticky bottom-0 mt-auto flex items-center gap-4 self-stretch border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm md:justify-center md:border-0 md:px-0 md:pb-12">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={isFirst ? () => setConfirmOpen(true) : onPrev}
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
          Répondez à la question pour continuer.
        </span>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quitter le simulateur ?</DialogTitle>
            <DialogDescription>
              C’est la première question : il n’y a pas d’étape précédente. Les réponses déjà
              saisies restent disponibles pour reprendre plus tard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="min-h-11">
                Rester sur le questionnaire
              </Button>
            </DialogClose>
            <Button type="button" className="min-h-11" onClick={() => router.push("/")}>
              Quitter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

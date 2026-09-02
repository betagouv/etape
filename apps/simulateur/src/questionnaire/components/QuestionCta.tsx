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
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
}

// TODO (ticket dédié) : sur la 1re question, « Précédent » sort du simulateur,
// ce qui double le « Quitter » de la navbar. Et comme quitter ne détruit plus
// rien, la confirmation protège d'une perte qui n'existe pas. À trancher :
// soit « Précédent » redevient inerte, soit « Quitter » disparaît d'ici.
/**
 * Les deux boutons de bas d'écran.
 *
 * « Suivant » est TOUJOURS actif, même quand la question n'est pas valide : un
 * bouton grisé ne dit ni ce qui manque ni quoi faire, il laisse croire à une
 * panne. C'est le clic qui répond — la navigation est retenue, le récapitulatif
 * d'erreurs s'affiche et le focus part sur le premier champ fautif. Le CTA n'a
 * donc pas à connaître la validité de l'écran.
 */
export function QuestionCta({ isFirst, onPrev, onNext, nextLabel = "Suivant" }: QuestionCtaProps) {
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
        onClick={onNext}
        className="min-h-11 flex-1 rounded-lg px-4 py-3 text-sm font-semibold md:flex-none md:py-2 md:text-base"
      >
        {nextLabel}
      </Button>

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

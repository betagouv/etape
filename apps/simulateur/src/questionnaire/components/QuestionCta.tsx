import { Button } from "@etape/ui/components/button";

interface QuestionCtaProps {
  isFirst: boolean;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

const NEXT_HINT_ID = "question-cta-next-hint";

/**
 * Les boutons de bas d'écran.
 *
 * « Précédent » n'apparaît qu'à partir de la 2e question : sur la 1re, il n'y a
 * pas d'étape avant, et un bouton qui ne peut que faire sortir du simulateur
 * doublerait le « Quitter » de la barre du haut.
 *
 * « Continuer » se grise tant qu'une réponse manque ou est invalide, mais reste
 * ACTIONNABLE : `aria-disabled` et non l'attribut `disabled`. Le grisé annonce
 * qu'il manque quelque chose ; le clic dit quoi — la navigation est retenue, le
 * message s'affiche en bas de la question et le focus part sur le premier champ
 * fautif. Un vrai `disabled` avalerait le clic, sortirait le bouton de l'ordre
 * de tabulation, et laisserait la personne sans explication.
 */
export function QuestionCta({
  isFirst,
  onPrev,
  onNext,
  nextLabel = "Continuer",
  nextDisabled = false,
}: QuestionCtaProps) {
  return (
    <div className="bg-background sticky bottom-0 mt-auto flex items-center gap-3 self-stretch px-6 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:static md:mt-10 md:justify-end md:bg-transparent md:p-0">
      {!isFirst && (
        <Button
          type="button"
          variant="outline"
          size="responsive"
          onClick={onPrev}
          className="flex-1 md:flex-none"
        >
          Précédent
        </Button>
      )}

      <Button
        type="button"
        size="responsive"
        aria-disabled={nextDisabled || undefined}
        aria-describedby={nextDisabled ? NEXT_HINT_ID : undefined}
        onClick={onNext}
        className="aria-disabled:hover:bg-primary flex-1 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 md:flex-none"
      >
        {nextLabel}
      </Button>

      {nextDisabled && (
        <span id={NEXT_HINT_ID} className="sr-only">
          Complétez ou corrigez votre réponse pour continuer.
        </span>
      )}
    </div>
  );
}

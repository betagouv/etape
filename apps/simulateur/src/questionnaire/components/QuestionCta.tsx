import { Button } from "@etape/ui/components/button";

interface QuestionCtaProps {
  isFirst: boolean;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
  /** Aucune réponse donnée : « Suivant » se grise (règle du ticket). */
  nextDisabled?: boolean;
}

const NEXT_HINT_ID = "question-cta-next-hint";

/**
 * Les boutons de bas d'écran.
 *
 * « Précédent » n'apparaît qu'à partir de la 2e question : sur la 1re, il n'y a
 * pas d'étape avant, et un bouton qui ne peut que faire sortir du simulateur
 * doublerait le « Quitter » de la navbar.
 *
 * « Suivant » se grise tant qu'aucune réponse n'est donnée, mais reste
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
  nextLabel = "Suivant",
  nextDisabled = false,
}: QuestionCtaProps) {
  return (
    <div className="border-border bg-background/70 sticky bottom-0 mt-auto flex items-center gap-4 self-stretch border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm md:justify-center md:border-0 md:px-0 md:pb-12">
      {!isFirst && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onPrev}
          className="border-primary text-primary hover:bg-secondary hover:text-secondary-foreground min-h-11 flex-1 rounded-lg px-4 py-3 text-sm font-semibold md:flex-none md:py-2 md:text-base"
        >
          Précédent
        </Button>
      )}

      <Button
        type="button"
        size="lg"
        aria-disabled={nextDisabled || undefined}
        aria-describedby={nextDisabled ? NEXT_HINT_ID : undefined}
        onClick={onNext}
        className="aria-disabled:hover:bg-primary min-h-11 flex-1 rounded-lg px-4 py-3 text-sm font-semibold aria-disabled:cursor-not-allowed aria-disabled:opacity-50 md:flex-none md:py-2 md:text-base"
      >
        {nextLabel}
      </Button>

      {nextDisabled && (
        <span id={NEXT_HINT_ID} className="sr-only">
          Répondez à la question pour continuer.
        </span>
      )}
    </div>
  );
}

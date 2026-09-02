import { Button } from "@etape/ui/components/button";

interface QuestionCtaProps {
  isFirst: boolean;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
}

/**
 * Les boutons de bas d'écran.
 *
 * « Précédent » n'apparaît qu'à partir de la 2e question : sur la 1re, il n'y a
 * pas d'étape avant, et un bouton qui ne peut que faire sortir du simulateur
 * doublerait le « Quitter » de la navbar.
 *
 * « Suivant » est TOUJOURS actif, même quand la question n'est pas valide : un
 * bouton grisé ne dit ni ce qui manque ni quoi faire, il laisse croire à une
 * panne. C'est le clic qui répond — la navigation est retenue, le récapitulatif
 * d'erreurs s'affiche et le focus part sur le premier champ fautif. Le CTA n'a
 * donc pas à connaître la validité de l'écran.
 */
export function QuestionCta({ isFirst, onPrev, onNext, nextLabel = "Suivant" }: QuestionCtaProps) {
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
        onClick={onNext}
        className="min-h-11 flex-1 rounded-lg px-4 py-3 text-sm font-semibold md:flex-none md:py-2 md:text-base"
      >
        {nextLabel}
      </Button>
    </div>
  );
}

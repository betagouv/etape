import { Button } from "@etape/ui/components/button";
import { keepFocus } from "@etape/ui/lib/keep-focus";
import { cn } from "@etape/ui/lib/utils";

/** Le bouton qui abandonne la saisie de la carte. */
interface FormCardActionsCancel {
  label: string;
  onClick: () => void;
}

/** Ce que reçoit `FormCardActions` : le bouton de validation, son état, et l'annulation s'il y en a une. */
interface FormCardActionsProps {
  /** Le bouton principal : « Valider la démarche ». */
  validateLabel: string;
  /** Faux tant que la saisie est incomplète : le bouton de validation est grisé. */
  isFilled: boolean;
  onValidate: () => void;
  /** Sans annulation possible, le bouton n'est pas affiché. */
  cancel?: FormCardActionsCancel;
  /** Mise en page seulement : marge, alignement. */
  className?: string;
}

/**
 * Les boutons du bas d'une carte de saisie (`Card` en variante `form`) : annuler, s'il y a
 * lieu, et valider (maquette FRONT-OFFICE, « Démarche 1 » et « Démarche 2 »).
 *
 * Grisé tant que la saisie est incomplète, le bouton de validation reste atteignable et
 * cliquable : `onValidate` montre alors ce qui manque. Un clic ne prend pas le focus au champ
 * en cours (`keepFocus`).
 */
function FormCardActions({
  validateLabel,
  isFilled,
  onValidate,
  cancel,
  className,
}: FormCardActionsProps) {
  return (
    <div
      data-slot="form-card-actions"
      className={cn("flex flex-wrap justify-end gap-4", className)}
    >
      {cancel && (
        <Button type="button" variant="secondary" onMouseDown={keepFocus} onClick={cancel.onClick}>
          {cancel.label}
        </Button>
      )}
      <Button type="button" aria-disabled={!isFilled} onMouseDown={keepFocus} onClick={onValidate}>
        {validateLabel}
      </Button>
    </div>
  );
}

export { FormCardActions };
export type { FormCardActionsCancel, FormCardActionsProps };

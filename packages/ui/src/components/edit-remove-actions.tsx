import * as React from "react";
import { PencilLineIcon, Trash2Icon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { cn } from "@etape/ui/lib/utils";

/** Le bouton qui rouvre l'élément en saisie. */
interface EditRemoveActionsEdit {
  /** Le libellé visible : « Modifier ». */
  label: string;
  /** Le nom accessible, qui dit quoi : « Modifier la démarche 1 ». Il commence par le libellé visible. */
  accessibleLabel: string;
  onClick: () => void;
  /** Vrai quand la modification doit attendre : le bouton est grisé, mais reste cliquable. */
  isDisabled?: boolean;
  /** L'`id` du texte qui dit pourquoi la modification doit attendre. */
  describedBy?: string;
}

/** Le bouton qui supprime l'élément : une corbeille, sans libellé visible. */
interface EditRemoveActionsRemove {
  /** Le nom accessible : « Supprimer la démarche 1 ». */
  accessibleLabel: string;
  onClick: () => void;
}

/** Ce que reçoit `EditRemoveActions` : ses deux boutons, leurs références et, au besoin, de la mise en page. */
interface EditRemoveActionsProps {
  edit: EditRemoveActionsEdit;
  remove: EditRemoveActionsRemove;
  /** Pour rendre le focus à « Modifier » quand la saisie se referme. */
  editRef?: React.Ref<HTMLButtonElement>;
  /** Pour rendre le focus à la corbeille quand la suppression est abandonnée. */
  removeRef?: React.Ref<HTMLButtonElement>;
  /** Mise en page seulement : marge, alignement. */
  className?: string;
}

/**
 * Les deux actions d'un élément déjà saisi, à droite de son titre : « Modifier » et la
 * corbeille (maquette FRONT-OFFICE, `front-office-form-card` d'une démarche validée).
 * Les textes viennent de l'écran, qui décide aussi de la suite : rouvrir la saisie, demander
 * confirmation avant de supprimer.
 */
function EditRemoveActions({
  edit,
  remove,
  editRef,
  removeRef,
  className,
}: EditRemoveActionsProps) {
  return (
    <div
      data-slot="edit-remove-actions"
      className={cn("flex shrink-0 items-center gap-2", className)}
    >
      <Button
        ref={editRef}
        type="button"
        variant="outline"
        aria-label={edit.accessibleLabel}
        aria-disabled={edit.isDisabled ?? false}
        aria-describedby={edit.describedBy}
        onClick={edit.onClick}
      >
        <PencilLineIcon aria-hidden="true" className="size-5" />
        {edit.label}
      </Button>
      <Button
        ref={removeRef}
        type="button"
        variant="outline"
        size="icon"
        aria-label={remove.accessibleLabel}
        onClick={remove.onClick}
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </div>
  );
}

export { EditRemoveActions };
export type { EditRemoveActionsEdit, EditRemoveActionsProps, EditRemoveActionsRemove };

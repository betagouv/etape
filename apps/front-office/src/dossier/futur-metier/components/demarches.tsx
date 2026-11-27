import { Fragment, useId } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { PlusIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { FieldDescription } from "@etape/ui/components/field";
import { FormCardActions } from "@etape/ui/components/form-card-actions";
import { FormRadioGroup } from "@etape/ui/components/form-radio-group";
import { StatusRegion } from "@etape/ui/components/status-region";

import { isOui, OUI_NON_LABEL } from "../../domain/oui-non";
import {
  formatDemarcheLabel,
  MAX_DEMARCHES_MESSAGE,
  EDIT_BLOCKED_MESSAGE,
} from "../domain/demarche";
import { useDemarches } from "../hooks/use-demarches";
import { FUTUR_METIER_FIELD, FUTUR_METIER_FIELD_LABEL, type FuturMetierFormData } from "../schema";
import { DemarcheCard } from "./demarche-card";
import { DemarcheFields } from "./demarche-fields";
import { DemarcheRemovalDialog } from "./demarche-removal-dialog";

/** Ce que reçoit `Demarches` : le formulaire du volet. */
export interface DemarchesProps {
  form: UseFormReturn<FuturMetierFormData>;
}

/**
 * La question sur les démarches de découverte et, après un « oui » : les démarches validées,
 * puis la carte de saisie ou, une fois celle-ci validée ou annulée, le bouton qui en ouvre une
 * autre (maquettes 09 à 13). Une démarche qu'on modifie redevient carte de saisie, à sa place ;
 * sa corbeille, comme un « non » quand des démarches sont validées, ouvre la fenêtre de
 * confirmation (maquettes 15 et 14).
 */
export function Demarches({ form }: DemarchesProps) {
  const limitId = useId();
  const demarcheDecouverte = useWatch({
    control: form.control,
    name: FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE,
  });
  const {
    demarches,
    hasCurrentDemarche,
    currentDemarcheId,
    currentDemarcheIndex,
    isCurrentDemarcheFilled,
    canAdd,
    canCancel,
    isHighlighted,
    blockedDemarcheId,
    announcement,
    addButtonRef,
    registerEditButton,
    registerRemoveButton,
    removal,
    isRemovalOpen,
    requestRemoval,
    changeAnswer,
    cancelRemoval,
    confirmRemoval,
    restoreFocusAfterRemoval,
    validateDemarche,
    addDemarche,
    editDemarche,
    cancelDemarche,
    removeHighlight,
  } = useDemarches(form);

  // Une seule saisie à la fois : à la place de la démarche qu'elle modifie, ou après les autres.
  const currentDemarche = hasCurrentDemarche && (
    <DemarcheFields
      control={form.control}
      title={formatDemarcheLabel(currentDemarcheIndex)}
      isHighlighted={isHighlighted}
      onFocusLeave={removeHighlight}
    >
      <FormCardActions
        validateLabel="Valider la démarche"
        isFilled={isCurrentDemarcheFilled}
        onValidate={validateDemarche}
        // La première démarche ne s'annule pas : on répond « non » (maquettes 10 et 13).
        cancel={canCancel ? { label: "Annuler", onClick: cancelDemarche } : undefined}
      />
    </DemarcheFields>
  );

  return (
    <>
      <FormRadioGroup
        name={FUTUR_METIER_FIELD.DEMARCHE_DECOUVERTE}
        control={form.control}
        label={FUTUR_METIER_FIELD_LABEL.demarcheDecouverte}
        description="Exemples : Immersion en entreprise, rencontres avec des professionnels, salons, recherches…"
        options={OUI_NON_LABEL}
        onValueChange={changeAnswer}
      />

      {isOui(demarcheDecouverte) && (
        <>
          {demarches.map((demarche, index) =>
            demarche.id === currentDemarcheId ? (
              <Fragment key={demarche.id}>{currentDemarche}</Fragment>
            ) : (
              <DemarcheCard
                key={demarche.id}
                index={index}
                demarche={demarche}
                edit={{
                  onClick: () => editDemarche(demarche),
                  isDisabled: hasCurrentDemarche,
                  notice: demarche.id === blockedDemarcheId ? EDIT_BLOCKED_MESSAGE : undefined,
                }}
                onRemove={() => requestRemoval(demarche)}
                editButtonRef={registerEditButton(demarche.id)}
                removeButtonRef={registerRemoveButton(demarche.id)}
              />
            ),
          )}

          {currentDemarcheId === null && currentDemarche}

          {!hasCurrentDemarche && (
            <div className="flex flex-col items-start gap-2">
              {/* Au maximum, le bouton reste atteignable et dit pourquoi il n'ajoute plus rien. */}
              <Button
                ref={addButtonRef}
                type="button"
                variant="outline"
                aria-disabled={!canAdd}
                aria-describedby={canAdd ? undefined : limitId}
                onClick={addDemarche}
              >
                <PlusIcon aria-hidden="true" className="size-5" />
                Ajouter une autre démarche
              </Button>
              {!canAdd && <FieldDescription id={limitId}>{MAX_DEMARCHES_MESSAGE}</FieldDescription>}
            </div>
          )}
        </>
      )}
      <DemarcheRemovalDialog
        isOpen={isRemovalOpen}
        removal={removal}
        onCancel={cancelRemoval}
        onConfirm={confirmRemoval}
        onCloseFocus={restoreFocusAfterRemoval}
      />
      <StatusRegion message={announcement} />
    </>
  );
}

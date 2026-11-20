import { Fragment, useId } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { PlusIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { FormCardActions } from "@etape/ui/components/form-card-actions";
import { StatusRegion } from "@etape/ui/components/status-region";

import { OUI_NON } from "../../domain/oui-non";
import {
  formatDemarcheLabel,
  MESSAGE_NOMBRE_MAX_DEMARCHES,
  MESSAGE_SAISIE_EN_COURS,
} from "../domain/demarche";
import { useDemarches } from "../hooks/use-demarches";
import type { FuturMetierFormData } from "../schema";
import { DemarcheCard } from "./demarche-card";
import { DemarcheFields } from "./demarche-fields";

/** Ce que reçoit `Demarches` : le formulaire du volet. */
export interface DemarchesProps {
  form: UseFormReturn<FuturMetierFormData>;
}

/**
 * Après un « oui » : les démarches validées, puis la carte de saisie ou, une fois celle-ci
 * validée ou annulée, le bouton qui en ouvre une autre (maquettes 10 à 13). Une démarche qu'on
 * modifie redevient carte de saisie, à sa place.
 */
export function Demarches({ form }: DemarchesProps) {
  const limitId = useId();
  const demarcheDecouverte = useWatch({ control: form.control, name: "demarcheDecouverte" });
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
      {demarcheDecouverte === OUI_NON.OUI && (
        <>
          {demarches.map((demarche, index) =>
            demarche.id === currentDemarcheId ? (
              <Fragment key={demarche.id}>{currentDemarche}</Fragment>
            ) : (
              <DemarcheCard
                key={demarche.id}
                index={index}
                demarche={demarche}
                editButtonRef={registerEditButton(demarche.id)}
                onEdit={() => editDemarche(demarche)}
                isEditDisabled={hasCurrentDemarche}
                editNotice={demarche.id === blockedDemarcheId ? MESSAGE_SAISIE_EN_COURS : undefined}
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
                size="form"
                aria-disabled={!canAdd}
                aria-describedby={canAdd ? undefined : limitId}
                onClick={addDemarche}
              >
                <PlusIcon aria-hidden="true" className="size-5" />
                Ajouter une autre démarche
              </Button>
              {!canAdd && (
                <p id={limitId} className="text-muted-foreground text-sm">
                  {MESSAGE_NOMBRE_MAX_DEMARCHES}
                </p>
              )}
            </div>
          )}
        </>
      )}
      <StatusRegion message={announcement} />
    </>
  );
}

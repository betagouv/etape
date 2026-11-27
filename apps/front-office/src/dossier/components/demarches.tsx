import { Fragment, useId } from "react";
import type { Control, FieldValues } from "react-hook-form";
import { PlusIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { FieldDescription } from "@etape/ui/components/field";
import { FormCardActions } from "@etape/ui/components/form-card-actions";
import { FormRadioGroup } from "@etape/ui/components/form-radio-group";
import { StatusRegion } from "@etape/ui/components/status-region";

import {
  EDIT_BLOCKED_MESSAGE,
  findDemarcheIntitule,
  formatDemarcheLabel,
  MAX_DEMARCHES_MESSAGE,
} from "../domain/demarche";
import { OUI_NON_LABEL } from "../domain/oui-non";
import type { DemarchesFieldNames, UseDemarchesResult } from "../hooks/use-demarches";
import { DemarcheCard } from "./demarche-card";
import { DemarcheFields } from "./demarche-fields";
import { DemarcheRemovalDialog } from "./demarche-removal-dialog";

/** La question du volet qui ouvre ses démarches. */
export interface DemarchesQuestion {
  label: string;
  description?: string;
}

/** Ce que reçoit `Demarches` : le formulaire du volet et ses champs, sa question, ses types de démarche et l'état de ses démarches. */
export interface DemarchesProps<TFieldValues extends FieldValues, TType extends string> {
  control: Control<TFieldValues>;
  fields: DemarchesFieldNames<TFieldValues, TType>;
  question: DemarchesQuestion;
  /** Le libellé de chaque type de la liste du volet, dans l'ordre d'affichage. */
  typeLabels: Record<TType, string>;
  /** Ce que rend `useDemarches`, appelé par le volet. */
  state: UseDemarchesResult<TType>;
}

/**
 * La question sur les démarches d'un volet et, après un « oui » : les démarches validées, puis
 * la carte de saisie ou, une fois celle-ci validée ou annulée, le bouton qui en ouvre une autre
 * (maquettes 09 à 13 de « Mon futur métier »). Une démarche qu'on modifie redevient carte de
 * saisie, à sa place ; sa corbeille, comme un « non » quand des démarches sont validées, ouvre
 * la fenêtre de confirmation (maquettes 15 et 14).
 */
export function Demarches<TFieldValues extends FieldValues, TType extends string>({
  control,
  fields,
  question,
  typeLabels,
  state,
}: DemarchesProps<TFieldValues, TType>) {
  const limitId = useId();
  const {
    isAnswerOui,
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
  } = state;

  // Une seule saisie à la fois : à la place de la démarche qu'elle modifie, ou après les autres.
  const currentDemarche = hasCurrentDemarche && (
    <DemarcheFields
      control={control}
      fields={fields}
      typeLabels={typeLabels}
      title={formatDemarcheLabel(currentDemarcheIndex)}
      highlight={{ isActive: isHighlighted, onFocusLeave: removeHighlight }}
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
        name={fields.answer}
        control={control}
        label={question.label}
        description={question.description}
        options={OUI_NON_LABEL}
        onValueChange={changeAnswer}
      />

      {isAnswerOui && (
        <>
          {demarches.map((demarche, index) =>
            demarche.id === currentDemarcheId ? (
              <Fragment key={demarche.id}>{currentDemarche}</Fragment>
            ) : (
              <DemarcheCard
                key={demarche.id}
                index={index}
                demarche={demarche}
                intitule={findDemarcheIntitule(demarche, typeLabels)}
                edit={{
                  onClick: () => editDemarche(demarche),
                  isDisabled: hasCurrentDemarche,
                  notice: demarche.id === blockedDemarcheId ? EDIT_BLOCKED_MESSAGE : undefined,
                  buttonRef: registerEditButton(demarche.id),
                }}
                remove={{
                  onClick: () => requestRemoval(demarche),
                  buttonRef: registerRemoveButton(demarche.id),
                }}
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
        typeLabels={typeLabels}
        onCancel={cancelRemoval}
        onConfirm={confirmRemoval}
        onCloseFocus={restoreFocusAfterRemoval}
      />
      <StatusRegion message={announcement} />
    </>
  );
}

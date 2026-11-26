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
  const { isAnswerOui, changeAnswer, announcement, currentDemarche, list, removalDialog } = state;
  const { addButtonRef } = list;

  // Une seule saisie à la fois : à la place de la démarche qu'elle modifie, ou après les autres.
  const currentDemarcheCard = currentDemarche.isOpen && (
    <DemarcheFields
      control={control}
      fields={fields}
      typeLabels={typeLabels}
      title={formatDemarcheLabel(currentDemarche.index)}
      highlight={{
        isActive: currentDemarche.isHighlighted,
        onFocusLeave: currentDemarche.removeHighlight,
      }}
    >
      <FormCardActions
        validateLabel="Valider la démarche"
        isFilled={currentDemarche.isFilled}
        onValidate={currentDemarche.validate}
        // La première démarche ne s'annule pas : on répond « non » (maquettes 10 et 13).
        cancel={
          currentDemarche.canCancel
            ? { label: "Annuler", onClick: currentDemarche.cancel }
            : undefined
        }
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
          {list.demarches.map((demarche, index) =>
            demarche.id === currentDemarche.demarcheId ? (
              <Fragment key={demarche.id}>{currentDemarcheCard}</Fragment>
            ) : (
              <DemarcheCard
                key={demarche.id}
                index={index}
                demarche={demarche}
                intitule={findDemarcheIntitule(demarche, typeLabels)}
                edit={{
                  onClick: () => list.edit(demarche),
                  isDisabled: currentDemarche.isOpen,
                  notice: demarche.id === list.blockedDemarcheId ? EDIT_BLOCKED_MESSAGE : undefined,
                  buttonRef: list.registerEditButton(demarche.id),
                }}
                remove={{
                  onClick: () => removalDialog.requestRemoval(demarche),
                  buttonRef: removalDialog.registerRemoveButton(demarche.id),
                }}
              />
            ),
          )}

          {currentDemarche.demarcheId === null && currentDemarcheCard}

          {!currentDemarche.isOpen && (
            <div className="flex flex-col items-start gap-2">
              {/* Au maximum, le bouton reste atteignable et dit pourquoi il n'ajoute plus rien. */}
              <Button
                ref={addButtonRef}
                type="button"
                variant="outline"
                aria-disabled={!list.canAdd}
                aria-describedby={list.canAdd ? undefined : limitId}
                onClick={list.add}
              >
                <PlusIcon aria-hidden="true" className="size-5" />
                Ajouter une autre démarche
              </Button>
              {!list.canAdd && (
                <FieldDescription id={limitId}>{MAX_DEMARCHES_MESSAGE}</FieldDescription>
              )}
            </div>
          )}
        </>
      )}
      <DemarcheRemovalDialog
        isOpen={removalDialog.isRemovalOpen}
        removal={removalDialog.removal}
        typeLabels={typeLabels}
        onCancel={removalDialog.cancelRemoval}
        onConfirm={removalDialog.confirmRemoval}
        onCloseFocus={removalDialog.restoreFocusAfterRemoval}
      />
      <StatusRegion message={announcement} />
    </>
  );
}

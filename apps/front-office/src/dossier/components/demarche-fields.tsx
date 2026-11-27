import { useId, type ReactNode } from "react";
import { Controller, useWatch, type Control, type FieldValues } from "react-hook-form";

import { Card, CardDescription, CardTitle } from "@etape/ui/components/card";
import { FormField } from "@etape/ui/components/form-field";
import { FormSelect } from "@etape/ui/components/form-select";
import { Input } from "@etape/ui/components/input";
import { useFocusLeave } from "@etape/ui/hooks/use-focus-leave";

import {
  DEMARCHE_FIELD_LABEL,
  isPrecisionRequired,
  PIECES_DEMARCHE_DESCRIPTION,
} from "../domain/demarche";
import { LONGUEUR_MAX_TEXTE } from "../domain/longueur-max-texte";
import type { DemarchesFieldNames } from "../hooks/use-demarches";
import { CharacterCountField } from "./character-count-field";
import { PiecesJustificativesField } from "./pieces-justificatives-field";

/** La surbrillance de la carte qui vient de s'ouvrir, jusqu'à ce que le focus la quitte (maquette 13). */
export interface DemarcheFieldsHighlight {
  isActive: boolean;
  onFocusLeave: () => void;
}

/** Ce que reçoit `DemarcheFields` : le formulaire du volet et ses champs, les types proposés, le titre de la carte, sa surbrillance et ses boutons. */
export interface DemarcheFieldsProps<TFieldValues extends FieldValues, TType extends string> {
  control: Control<TFieldValues>;
  fields: DemarchesFieldNames<TFieldValues, TType>;
  /** Le libellé de chaque type de la liste du volet, dans l'ordre d'affichage. */
  typeLabels: Record<TType, string>;
  title: string;
  highlight: DemarcheFieldsHighlight;
  /** Les boutons du bas de la carte : `FormCardActions`. */
  children: ReactNode;
}

/** La démarche en cours de saisie : son type, précisé pour « Autre », ce qu'elle a apporté et ses justificatifs. */
export function DemarcheFields<TFieldValues extends FieldValues, TType extends string>({
  control,
  fields,
  typeLabels,
  title,
  highlight,
  children,
}: DemarcheFieldsProps<TFieldValues, TType>) {
  const focusLeave = useFocusLeave(highlight.onFocusLeave);
  const titleId = useId();
  const typeDemarche = useWatch({ control, name: fields.typeDemarche });

  return (
    <Card
      variant="form"
      role="group"
      aria-labelledby={titleId}
      data-highlighted={highlight.isActive}
      {...focusLeave}
    >
      <div className="flex flex-col gap-2">
        <CardTitle variant="label" asChild>
          <h4 id={titleId}>{title}</h4>
        </CardTitle>
        <CardDescription>
          Vous pourrez déposer les comptes-rendus de vos démarches dans «&nbsp;Mes documents&nbsp;».
        </CardDescription>
      </div>

      <div className="flex flex-col gap-5">
        <FormSelect
          name={fields.typeDemarche}
          control={control}
          label={DEMARCHE_FIELD_LABEL.typeDemarche}
          required
          options={typeLabels}
        />

        {isPrecisionRequired(typeDemarche) && (
          <FormField
            name={fields.precisionTypeDemarche}
            control={control}
            label={DEMARCHE_FIELD_LABEL.precisionTypeDemarche}
            required
            render={({ field, attributes }) => <Input {...field} {...attributes} />}
          />
        )}

        <CharacterCountField
          name={fields.apportDemarche}
          control={control}
          label={DEMARCHE_FIELD_LABEL.apportDemarche}
          required
          description="Ce que vous avez appris sur vous ou sur votre projet."
          maxLength={LONGUEUR_MAX_TEXTE}
        />

        <Controller
          name={fields.piecesJustificatives}
          control={control}
          render={({ field }) => (
            <PiecesJustificativesField
              pieces={field.value}
              onChange={field.onChange}
              title={DEMARCHE_FIELD_LABEL.piecesJustificatives}
              description={PIECES_DEMARCHE_DESCRIPTION}
            />
          )}
        />
      </div>

      {children}
    </Card>
  );
}

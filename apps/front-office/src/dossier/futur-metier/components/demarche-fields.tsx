import { useId, type ReactNode } from "react";
import { Controller, useWatch, type Control } from "react-hook-form";

import { Card, CardDescription, CardTitle } from "@etape/ui/components/card";
import { FormField } from "@etape/ui/components/form-field";
import { FormSelect } from "@etape/ui/components/form-select";
import { Input } from "@etape/ui/components/input";
import { useFocusLeave } from "@etape/ui/hooks/use-focus-leave";

import { CharacterCountField } from "../../components/character-count-field";
import { PiecesJustificativesField } from "../../components/pieces-justificatives-field";
import {
  PIECES_DEMARCHE_DESCRIPTION,
  TYPE_DEMARCHE,
  TYPE_DEMARCHE_LABEL,
} from "../domain/demarche";
import {
  FUTUR_METIER_FIELD,
  FUTUR_METIER_FIELD_LABEL,
  FUTUR_METIER_TEXT_MAX_LENGTH,
  type FuturMetierFormData,
} from "../schema";

/** Ce que reçoit `DemarcheFields` : le contrôle du formulaire, le titre de la carte, sa surbrillance et ses boutons. */
export interface DemarcheFieldsProps {
  control: Control<FuturMetierFormData>;
  title: string;
  /** Vrai quand la carte vient de s'ouvrir : elle ressort, jusqu'à ce que le focus la quitte (maquette 13). */
  isHighlighted: boolean;
  onFocusLeave: () => void;
  /** Les boutons du bas de la carte : `FormCardActions`. */
  children: ReactNode;
}

/** La démarche en cours de saisie : son type, précisé pour « Autre », ce qu'elle a apporté et ses justificatifs. */
export function DemarcheFields({
  control,
  title,
  isHighlighted,
  onFocusLeave,
  children,
}: DemarcheFieldsProps) {
  const focusLeave = useFocusLeave(onFocusLeave);
  const titleId = useId();
  const typeDemarche = useWatch({ control, name: FUTUR_METIER_FIELD.TYPE_DEMARCHE });

  return (
    <Card
      variant="form"
      role="group"
      aria-labelledby={titleId}
      data-highlighted={isHighlighted}
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
          name={FUTUR_METIER_FIELD.TYPE_DEMARCHE}
          control={control}
          label={FUTUR_METIER_FIELD_LABEL.typeDemarche}
          required
          options={TYPE_DEMARCHE_LABEL}
        />

        {typeDemarche === TYPE_DEMARCHE.AUTRE && (
          <FormField
            name={FUTUR_METIER_FIELD.PRECISION_TYPE_DEMARCHE}
            control={control}
            label={FUTUR_METIER_FIELD_LABEL.precisionTypeDemarche}
            required
            render={({ field, attributes }) => <Input {...field} {...attributes} />}
          />
        )}

        <CharacterCountField
          name={FUTUR_METIER_FIELD.APPORT_DEMARCHE}
          control={control}
          label={FUTUR_METIER_FIELD_LABEL.apportDemarche}
          required
          description="Ce que vous avez appris sur vous ou sur votre projet."
          maxLength={FUTUR_METIER_TEXT_MAX_LENGTH}
        />

        <Controller
          name={FUTUR_METIER_FIELD.PIECES_JUSTIFICATIVES}
          control={control}
          render={({ field }) => (
            <PiecesJustificativesField
              pieces={field.value}
              onChange={field.onChange}
              title={FUTUR_METIER_FIELD_LABEL.piecesJustificatives}
              description={PIECES_DEMARCHE_DESCRIPTION}
            />
          )}
        />
      </div>

      {children}
    </Card>
  );
}

import type { Control, FieldPathByValue, FieldValues } from "react-hook-form";

import { CharacterCountTextarea } from "@etape/ui/components/character-count-textarea";
import { FormField } from "@etape/ui/components/form-field";

import {
  formatCharacterCount,
  formatCharacterCountAnnouncement,
} from "../domain/format-character-count";

/** Ce que reçoit `CharacterCountField` : un champ texte du formulaire, son libellé, son aide et sa limite. */
export interface CharacterCountFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
> {
  name: TName;
  control: Control<TFieldValues>;
  label: string;
  description: string;
  maxLength: number;
  required?: boolean;
}

/** Une zone de texte limitée d'un volet, avec son compteur de caractères. */
export function CharacterCountField<
  TFieldValues extends FieldValues,
  TName extends FieldPathByValue<TFieldValues, string>,
>({
  name,
  control,
  label,
  description,
  maxLength,
  required,
}: CharacterCountFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      name={name}
      control={control}
      label={label}
      required={required}
      description={description}
      render={({ field, attributes }) => (
        <CharacterCountTextarea
          {...field}
          {...attributes}
          maxLength={maxLength}
          countLabel={formatCharacterCount(field.value.length, maxLength)}
          countAnnouncement={formatCharacterCountAnnouncement(field.value.length, maxLength)}
        />
      )}
    />
  );
}

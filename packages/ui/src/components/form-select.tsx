"use client";

import * as React from "react";
import type { Control, FieldPath, FieldPathValue, FieldValues } from "react-hook-form";

import { FormField } from "@etape/ui/components/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@etape/ui/components/select";
import { isOptionValue } from "@etape/ui/lib/option-value";

/** Une valeur que le champ `TName` peut prendre, parmi celles qu'on propose en options. */
type OptionValue<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = Extract<
  FieldPathValue<TFieldValues, TName>,
  string
>;

/** Ce que reçoit `FormSelect` : le champ du formulaire, son libellé, son aide et ses options. */
interface FormSelectProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  name: TName;
  control: Control<TFieldValues>;
  label: React.ReactNode;
  required?: boolean;
  description?: React.ReactNode;
  /** Le libellé de chaque valeur du champ, dans l'ordre d'affichage. */
  options: Record<OptionValue<TFieldValues, TName>, string>;
}

/**
 * Liste de choix react-hook-form, sous son libellé : le pendant de `FormField` pour un choix
 * unique dans une liste, comme `FormRadioGroup` l'est pour des boutons radio. L'`id` du champ
 * est son `name`, pour que le résumé d'erreurs de l'écran puisse y mener par un lien.
 */
function FormSelect<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  name,
  control,
  label,
  required = false,
  description,
  options,
}: FormSelectProps<TFieldValues, TName>) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <FormField
      name={name}
      control={control}
      label={label}
      required={required}
      description={description}
      render={({ field, attributes }) => (
        <Select
          value={typeof field.value === "string" ? field.value : ""}
          onValueChange={(value) => {
            // Radix rend la valeur choisie en `string` : on la ramène au type du champ.
            if (isOptionValue(options, value)) field.onChange(value);
          }}
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <SelectTrigger
            {...attributes}
            ref={field.ref}
            size="field"
            className="w-full"
            aria-required={required}
            // Liste ouverte, le focus part dans la liste sans quitter le champ.
            onBlur={() => {
              if (!isOpen) field.onBlur();
            }}
          >
            <SelectValue />
          </SelectTrigger>
          {/* À la largeur du champ : sur un petit écran, un libellé long passe à la ligne au lieu de sortir de la page. */}
          <SelectContent
            position="popper"
            size="form"
            className="w-[var(--radix-select-trigger-width)]"
          >
            {Object.entries<string>(options).map(([value, optionLabel]) => (
              <SelectItem key={value} value={value}>
                {optionLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

export { FormSelect };
export type { FormSelectProps };

"use client";

import * as React from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { FieldError, FieldLegend, FieldSet } from "@etape/ui/components/field";
import { Label } from "@etape/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@etape/ui/components/radio-group";

/** Ce que reçoit `FormRadioGroup` : le champ du formulaire, sa légende et ses options. */
interface FormRadioGroupProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  name: TName;
  control: Control<TFieldValues>;
  label: React.ReactNode;
  /** Le libellé de chaque valeur, dans l'ordre d'affichage. */
  options: Record<string, string>;
  /** Appelé après le choix, pour ce qui en dépend ailleurs dans le formulaire. */
  onValueChange?: (value: string) => void;
}

/**
 * Groupe de boutons radio react-hook-form, obligatoire, sous sa légende : le pendant de
 * `FormField` pour un choix unique. L'`id` du groupe est son `name`, pour que le résumé
 * d'erreurs de l'écran puisse y mener par un lien ; celui de chaque bouton, `<name>-<valeur>`.
 */
function FormRadioGroup<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  name,
  control,
  label,
  options,
  onValueChange,
}: FormRadioGroupProps<TFieldValues, TName>) {
  const legendId = `${name}-legend`;
  const errorId = `${name}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldSet>
          <FieldLegend id={legendId} variant="label" required>
            {label}
          </FieldLegend>
          <RadioGroup
            id={name}
            value={typeof field.value === "string" ? field.value : ""}
            onValueChange={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
            // Les flèches déplacent le focus d'un bouton à l'autre : on ne sort qu'en quittant le groupe.
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) field.onBlur();
            }}
            className="flex gap-5"
            required
            // La légende nomme le `fieldset`, pas le `radiogroup` de Radix.
            aria-labelledby={legendId}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.invalid ? errorId : undefined}
          >
            {Object.entries(options).map(([value, optionLabel], index) => (
              <div key={value} className="flex items-center gap-2">
                <RadioGroupItem
                  value={value}
                  id={`${name}-${value}`}
                  aria-invalid={fieldState.invalid}
                  // Un seul élément peut porter le ref du champ : le premier bouton radio.
                  ref={index === 0 ? field.ref : undefined}
                />
                <Label htmlFor={`${name}-${value}`}>{optionLabel}</Label>
              </div>
            ))}
          </RadioGroup>
          {fieldState.error && <FieldError id={errorId} errors={[fieldState.error]} />}
        </FieldSet>
      )}
    />
  );
}

export { FormRadioGroup };
export type { FormRadioGroupProps };

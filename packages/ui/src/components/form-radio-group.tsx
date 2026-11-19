"use client";

import * as React from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from "react-hook-form";

import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@etape/ui/components/field";
import { Label } from "@etape/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@etape/ui/components/radio-group";
import { joinIds } from "@etape/ui/lib/join-ids";
import { isOptionValue } from "@etape/ui/lib/option-value";

/** Une valeur que le champ `TName` peut prendre, parmi celles qu'on propose en options. */
type OptionValue<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = Extract<
  FieldPathValue<TFieldValues, TName>,
  string
>;

/** Ce que reçoit `FormRadioGroup` : le champ du formulaire, sa légende et ses options. */
interface FormRadioGroupProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  name: TName;
  control: Control<TFieldValues>;
  label: React.ReactNode;
  /** Aide affichée sous la légende ; elle reste en place quand le groupe est en erreur. */
  description?: React.ReactNode;
  /** Le libellé de chaque valeur du champ, dans l'ordre d'affichage. */
  options: Record<OptionValue<TFieldValues, TName>, string>;
  /** Appelé après le choix, pour ce qui en dépend ailleurs dans le formulaire. */
  onValueChange?: (value: OptionValue<TFieldValues, TName>) => void;
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
  description,
  options,
  onValueChange,
}: FormRadioGroupProps<TFieldValues, TName>) {
  const legendId = `${name}-legend`;
  const descriptionId = `${name}-description`;
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
          {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
          <RadioGroup
            id={name}
            value={typeof field.value === "string" ? field.value : ""}
            onValueChange={(value) => {
              // Radix rend la valeur cochée en `string` : on la ramène au type du champ.
              if (!isOptionValue(options, value)) return;
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
            // L'aide d'abord, puis l'erreur.
            aria-describedby={joinIds([
              Boolean(description) && descriptionId,
              fieldState.invalid && errorId,
            ])}
          >
            {Object.entries<string>(options).map(([value, optionLabel], index) => (
              // 24 px de haut, comme la ligne d'un bouton radio du kit.
              <div key={value} className="flex min-h-6 items-center gap-2">
                <RadioGroupItem
                  value={value}
                  id={`${name}-${value}`}
                  aria-invalid={fieldState.invalid}
                  // Un seul élément peut porter le ref du champ : le premier bouton radio.
                  ref={index === 0 ? field.ref : undefined}
                />
                {/* Texte courant, comme l'option d'un bouton radio du kit : seule la légende est en gras. */}
                <Label htmlFor={`${name}-${value}`} className="font-normal">
                  {optionLabel}
                </Label>
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

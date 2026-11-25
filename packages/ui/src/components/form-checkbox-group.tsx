"use client";

import * as React from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from "react-hook-form";

import { Checkbox } from "@etape/ui/components/checkbox";
import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@etape/ui/components/field";
import { Label } from "@etape/ui/components/label";
import { joinIds } from "@etape/ui/lib/join-ids";
import { formatOptionId } from "@etape/ui/lib/option-id";
import { isOptionValue } from "@etape/ui/lib/option-value";
import { toggleOptionValue } from "@etape/ui/lib/toggle-option";

/** Une valeur que le tableau du champ `TName` peut contenir, parmi celles qu'on propose en options. */
type OptionValue<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> =
  FieldPathValue<TFieldValues, TName> extends readonly (infer TValue)[]
    ? Extract<TValue, string>
    : never;

/** Ce que reçoit `FormCheckboxGroup` : le champ du formulaire, sa légende et ses options. */
interface FormCheckboxGroupProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  name: TName;
  control: Control<TFieldValues>;
  label: React.ReactNode;
  /** Aide affichée sous les cases (« Plusieurs réponses possibles. ») ; elle reste en place en erreur. */
  description?: React.ReactNode;
  /** Le libellé de chaque valeur du champ, dans l'ordre d'affichage. */
  options: Record<OptionValue<TFieldValues, TName>, string>;
  /** Mise en page seulement ; fusionné par `cn()` dans `FieldSet`. */
  className?: string;
}

/**
 * Groupe de cases à cocher react-hook-form, obligatoire, sous sa légende : le pendant de
 * `FormRadioGroup` pour plusieurs réponses. La valeur du champ est le tableau des valeurs cochées,
 * dans l'ordre des options. L'`id` du groupe est son `name`, pour que le résumé d'erreurs de
 * l'écran puisse y mener par un lien ; celui de chaque case, `<name>-<valeur>`.
 */
function FormCheckboxGroup<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  description,
  options,
  className,
}: FormCheckboxGroupProps<TFieldValues, TName>) {
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const fieldValues: unknown[] = Array.isArray(field.value) ? field.value : [];
        const values = fieldValues.filter(
          (value): value is OptionValue<TFieldValues, TName> =>
            typeof value === "string" && isOptionValue(options, value),
        );
        // Le fieldset ne porte pas `aria-describedby` de façon fiable : chaque case le reçoit.
        const describedBy = joinIds([
          Boolean(description) && descriptionId,
          fieldState.invalid && errorId,
        ]);

        return (
          <FieldSet data-slot="form-checkbox-group" className={className}>
            <FieldLegend variant="label" required>
              {label}
            </FieldLegend>
            <div
              id={name}
              data-slot="checkbox-group"
              className="flex flex-wrap gap-x-5 gap-y-2 outline-none"
              // Cible du lien du résumé d'erreurs : le focus qu'il y pose passe à la première case,
              // comme Radix le fait pour un groupe radio.
              tabIndex={-1}
              onFocus={(event) => {
                if (event.target !== event.currentTarget) return;
                event.currentTarget.querySelector<HTMLElement>("[data-slot=checkbox]")?.focus();
              }}
              // Le focus passe d'une case à l'autre : on ne quitte le champ qu'en quittant le groupe.
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) field.onBlur();
              }}
            >
              {Object.entries<string>(options).map(([value, optionLabel], index) => (
                // 20 px de haut, comme la ligne d'une case dans la maquette du volet « Ma formation ».
                <div key={value} className="flex min-h-5 items-center gap-2">
                  <Checkbox
                    id={formatOptionId(name, value)}
                    checked={values.some((checked) => checked === value)}
                    onCheckedChange={(state) => {
                      if (!isOptionValue(options, value)) return;
                      const next = toggleOptionValue(options, values, value, state === true);
                      field.onChange(next);
                    }}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={describedBy}
                    // Un seul élément peut porter le ref du champ : la première case.
                    ref={index === 0 ? field.ref : undefined}
                  />
                  {/* Texte courant, comme l'option d'une case du kit : seule la légende est en gras. */}
                  <Label htmlFor={formatOptionId(name, value)} className="font-normal">
                    {optionLabel}
                  </Label>
                </div>
              ))}
            </div>
            {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
            {fieldState.error && <FieldError id={errorId} errors={[fieldState.error]} />}
          </FieldSet>
        );
      }}
    />
  );
}

export { FormCheckboxGroup };
export type { FormCheckboxGroupProps };

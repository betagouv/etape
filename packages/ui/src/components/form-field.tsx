"use client";

import * as React from "react";
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@etape/ui/components/field";

interface FormFieldAttributes {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FormFieldRenderProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  attributes: FormFieldAttributes;
}

interface FormFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  name: TName;
  control: Control<TFieldValues>;
  label: React.ReactNode;
  required?: boolean;
  description?: React.ReactNode;
  render: (props: FormFieldRenderProps<TFieldValues, TName>) => React.ReactNode;
}

/**
 * Champ react-hook-form mis en forme par `Field`. Relie le libellé, la description
 * et l'erreur au contrôle par `attributes` ; l'erreur remplace la description, comme
 * dans le kit. L'`id` du contrôle est son `name`, pour que le résumé d'erreurs de
 * l'écran puisse y mener par un lien.
 *
 * - Contrôle natif : `render={({ field, attributes }) => <Input {...field} {...attributes} />}`.
 * - Contrôle Radix : brancher la valeur à la main, les attributs sur l'élément focalisable :
 *   `<Select value={field.value} onValueChange={field.onChange}>` puis
 *   `<SelectTrigger ref={field.ref} {...attributes}>`.
 * - Groupe de choix (radios, cases) : pas de `FormField`, dont le `<label>` ne peut
 *   nommer un groupe ; passer par `FieldSet` et `FieldLegend`.
 *
 * Le focus des erreurs revient à l'écran : `useForm({ shouldFocusError: false })`, puis
 * focus sur son résumé d'erreurs à la soumission.
 */
function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  name,
  control,
  label,
  required = false,
  description,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const describedBy = fieldState.invalid ? errorId : description ? descriptionId : undefined;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={name} required={required}>
              {label}
            </FieldLabel>
            {render({
              field,
              attributes: {
                id: name,
                "aria-invalid": fieldState.invalid,
                "aria-describedby": describedBy,
              },
            })}
            {fieldState.invalid ? (
              <FieldError id={errorId} errors={[fieldState.error]} />
            ) : (
              description && <FieldDescription id={descriptionId}>{description}</FieldDescription>
            )}
          </Field>
        );
      }}
    />
  );
}

export { FormField };
export type { FormFieldAttributes, FormFieldProps, FormFieldRenderProps };

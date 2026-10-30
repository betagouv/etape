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

interface FormFieldControlProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends ControllerRenderProps<TFieldValues, TName> {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FormFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  name: TName;
  control: Control<TFieldValues>;
  label: React.ReactNode;
  description?: React.ReactNode;
  orientation?: React.ComponentProps<typeof Field>["orientation"];
  render: (props: FormFieldControlProps<TFieldValues, TName>) => React.ReactNode;
}

/**
 * Champ react-hook-form mis en forme par `Field`. Relie seul le libellé, la
 * description et l'erreur au contrôle (`id`, `aria-invalid`, `aria-describedby`) :
 * `render` n'a qu'à étaler les props reçues sur le contrôle.
 */
function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  name,
  control,
  label,
  description,
  orientation,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  const id = React.useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const describedBy = [
          description ? descriptionId : undefined,
          fieldState.invalid ? errorId : undefined,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <Field data-invalid={fieldState.invalid} orientation={orientation}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            {render({
              ...field,
              id,
              "aria-invalid": fieldState.invalid,
              "aria-describedby": describedBy || undefined,
            })}
            {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError id={errorId} errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}

export { FormField };
export type { FormFieldControlProps, FormFieldProps };

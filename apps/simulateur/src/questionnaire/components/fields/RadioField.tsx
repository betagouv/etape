"use client";

import { Fragment, type ReactNode } from "react";
import { Label } from "@etape/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@etape/ui/components/radio-group";
import { cn } from "@etape/ui/lib/utils";

import type { RadioField as RadioFieldDef } from "../../domain/types";
import { fieldErrorMark, joinIds } from "./aria";
import { FieldError } from "./FieldError";
import { FieldHeader } from "./FieldHeader";
import { OptionRow } from "./OptionRow";

interface RadioFieldProps {
  field: RadioFieldDef;
  value: string | undefined;
  onChange: (value: string) => void;
  labelledBy?: string;
  describedBy?: string;
  /** Message affiché sous le groupe quand la réponse manque. */
  error?: string;
  /**
   * Contenu inséré juste après une option : les précisions qu'elle ouvre,
   * dans le même écran. Renvoyer `null` pour les options qui n'en ont pas.
   */
  renderAfterOption?: (optionValue: string) => ReactNode;
}

export function RadioField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
  error,
  renderAfterOption,
}: RadioFieldProps) {
  const horizontal = field.orientation === "horizontal";

  // Une sous-question porte son propre libellé ; un champ seul sur son écran
  // emprunte celui de la question.
  const fieldLabelId = field.label ? `${field.name}-label` : undefined;
  const hintId = field.hint ? `${field.name}-hint` : undefined;
  const errorId = `${field.name}-error`;

  return (
    <div className="flex w-full flex-col gap-3">
      <FieldHeader labelId={fieldLabelId} label={field.label} hintId={hintId} hint={field.hint} />
      <RadioGroup
        value={value ?? ""}
        onValueChange={onChange}
        aria-labelledby={fieldLabelId ?? labelledBy}
        aria-describedby={joinIds(hintId, error ? errorId : undefined, describedBy)}
        aria-invalid={error ? true : undefined}
        {...fieldErrorMark(error)}
        className={cn(
          "flex",
          horizontal ? "flex-row flex-wrap gap-x-6 gap-y-4 md:gap-x-8" : "flex-col gap-6",
        )}
      >
        {field.options.map((option) => {
          const id = `${field.name}-${option.value}`;
          const optionLabelId = `${id}-label`;
          const descId = option.description ? `${id}-description` : undefined;
          return (
            <Fragment key={option.value}>
              <Label
                htmlFor={id}
                className={cn(
                  "min-h-11 cursor-pointer items-start gap-2 md:min-h-0",
                  !horizontal && "w-full",
                )}
              >
                <RadioGroupItem
                  id={id}
                  value={option.value}
                  aria-labelledby={optionLabelId}
                  aria-describedby={descId}
                  className="border-border-strong mt-0.5"
                />
                <OptionRow
                  labelId={optionLabelId}
                  descId={descId}
                  label={option.label}
                  description={option.description}
                />
              </Label>
              {renderAfterOption?.(option.value)}
            </Fragment>
          );
        })}
      </RadioGroup>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

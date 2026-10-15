"use client";

import type { ReactNode } from "react";
import {
  ChoiceCard,
  ChoiceCardContent,
  ChoiceCardDescription,
  ChoiceCardLabel,
  ChoiceCardText,
  ChoiceCardTitle,
} from "@etape/ui/components/choice-card";
import { RadioGroup, RadioGroupChip, RadioGroupItem } from "@etape/ui/components/radio-group";

import type { RadioField as RadioFieldDef } from "../../domain/types";
import { fieldErrorMark, joinIds } from "./aria";
import { FieldError } from "./FieldError";
import { FieldHeader } from "./FieldHeader";

interface RadioFieldProps {
  field: RadioFieldDef;
  value: string | undefined;
  onChange: (value: string) => void;
  labelledBy?: string;
  describedBy?: string;
  error?: string;
  /** Précisions affichées dans la carte de l'option ; `null` si aucune. */
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
  // Une sous-question porte son propre libellé ; un champ seul sur son écran
  // emprunte celui de la question.
  const fieldLabelId = field.label ? `${field.name}-label` : undefined;
  const hintId = field.hint ? `${field.name}-hint` : undefined;
  const errorId = `${field.name}-error`;

  const groupProps = {
    value: value ?? "",
    onValueChange: onChange,
    "aria-labelledby": fieldLabelId ?? labelledBy,
    "aria-describedby": joinIds(hintId, error ? errorId : undefined, describedBy),
    "aria-invalid": error ? true : undefined,
    ...fieldErrorMark(error),
  };

  // Sous-question ou champ en encart : en pastilles.
  if (field.sub !== undefined || field.inset) {
    return (
      <div className="flex w-full flex-col gap-3">
        {field.label && (
          <span id={fieldLabelId} className="text-body-sm text-foreground leading-none font-medium">
            {field.label}
          </span>
        )}
        <RadioGroup {...groupProps} className="flex flex-wrap gap-3 md:gap-2">
          {field.options.map((option) => (
            <RadioGroupChip key={option.value} value={option.value} size="responsive">
              {option.label}
            </RadioGroupChip>
          ))}
        </RadioGroup>
        <FieldError id={errorId} message={error} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <FieldHeader labelId={fieldLabelId} label={field.label} hintId={hintId} hint={field.hint} />
      <RadioGroup {...groupProps} className="flex flex-col gap-3">
        {field.options.map((option) => {
          const id = `${field.name}-${option.value}`;
          const optionLabelId = `${id}-label`;
          const descId = option.description ? `${id}-description` : undefined;
          const opened = renderAfterOption?.(option.value);
          return (
            <ChoiceCard key={option.value} selected={value === option.value}>
              <ChoiceCardLabel htmlFor={id}>
                <RadioGroupItem
                  id={id}
                  value={option.value}
                  aria-labelledby={optionLabelId}
                  aria-describedby={descId}
                />
                <ChoiceCardText>
                  <ChoiceCardTitle id={optionLabelId}>{option.label}</ChoiceCardTitle>
                  {option.description && (
                    <ChoiceCardDescription id={descId}>{option.description}</ChoiceCardDescription>
                  )}
                </ChoiceCardText>
              </ChoiceCardLabel>
              {opened && <ChoiceCardContent>{opened}</ChoiceCardContent>}
            </ChoiceCard>
          );
        })}
      </RadioGroup>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

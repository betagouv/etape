"use client";

import { Checkbox } from "@etape/ui/components/checkbox";
import {
  ChoiceCard,
  ChoiceCardDescription,
  ChoiceCardLabel,
  ChoiceCardText,
  ChoiceCardTitle,
} from "@etape/ui/components/choice-card";

import type { CheckboxField as CheckboxFieldDef, Option } from "../../domain/types";
import { fieldErrorGroupMark, joinIds } from "./aria";
import { FieldError } from "./FieldError";

interface CheckboxFieldProps {
  field: CheckboxFieldDef;
  value: string[];
  onChange: (value: string[]) => void;
  labelledBy?: string;
  describedBy?: string;
  /** Message affiché sous le groupe quand aucune option n'est cochée. */
  error?: string;
}

export function CheckboxField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
  error,
}: CheckboxFieldProps) {
  const errorId = `${field.name}-error`;

  const isExclusive = (optionValue: string) =>
    field.options.some((candidate) => candidate.value === optionValue && candidate.exclusive);

  function toggle(option: Option, checked: boolean) {
    if (!checked) {
      onChange(value.filter((v) => v !== option.value));
      return;
    }
    if (option.exclusive) {
      onChange([option.value]);
      return;
    }
    onChange([...value.filter((v) => v !== option.value && !isExclusive(v)), option.value]);
  }

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={joinIds(error ? errorId : undefined, describedBy)}
      {...fieldErrorGroupMark(error)}
      className="focus-visible:outline-ring flex w-full flex-col gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      {field.options.map((option) => {
        const id = `${field.name}-${option.value}`;
        const labelId = `${id}-label`;
        const descId = option.description ? `${id}-description` : undefined;
        const checked = value.includes(option.value);
        return (
          <ChoiceCard key={option.value} selected={checked}>
            <ChoiceCardLabel htmlFor={id}>
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(state) => toggle(option, state === true)}
                aria-labelledby={labelId}
                aria-describedby={descId}
              />
              <ChoiceCardText>
                <ChoiceCardTitle id={labelId}>{option.label}</ChoiceCardTitle>
                {option.description && (
                  <ChoiceCardDescription id={descId}>{option.description}</ChoiceCardDescription>
                )}
              </ChoiceCardText>
            </ChoiceCardLabel>
          </ChoiceCard>
        );
      })}
      <FieldError id={errorId} message={error} />
    </div>
  );
}

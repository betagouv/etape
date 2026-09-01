"use client";

import type { ReactNode } from "react";

import { isFieldVisible } from "../domain/conditions";
import type { Answers, AnswerValue, Field } from "../domain/types";
import { CheckboxField } from "./fields/CheckboxField";
import { MonthYearField } from "./fields/MonthYearField";
import { NumberField } from "./fields/NumberField";
import { RadioField } from "./fields/RadioField";
import { RegionField } from "./fields/RegionField";
import { ToggleField } from "./fields/ToggleField";

interface FieldRendererProps {
  field: Field;
  answers: Answers;
  setAnswer: (name: string, value: AnswerValue) => void;
  labelledBy?: string;
  describedBy?: string;
  /** Message affiché sous le champ quand sa réponse manque. */
  error?: string;
  /** Précisions à ouvrir sous une option — n'a de sens que pour un radio. */
  renderAfterOption?: (optionValue: string) => ReactNode;
}

/** Réponse lue comme chaîne. Toute autre forme est traitée comme absente. */
function asText(value: AnswerValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function FieldRenderer({
  field,
  answers,
  setAnswer,
  labelledBy,
  describedBy,
  error,
  renderAfterOption,
}: FieldRendererProps) {
  if (!isFieldVisible(field, answers)) return null;

  const value = answers[field.name];
  const onChange = (next: AnswerValue) => setAnswer(field.name, next);

  switch (field.type) {
    case "radio":
      return (
        <RadioField
          field={field}
          value={asText(value)}
          onChange={onChange}
          labelledBy={labelledBy}
          describedBy={describedBy}
          error={error}
          renderAfterOption={renderAfterOption}
        />
      );
    case "checkbox":
      return (
        <CheckboxField
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          labelledBy={labelledBy}
          describedBy={describedBy}
          error={error}
        />
      );
    case "month":
      return (
        <MonthYearField
          field={field}
          value={asText(value)}
          onChange={onChange}
          labelledBy={labelledBy}
          describedBy={describedBy}
          error={error}
        />
      );
    case "number":
      return (
        <NumberField
          field={field}
          value={asText(value)}
          onChange={onChange}
          labelledBy={labelledBy}
          describedBy={describedBy}
          error={error}
        />
      );
    case "region":
      return (
        <RegionField
          field={field}
          value={asText(value)}
          onChange={onChange}
          labelledBy={labelledBy}
          describedBy={describedBy}
          error={error}
        />
      );
    case "toggle":
      return (
        <ToggleField
          field={field}
          value={value === true}
          onChange={onChange}
          describedBy={describedBy}
        />
      );
  }
}

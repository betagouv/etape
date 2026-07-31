"use client";

import { isFieldVisible } from "../domain/conditions";
import type { Answers, AnswerValue, Commune, Field } from "../domain/types";
import { CheckboxField } from "./fields/CheckboxField";
import { CityAutocompleteField } from "./fields/CityAutocompleteField";
import { RadioField } from "./fields/RadioField";

interface FieldRendererProps {
  field: Field;
  answers: Answers;
  setAnswer: (name: string, value: AnswerValue) => void;
  labelledBy?: string;
  describedBy?: string;
}

export function FieldRenderer({
  field,
  answers,
  setAnswer,
  labelledBy,
  describedBy,
}: FieldRendererProps) {
  if (!isFieldVisible(field, answers)) return null;

  switch (field.type) {
    case "radio":
      return (
        <RadioField
          field={field}
          value={(answers[field.name] as string | undefined) ?? undefined}
          onChange={(value) => setAnswer(field.name, value)}
          labelledBy={labelledBy}
          describedBy={describedBy}
        />
      );
    case "city":
      return (
        <CityAutocompleteField
          field={field}
          value={(answers[field.name] as Commune | undefined) ?? undefined}
          onChange={(value) => setAnswer(field.name, value)}
        />
      );
    case "checkbox":
      return (
        <CheckboxField
          field={field}
          value={(answers[field.name] as string[] | undefined) ?? []}
          onChange={(value) => setAnswer(field.name, value)}
          labelledBy={labelledBy}
          describedBy={describedBy}
        />
      );
  }
}

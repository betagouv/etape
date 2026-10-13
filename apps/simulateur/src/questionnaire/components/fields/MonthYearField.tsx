"use client";

import { useRef, type KeyboardEvent, type RefObject } from "react";
import { Alert, AlertTitle } from "@etape/ui/components/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "@etape/ui/components/input-otp";

import {
  formatMonthEntry,
  MONTH_LENGTH,
  MONTH_PROBLEM_PARTS,
  monthEntryProblem,
  oldestAcceptedYear,
  parseMonth,
  readMonthEntry,
  YEAR_LENGTH,
} from "../../domain/month";
import type { MonthField as MonthFieldDef } from "../../domain/types";
import { fieldErrorGroupMark, joinIds } from "./aria";
import { FieldError } from "./FieldError";

interface MonthYearFieldProps {
  field: MonthFieldDef;
  value: string | undefined;
  onChange: (value: string | null) => void;
  labelledBy?: string;
  describedBy?: string;
  /** Message du problème à afficher : saisie incomplète ou date impossible. */
  error?: string;
}

/**
 * Année puis mois, saisis chiffre par chiffre dans des cases (maquette Q4).
 *
 * La saisie est transmise BRUTE à chaque frappe (`formatMonthEntry`) : c'est la
 * validation du domaine qui dit si elle est incomplète, impossible (mois 13) ou
 * dans le futur, et le champ n'a qu'à afficher ce qu'elle décide.
 *
 * L'année complète fait passer au mois (règle du ticket). Ce déplacement du
 * focus est annoncé d'avance, dans la description de l'année, pour ne pas
 * surprendre au lecteur d'écran (RGAA 7.4) ; un retour arrière dans le mois
 * vide ramène à l'année.
 */
export function MonthYearField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
  error,
}: MonthYearFieldProps) {
  const entry = readMonthEntry(value);
  const problem = monthEntryProblem(entry, field.minYear ?? oldestAcceptedYear());
  const month = problem === null ? parseMonth(value) : null;
  const description = month && field.describeValue ? field.describeValue(month) : "";

  // Seules les parties fautives passent en rouge : un mois à 13 n'accuse pas
  // l'année qui le précède.
  const invalid =
    error && problem !== null ? MONTH_PROBLEM_PARTS[problem](entry) : { year: false, month: false };

  const yearRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);

  const errorId = `${field.name}-error`;
  const errorRef = error ? errorId : undefined;
  const advanceHintId = `${field.name}-advance-hint`;

  function goToMonth() {
    // Après le rendu de l'année complète : la sortie de l'année doit juger la
    // saisie à jour, pas celle d'avant la dernière frappe.
    requestAnimationFrame(() => monthRef.current?.focus());
  }

  function backToYear(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace" || entry.month !== "") return;
    event.preventDefault();
    yearRef.current?.focus();
  }

  return (
    <div className="flex w-full flex-col">
      <div
        role="group"
        aria-labelledby={labelledBy}
        aria-describedby={joinIds(describedBy, errorRef)}
        {...fieldErrorGroupMark(error)}
        className="focus-visible:outline-ring flex flex-wrap gap-x-16 gap-y-6 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <DigitsPart
          part={{
            id: `${field.name}-year`,
            label: "Année",
            example: "1990",
            placeholder: "AAAA",
            length: YEAR_LENGTH,
          }}
          inputRef={yearRef}
          value={entry.year}
          onChange={(year) => onChange(formatMonthEntry({ ...entry, year }))}
          navigation={{ onComplete: goToMonth }}
          state={{ describedBy: joinIds(advanceHintId, errorRef), invalid: invalid.year }}
        />
        <DigitsPart
          part={{
            id: `${field.name}-month`,
            label: "Mois",
            example: "01",
            placeholder: "MM",
            length: MONTH_LENGTH,
          }}
          inputRef={monthRef}
          value={entry.month}
          onChange={(month) => onChange(formatMonthEntry({ ...entry, month }))}
          navigation={{ onKeyDown: backToYear }}
          state={{ describedBy: errorRef, invalid: invalid.month }}
        />
        <p id={advanceHintId} className="sr-only">
          Le curseur passe au mois une fois l&apos;année saisie.
        </p>
      </div>

      {/* Toujours montée : l'ancienneté calculée est annoncée dès qu'elle
          apparaît, et à chaque correction de la date. L'écart porte sur l'encart
          et non sur la région, qui ne doit rien occuper quand elle est vide. */}
      <div role="status">
        {description && (
          <Alert variant="emphasis" className="mt-6 md:mt-10">
            <AlertTitle>{description}</AlertTitle>
          </Alert>
        )}
      </div>

      <FieldError id={errorId} message={error} />
    </div>
  );
}

/** Ce qui distingue l'année du mois. */
interface DigitsPartSpec {
  id: string;
  label: string;
  example: string;
  placeholder: string;
  length: number;
}

interface DigitsPartProps {
  part: DigitsPartSpec;
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  /** Passage d'une partie à l'autre : au mois une fois l'année complète, retour à l'année. */
  navigation: {
    onComplete?: () => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  };
  /** Description ajoutée à l'exemple (message d'erreur, consigne) et état d'erreur. */
  state: { describedBy?: string; invalid: boolean };
}

/** Une partie de la date : son libellé, ses cases et son exemple. */
function DigitsPart({ part, inputRef, value, onChange, navigation, state }: DigitsPartProps) {
  const exampleId = `${part.id}-example`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={part.id} className="text-foreground text-sm font-medium">
        {part.label}
      </label>
      <InputOTP
        ref={inputRef}
        id={part.id}
        maxLength={part.length}
        pattern={REGEXP_ONLY_DIGITS}
        inputMode="numeric"
        autoComplete="off"
        // Pas de place réservée au badge d'un gestionnaire de mots de passe :
        // ce n'est pas un code secret.
        pushPasswordManagerStrategy="none"
        placeholder={part.placeholder}
        value={value}
        onChange={onChange}
        onComplete={navigation.onComplete}
        onKeyDown={navigation.onKeyDown}
        aria-describedby={joinIds(exampleId, state.describedBy)}
        aria-invalid={state.invalid || undefined}
      >
        <InputOTPGroup>
          {Array.from({ length: part.length }, (_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p id={exampleId} className="text-muted-foreground text-sm">
        Exemple&nbsp;: {part.example}
      </p>
    </div>
  );
}

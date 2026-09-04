"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@etape/ui/components/select";

import {
  currentMonth,
  formatMonth,
  MONTH_NAMES,
  oldestSelectableYear,
  parseMonth,
} from "../../domain/month";
import type { MonthField as MonthFieldDef } from "../../domain/types";
import { fieldErrorGroupMark, joinIds } from "./aria";
import { FieldError } from "./FieldError";
import { FieldHeader } from "./FieldHeader";

interface MonthYearFieldProps {
  field: MonthFieldDef;
  value: string | undefined;
  onChange: (value: string | null) => void;
  labelledBy?: string;
  describedBy?: string;
  /** Message affiché sous les deux listes quand la date est incomplète. */
  error?: string;
}

/** Saisie en cours : l'un des deux selects peut encore être vide. */
interface Draft {
  month: string;
  year: string;
}

const EMPTY: Draft = { month: "", year: "" };

function toDraft(value: string | undefined): Draft {
  const parsed = parseMonth(value);
  return parsed ? { month: String(parsed.month), year: String(parsed.year) } : EMPTY;
}

/**
 * Mois et année, en deux listes déroulantes.
 *
 * Deux selects plutôt qu'un calendrier : la précision demandée est le mois, et
 * une grille de jours ferait choisir une information qu'on jette. Surtout, une
 * date future devient IMPOSSIBLE à composer — l'année s'arrête à l'année en
 * cours, et sur celle-ci les mois s'arrêtent au mois en cours. La validation
 * refuse le futur de son côté, pour une valeur qui viendrait du stockage.
 */
export function MonthYearField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
  error,
}: MonthYearFieldProps) {
  const now = currentMonth();
  const minYear = field.minYear ?? oldestSelectableYear();

  const years = React.useMemo(() => {
    // Ordre décroissant : une entrée chez un employeur est plus souvent récente.
    const list: number[] = [];
    for (let year = now.year; year >= minYear; year--) list.push(year);
    return list;
  }, [now.year, minYear]);

  const [draft, setDraft] = React.useState(() => toDraft(value));

  // La valeur peut changer depuis l'extérieur (retour arrière, recommencer) :
  // les deux selects suivent.
  const [previousValue, setPreviousValue] = React.useState(value);
  if (value !== previousValue) {
    setPreviousValue(value);
    const next = toDraft(value);
    if (next.month !== draft.month || next.year !== draft.year) setDraft(next);
  }

  /** Dernier mois proposable pour une année : le mois en cours si c'est celle-ci. */
  const lastMonthOf = (year: string) =>
    Number(year) === now.year ? now.month : MONTH_NAMES.length;

  function commit(next: Draft) {
    setDraft(next);
    const complete = next.month !== "" && next.year !== "";
    onChange(complete ? formatMonth({ year: Number(next.year), month: Number(next.month) }) : null);
  }

  function selectYear(year: string) {
    // Repasser sur l'année en cours peut rendre le mois déjà choisi impossible.
    const tooLate = draft.month !== "" && Number(draft.month) > lastMonthOf(year);
    commit({ year, month: tooLate ? "" : draft.month });
  }

  const labelId = field.label ? `${field.name}-label` : undefined;
  const hintId = field.hint ? `${field.name}-hint` : undefined;
  const errorId = `${field.name}-error`;
  const monthLabelId = `${field.name}-month-label`;
  const monthTriggerId = `${field.name}-month`;
  const yearLabelId = `${field.name}-year-label`;
  const yearTriggerId = `${field.name}-year`;

  const triggerClassName = "h-11 w-full md:h-9";
  const smallLabelClassName = "text-content-secondary text-sm leading-5";

  return (
    <div className="flex w-full flex-col gap-3">
      <FieldHeader labelId={labelId} label={field.label} hintId={hintId} hint={field.hint} />
      <div
        role="group"
        aria-labelledby={labelId ?? labelledBy}
        aria-describedby={joinIds(hintId, error ? errorId : undefined, describedBy)}
        {...fieldErrorGroupMark(error)}
        className="focus-visible:outline-ring flex w-full max-w-md gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <div className="flex flex-1 flex-col gap-1">
          <span id={monthLabelId} className={smallLabelClassName}>
            Mois
          </span>
          <Select value={draft.month} onValueChange={(month) => commit({ ...draft, month })}>
            {/* Le nom accessible combine le libellé et la valeur choisie : le
                bouton s'annonce « Mois, mars » plutôt que « Mois » seul. */}
            <SelectTrigger
              id={monthTriggerId}
              aria-labelledby={joinIds(monthLabelId, monthTriggerId)}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error ? true : undefined}
              className={triggerClassName}
            >
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.slice(0, lastMonthOf(draft.year)).map((name, index) => (
                <SelectItem key={name} value={String(index + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <span id={yearLabelId} className={smallLabelClassName}>
            Année
          </span>
          <Select value={draft.year} onValueChange={selectYear}>
            <SelectTrigger
              id={yearTriggerId}
              aria-labelledby={joinIds(yearLabelId, yearTriggerId)}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error ? true : undefined}
              className={triggerClassName}
            >
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

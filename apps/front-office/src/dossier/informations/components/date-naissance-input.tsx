import { useState } from "react";
import { fr } from "date-fns/locale/fr";
import { CalendarDaysIcon } from "lucide-react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@etape/ui/components/field";
import { Calendar } from "@etape/ui/components/calendar";
import { InputGroup, InputGroupAddon, InputGroupTrigger } from "@etape/ui/components/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@etape/ui/components/popover";

import {
  computeDateNaissanceBounds,
  formatDateNaissance,
  parseDateNaissance,
} from "../domain/date-naissance";

const FIELD_ID = "dateNaissance";
const LABEL_ID = `${FIELD_ID}-label`;
const VALUE_ID = `${FIELD_ID}-value`;
const DESCRIPTION_ID = `${FIELD_ID}-description`;
const ERROR_ID = `${FIELD_ID}-error`;
const DATE_NAISSANCE_BOUNDS = computeDateNaissanceBounds(new Date());
const DEFAULT_MONTH = new Date(1990, 0);

export interface DateNaissanceInputProps {
  value: string;
  onChange: (value: string) => void;
  fieldRef: React.Ref<HTMLButtonElement>;
  isInvalid: boolean;
  error?: { message?: string };
}

export function DateNaissanceInput({
  value,
  onChange,
  fieldRef,
  isInvalid,
  error,
}: DateNaissanceInputProps) {
  const [isOpen, setOpen] = useState(false);
  const selectedDate = parseDateNaissance(value);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel id={LABEL_ID} htmlFor={FIELD_ID} required>
        Date de naissance
      </FieldLabel>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <InputGroup>
          <PopoverTrigger asChild>
            <InputGroupTrigger
              id={FIELD_ID}
              ref={fieldRef}
              // Nommé par le libellé seul, un bouton n'annonce pas la date choisie : on y ajoute sa valeur.
              aria-labelledby={`${LABEL_ID} ${VALUE_ID}`}
              aria-invalid={isInvalid || undefined}
              aria-describedby={isInvalid ? ERROR_ID : DESCRIPTION_ID}
              data-placeholder={value ? undefined : ""}
            >
              <span id={VALUE_ID}>{value}</span>
            </InputGroupTrigger>
          </PopoverTrigger>
          <InputGroupAddon align="inline-end">
            <CalendarDaysIcon aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
          <Calendar
            className="w-full"
            mode="single"
            captionLayout="dropdown"
            locale={fr}
            formatters={{
              formatMonthDropdown: (date) => date.toLocaleString("fr-FR", { month: "long" }),
            }}
            selected={selectedDate}
            defaultMonth={selectedDate ?? DEFAULT_MONTH}
            startMonth={DATE_NAISSANCE_BOUNDS.min}
            endMonth={DATE_NAISSANCE_BOUNDS.max}
            disabled={{ before: DATE_NAISSANCE_BOUNDS.min, after: DATE_NAISSANCE_BOUNDS.max }}
            onSelect={(date) => {
              if (date) {
                onChange(formatDateNaissance(date));
              }
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {isInvalid ? (
        <FieldError id={ERROR_ID} errors={[error]} />
      ) : (
        <FieldDescription id={DESCRIPTION_ID}>Format : JJ/MM/AAAA</FieldDescription>
      )}
    </Field>
  );
}

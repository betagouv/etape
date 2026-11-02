import { useState } from "react";
import { fr } from "date-fns/locale/fr";
import { CalendarDaysIcon } from "lucide-react";

import { Field, FieldError, FieldLabel } from "@etape/ui/components/field";
import { Button } from "@etape/ui/components/button";
import { Calendar } from "@etape/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@etape/ui/components/popover";

import {
  computeDateNaissanceBounds,
  formatDateNaissance,
  parseDateNaissance,
} from "../domain/date-naissance";
import { RequiredMark } from "./required-mark";

const FIELD_ID = "dateNaissance";
const LABEL_ID = `${FIELD_ID}-label`;
const VALUE_ID = `${FIELD_ID}-value`;
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
      <FieldLabel id={LABEL_ID} htmlFor={FIELD_ID}>
        Date de naissance <RequiredMark />
      </FieldLabel>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={FIELD_ID}
            ref={fieldRef}
            variant="outline"
            // Nommé par le libellé seul, un bouton n'annonce pas la date choisie : on y ajoute sa valeur.
            aria-labelledby={`${LABEL_ID} ${VALUE_ID}`}
            aria-invalid={isInvalid || undefined}
            aria-describedby={isInvalid ? ERROR_ID : undefined}
            className="w-full justify-between font-normal"
          >
            <span id={VALUE_ID} className={value ? undefined : "text-muted-foreground"}>
              {value || "JJ/MM/AAAA"}
            </span>
            <CalendarDaysIcon aria-hidden="true" className="text-muted-foreground size-4" />
          </Button>
        </PopoverTrigger>
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
      {error && <FieldError id={ERROR_ID} errors={[error]} />}
    </Field>
  );
}

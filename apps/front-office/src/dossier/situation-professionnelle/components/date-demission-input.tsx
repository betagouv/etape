import { useState } from "react";
import { fr } from "date-fns/locale/fr";
import { CalendarDaysIcon } from "lucide-react";

import { Calendar } from "@etape/ui/components/calendar";
import { Field, FieldDescription, FieldError, FieldLabel } from "@etape/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupTrigger } from "@etape/ui/components/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@etape/ui/components/popover";

import { formatDateDemission, parseDateDemission } from "../domain/date-demission";

const FIELD_ID = "dateDemission";
const LABEL_ID = `${FIELD_ID}-label`;
const VALUE_ID = `${FIELD_ID}-value`;
const DESCRIPTION_ID = `${FIELD_ID}-description`;
const ERROR_ID = `${FIELD_ID}-error`;

export interface DateDemissionInputProps {
  value: string;
  onChange: (value: string) => void;
  fieldRef: React.Ref<HTMLButtonElement>;
  isInvalid: boolean;
  error?: { message?: string };
}

/** Comme la date de naissance de « Mes informations » ; les jours à venir ne se choisissent pas (maquette 11). */
export function DateDemissionInput({
  value,
  onChange,
  fieldRef,
  isInvalid,
  error,
}: DateDemissionInputProps) {
  const [isOpen, setOpen] = useState(false);
  const selectedDate = parseDateDemission(value);
  const today = new Date();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel id={LABEL_ID} htmlFor={FIELD_ID} required>
        Date de votre démission
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
            defaultMonth={selectedDate ?? today}
            endMonth={today}
            disabled={{ after: today }}
            onSelect={(date) => {
              if (date) onChange(formatDateDemission(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {isInvalid ? (
        <FieldError id={ERROR_ID} errors={[error]} />
      ) : (
        <FieldDescription id={DESCRIPTION_ID}>
          Date de l’accusé de réception ou de la remise en main propre contre décharge. Format :
          jj/mm/aaaa
        </FieldDescription>
      )}
    </Field>
  );
}

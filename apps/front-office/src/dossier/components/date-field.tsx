import { useState } from "react";
import { fr } from "date-fns/locale/fr";
import { CalendarDaysIcon } from "lucide-react";

import { Calendar } from "@etape/ui/components/calendar";
import { Field, FieldDescription, FieldError, FieldLabel } from "@etape/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupTrigger } from "@etape/ui/components/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@etape/ui/components/popover";

import { formatFieldDate, parseFieldDate } from "../domain/field-date";

/** Les bornes du calendrier, pour qu'il ne propose aucune date que le schéma refuserait. */
export interface DateFieldCalendar {
  defaultMonth: Date;
  startMonth?: Date;
  endMonth: Date;
  disabled: React.ComponentProps<typeof Calendar>["disabled"];
}

/** Ce que fournit le `field` d'un `Controller` de react-hook-form. */
export interface DateFieldControl {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  ref: React.Ref<HTMLButtonElement>;
}

export interface DateFieldProps {
  id: string;
  label: string;
  description: string;
  calendar: DateFieldCalendar;
  field: DateFieldControl;
  error?: { message?: string };
}

/** Une date choisie dans un calendrier, au format jj/mm/aaaa. */
export function DateField({
  id,
  label,
  description,
  calendar,
  field: { value, onChange, onBlur, ref: fieldRef },
  error,
}: DateFieldProps) {
  const [isOpen, setOpen] = useState(false);
  const selectedDate = parseFieldDate(value);
  const isInvalid = error !== undefined;
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel id={labelId} htmlFor={id} required>
        {label}
      </FieldLabel>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <InputGroup>
          <PopoverTrigger asChild>
            <InputGroupTrigger
              id={id}
              ref={fieldRef}
              // Liste ouverte, le focus part dans la liste sans quitter le champ.
              onBlur={() => {
                if (!isOpen) onBlur();
              }}
              // Nommé par le libellé seul, un bouton n'annonce pas la date choisie : on y ajoute sa valeur.
              aria-labelledby={`${labelId} ${valueId}`}
              aria-invalid={isInvalid || undefined}
              aria-describedby={isInvalid ? errorId : descriptionId}
              data-placeholder={value ? undefined : ""}
            >
              <span id={valueId}>{value}</span>
            </InputGroupTrigger>
          </PopoverTrigger>
          <InputGroupAddon align="inline-end">
            <CalendarDaysIcon aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
          // Quitter la liste ouverte (clic ou tabulation ailleurs) quitte le champ, sauf vers son bouton.
          onInteractOutside={(event) => {
            if (!(event.target instanceof Element && event.target.closest(`#${CSS.escape(id)}`)))
              onBlur();
          }}
        >
          <Calendar
            className="w-full"
            mode="single"
            captionLayout="dropdown"
            locale={fr}
            formatters={{
              formatMonthDropdown: (date) => date.toLocaleString("fr-FR", { month: "long" }),
            }}
            selected={selectedDate}
            defaultMonth={selectedDate ?? calendar.defaultMonth}
            startMonth={calendar.startMonth}
            endMonth={calendar.endMonth}
            disabled={calendar.disabled}
            onSelect={(date) => {
              if (date) onChange(formatFieldDate(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {isInvalid ? (
        <FieldError id={errorId} errors={[error]} />
      ) : (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
    </Field>
  );
}

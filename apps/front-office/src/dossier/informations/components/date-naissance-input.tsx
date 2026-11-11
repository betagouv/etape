import { useState } from "react";
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
import { INFORMATIONS_FIELD_LABEL } from "../schema";

const FIELD_ID = "dateNaissance";
const LABEL_ID = `${FIELD_ID}-label`;
const VALUE_ID = `${FIELD_ID}-value`;
const DESCRIPTION_ID = `${FIELD_ID}-description`;
const ERROR_ID = `${FIELD_ID}-error`;
const DEFAULT_MONTH = new Date(1990, 0);

export interface DateNaissanceInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  fieldRef: React.Ref<HTMLButtonElement>;
  isInvalid: boolean;
  error?: { message?: string };
}

export function DateNaissanceInput({
  value,
  onChange,
  onBlur,
  fieldRef,
  isInvalid,
  error,
}: DateNaissanceInputProps) {
  const [isOpen, setOpen] = useState(false);
  // Recalculées à chaque ouverture, comme le schéma à chaque validation : un onglet resté
  // ouvert après minuit ne propose pas une date que le schéma refuserait.
  const [bounds, setBounds] = useState(() => computeDateNaissanceBounds(new Date()));
  const selectedDate = parseDateNaissance(value);

  const handleOpenChange = (open: boolean): void => {
    if (open) setBounds(computeDateNaissanceBounds(new Date()));
    setOpen(open);
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel id={LABEL_ID} htmlFor={FIELD_ID} required>
        {INFORMATIONS_FIELD_LABEL.dateNaissance}
      </FieldLabel>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <InputGroup>
          <PopoverTrigger asChild>
            <InputGroupTrigger
              id={FIELD_ID}
              ref={fieldRef}
              // Liste ouverte, le focus part dans la liste sans quitter le champ.
              onBlur={() => {
                if (!isOpen) onBlur();
              }}
              // Nommé par le libellé seul, un bouton n'annonce pas la date choisie : on y ajoute sa valeur.
              aria-labelledby={`${LABEL_ID} ${VALUE_ID}`}
              aria-invalid={isInvalid || undefined}
              aria-describedby={isInvalid ? ERROR_ID : DESCRIPTION_ID}
              data-placeholder={value ? undefined : ""}
            >
              <span id={VALUE_ID}>{value || "JJ/MM/AAAA"}</span>
            </InputGroupTrigger>
          </PopoverTrigger>
          <InputGroupAddon align="inline-end">
            <CalendarDaysIcon aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
          aria-label="Choisir une date de naissance"
          // Quitter la liste ouverte (clic ou tabulation ailleurs) quitte le champ, sauf vers son bouton.
          onInteractOutside={(event) => {
            if (!(event.target instanceof Element && event.target.closest(`#${FIELD_ID}`)))
              onBlur();
          }}
        >
          <Calendar
            className="w-full"
            mode="single"
            captionLayout="dropdown"
            formatters={{
              formatMonthDropdown: (date) => date.toLocaleString("fr-FR", { month: "long" }),
            }}
            selected={selectedDate}
            defaultMonth={selectedDate ?? DEFAULT_MONTH}
            startMonth={bounds.min}
            endMonth={bounds.max}
            disabled={{ before: bounds.min, after: bounds.max }}
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

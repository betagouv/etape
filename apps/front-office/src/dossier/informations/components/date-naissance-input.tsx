import { useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { CalendarDaysIcon } from "lucide-react";

import { Field, FieldError, FieldLabel } from "@etape/ui/components/field";
import { Button } from "@etape/ui/components/button";
import { Calendar } from "@etape/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@etape/ui/components/popover";

import { RequiredMark } from "./required-mark";

const REFERENCE_DATE = new Date(0);
const AGE_MAXIMUM_CALENDAR = 70;
const START_MONTH = new Date(new Date().getFullYear() - AGE_MAXIMUM_CALENDAR, 0);
const DEFAULT_MONTH = new Date(1990, 0);

function parseDateNaissance(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "dd/MM/yyyy", REFERENCE_DATE);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

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
  const selectedDate = useMemo(() => parseDateNaissance(value), [value]);
  const endMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }, []);

  return (
    <Field>
      <FieldLabel htmlFor="dateNaissance">
        Date de naissance <RequiredMark />
      </FieldLabel>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="dateNaissance"
            ref={fieldRef}
            variant="outline"
            aria-invalid={isInvalid || undefined}
            className="w-full justify-between font-normal"
          >
            {value || <span className="text-muted-foreground">JJ/MM/AAAA</span>}
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
            startMonth={START_MONTH}
            endMonth={endMonth}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "dd/MM/yyyy"));
              }
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {error && <FieldError errors={[error]} />}
    </Field>
  );
}

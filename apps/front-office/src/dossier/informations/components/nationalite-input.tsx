import { useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Field, FieldError, FieldLabel } from "@etape/ui/components/field";
import { Button } from "@etape/ui/components/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
} from "@etape/ui/components/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "@etape/ui/components/popover";

import { findNationaliteByLabel, flagUrl } from "../domain/nationalites";
import { useNationaliteSearch } from "../hooks/use-nationalite-search";
import { RequiredMark } from "./required-mark";

const FIELD_ID = "nationalite";
const LABEL_ID = `${FIELD_ID}-label`;
const VALUE_ID = `${FIELD_ID}-value`;
const ERROR_ID = `${FIELD_ID}-error`;
const LIST_ID = `${FIELD_ID}-list`;
const NO_MATCH_NATIONALITE = "Aucune nationalité ne correspond.";

export interface NationaliteInputProps {
  value: string;
  onChange: (value: string) => void;
  fieldRef: React.Ref<HTMLButtonElement>;
  isInvalid: boolean;
  error?: { message?: string };
}

export function NationaliteInput({
  value,
  onChange,
  fieldRef,
  isInvalid,
  error,
}: NationaliteInputProps) {
  const [isOpen, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedNationalite = value ? findNationaliteByLabel(value) : undefined;

  const search = useNationaliteSearch({
    idPrefix: FIELD_ID,
    onSelect: (val) => {
      onChange(val);
      setOpen(false);
    },
  });

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel id={LABEL_ID} htmlFor={FIELD_ID}>
        Nationalité <RequiredMark />
      </FieldLabel>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) search.reset();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={FIELD_ID}
            ref={fieldRef}
            variant="outline"
            // Nommé par le libellé seul, un bouton n'annonce pas la nationalité choisie : on y ajoute sa valeur.
            aria-labelledby={`${LABEL_ID} ${VALUE_ID}`}
            aria-invalid={isInvalid || undefined}
            aria-describedby={isInvalid ? ERROR_ID : undefined}
            className="w-full justify-between font-normal"
          >
            {selectedNationalite ? (
              <span id={VALUE_ID} className="flex items-center gap-2">
                <img
                  src={flagUrl(selectedNationalite.code)}
                  alt=""
                  className="size-4 shrink-0 rounded-full"
                />
                {value}
              </span>
            ) : (
              <span id={VALUE_ID} className="text-muted-foreground">
                Sélectionner
              </span>
            )}
            <ChevronDownIcon aria-hidden="true" className="text-muted-foreground size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <Combobox className="border-0">
            <ComboboxInput
              ref={inputRef}
              value={search.searchText}
              placeholder="Rechercher…"
              aria-expanded={true}
              aria-controls={LIST_ID}
              aria-activedescendant={
                search.activeValue ? search.optionId(search.activeValue) : undefined
              }
              aria-label="Rechercher une nationalité"
              {...search.inputHandlers}
            />
            <ComboboxList
              id={LIST_ID}
              aria-label="Nationalités"
              onMouseDown={(e) => e.preventDefault()}
            >
              {search.suggestion && (
                <>
                  <li role="presentation" className="text-muted-foreground px-2 py-1 text-xs">
                    Suggestion
                  </li>
                  <ComboboxOption
                    id={search.optionId(search.suggestion.label)}
                    selected={search.suggestion.label === value}
                    active={search.activeValue === search.suggestion.label}
                    onClick={() => search.select(search.suggestion!.label)}
                  >
                    <span className="flex items-center gap-2">
                      <img
                        src={flagUrl(search.suggestion.code)}
                        alt=""
                        className="size-4 shrink-0 rounded-full"
                      />
                      {search.suggestion.label}
                    </span>
                  </ComboboxOption>
                </>
              )}
              {search.nationalites.length > 0 && (
                <>
                  <li role="presentation" className="text-muted-foreground px-2 py-1 text-xs">
                    Nationalités
                  </li>
                  {search.nationalites.map((n) => (
                    <ComboboxOption
                      key={n.label}
                      id={search.optionId(n.label)}
                      selected={n.label === value}
                      active={n.label === search.activeValue}
                      onClick={() => search.select(n.label)}
                    >
                      <span className="flex items-center gap-2">
                        <img
                          src={flagUrl(n.code)}
                          alt=""
                          className="size-4 shrink-0 rounded-full"
                        />
                        {n.label}
                      </span>
                    </ComboboxOption>
                  ))}
                </>
              )}
              {!search.suggestion && search.nationalites.length === 0 && (
                <ComboboxEmpty>{NO_MATCH_NATIONALITE}</ComboboxEmpty>
              )}
            </ComboboxList>
          </Combobox>
        </PopoverContent>
      </Popover>
      {error && <FieldError id={ERROR_ID} errors={[error]} />}
    </Field>
  );
}

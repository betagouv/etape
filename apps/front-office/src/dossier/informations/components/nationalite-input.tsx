import { useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Field, FieldError, FieldLabel } from "@etape/ui/components/field";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
} from "@etape/ui/components/combobox";
import { InputGroup, InputGroupAddon, InputGroupTrigger } from "@etape/ui/components/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@etape/ui/components/popover";

import { findNationaliteByLabel, flagUrl } from "../domain/nationalites";
import { useNationaliteSearch } from "../hooks/use-nationalite-search";
import { NationaliteLabel } from "./nationalite-label";

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
      <FieldLabel id={LABEL_ID} htmlFor={FIELD_ID} required>
        Nationalité
      </FieldLabel>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) search.reset();
        }}
      >
        <InputGroup>
          {selectedNationalite && (
            <InputGroupAddon>
              <img src={flagUrl(selectedNationalite.code)} alt="" className="size-4" />
            </InputGroupAddon>
          )}
          <PopoverTrigger asChild>
            <InputGroupTrigger
              id={FIELD_ID}
              ref={fieldRef}
              // Nommé par le libellé seul, un bouton n'annonce pas la nationalité choisie : on y ajoute sa valeur.
              aria-labelledby={`${LABEL_ID} ${VALUE_ID}`}
              aria-invalid={isInvalid || undefined}
              aria-describedby={isInvalid ? ERROR_ID : undefined}
              data-placeholder={value ? undefined : ""}
            >
              <span id={VALUE_ID}>{value || "Sélectionner"}</span>
            </InputGroupTrigger>
          </PopoverTrigger>
          <InputGroupAddon align="inline-end">
            <ChevronDownIcon aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
        <PopoverContent
          variant="list"
          align="start"
          className="w-[var(--radix-popover-trigger-width)]"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <Combobox variant="inset">
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
                <ComboboxGroup label="Suggestion">
                  <ComboboxOption
                    id={search.optionId(search.suggestion.label)}
                    selected={search.suggestion.label === value}
                    active={search.activeValue === search.suggestion.label}
                    onClick={() => search.select(search.suggestion!.label)}
                  >
                    <NationaliteLabel nationalite={search.suggestion} />
                  </ComboboxOption>
                </ComboboxGroup>
              )}
              {search.nationalites.length > 0 && (
                <ComboboxGroup label="Nationalités">
                  {search.nationalites.map((nationalite) => (
                    <ComboboxOption
                      key={nationalite.label}
                      id={search.optionId(nationalite.label)}
                      selected={nationalite.label === value}
                      active={nationalite.label === search.activeValue}
                      onClick={() => search.select(nationalite.label)}
                    >
                      <NationaliteLabel nationalite={nationalite} />
                    </ComboboxOption>
                  ))}
                </ComboboxGroup>
              )}
              {!search.suggestion && search.nationalites.length === 0 && (
                <ComboboxEmpty>{NO_MATCH_NATIONALITE}</ComboboxEmpty>
              )}
            </ComboboxList>
          </Combobox>
        </PopoverContent>
      </Popover>
      {isInvalid && <FieldError id={ERROR_ID} errors={[error]} />}
    </Field>
  );
}

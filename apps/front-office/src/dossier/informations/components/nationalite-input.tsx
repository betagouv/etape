import { useRef } from "react";
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

import { flagUrl, NO_NATIONALITE_MESSAGE } from "../domain/nationalites";
import {
  NATIONALITE_FIELD_ID,
  nationaliteOptionId,
  type UseNationaliteSearchResult,
} from "../hooks/use-nationalite-search";
import { INFORMATIONS_FIELD_LABEL } from "../schema";
import { NationaliteLabel } from "./nationalite-label";

const LABEL_ID = `${NATIONALITE_FIELD_ID}-label`;
const VALUE_ID = `${NATIONALITE_FIELD_ID}-value`;
const ERROR_ID = `${NATIONALITE_FIELD_ID}-error`;
const LIST_ID = `${NATIONALITE_FIELD_ID}-list`;

export interface NationaliteInputProps {
  search: UseNationaliteSearchResult;
  value: string;
  fieldRef: React.Ref<HTMLButtonElement>;
  onBlur: () => void;
  error?: { message?: string };
}

/** Le champ de la nationalité : un bouton qui ouvre la liste, et la recherche qui la filtre. */
export function NationaliteInput({
  search,
  value,
  fieldRef,
  onBlur,
  error,
}: NationaliteInputProps) {
  const isInvalid = error !== undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const { suggestion } = search;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel id={LABEL_ID} htmlFor={NATIONALITE_FIELD_ID} required>
        {INFORMATIONS_FIELD_LABEL.nationalite}
      </FieldLabel>
      <Popover open={search.isListOpen} onOpenChange={search.setListOpen}>
        <InputGroup>
          {search.selected && (
            <InputGroupAddon>
              <img src={flagUrl(search.selected.code)} alt="" className="size-4" />
            </InputGroupAddon>
          )}
          <PopoverTrigger asChild>
            <InputGroupTrigger
              id={NATIONALITE_FIELD_ID}
              ref={fieldRef}
              // Liste ouverte, le focus part dans la liste sans quitter le champ.
              onBlur={() => {
                if (!search.isListOpen) onBlur();
              }}
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
          aria-label="Choisir une nationalité"
          // Quitter la liste ouverte (clic ou tabulation ailleurs) quitte le champ, sauf vers son bouton.
          onInteractOutside={({ target }) => {
            if (!(target instanceof Element && target.closest(`#${NATIONALITE_FIELD_ID}`)))
              onBlur();
          }}
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
              aria-activedescendant={search.active ? nationaliteOptionId(search.active) : undefined}
              aria-label="Rechercher une nationalité"
              {...search.inputHandlers}
            />
            <ComboboxList
              id={LIST_ID}
              aria-label="Nationalités"
              onMouseDown={(e) => e.preventDefault()}
            >
              {suggestion && (
                <ComboboxGroup label="Suggestion">
                  <ComboboxOption
                    id={nationaliteOptionId(suggestion)}
                    selected={suggestion.label === value}
                    active={suggestion === search.active}
                    onClick={() => search.select(suggestion)}
                  >
                    <NationaliteLabel nationalite={suggestion} />
                  </ComboboxOption>
                </ComboboxGroup>
              )}
              {search.nationalites.length > 0 && (
                <ComboboxGroup label="Nationalités">
                  {search.nationalites.map((nationalite) => (
                    <ComboboxOption
                      key={nationalite.code}
                      id={nationaliteOptionId(nationalite)}
                      selected={nationalite.label === value}
                      active={nationalite === search.active}
                      onClick={() => search.select(nationalite)}
                    >
                      <NationaliteLabel nationalite={nationalite} />
                    </ComboboxOption>
                  ))}
                </ComboboxGroup>
              )}
            </ComboboxList>
            {/* Une liste d'options ne contient que des options (ARIA) : le message est à côté. */}
            {!suggestion && search.nationalites.length === 0 && (
              <ComboboxEmpty>{NO_NATIONALITE_MESSAGE}</ComboboxEmpty>
            )}
          </Combobox>
        </PopoverContent>
      </Popover>
      {isInvalid && <FieldError id={ERROR_ID} errors={[error]} />}
    </Field>
  );
}

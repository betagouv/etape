import { Fragment } from "react";
import { CircleXIcon, SearchIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxList,
  ComboboxOption,
} from "@etape/ui/components/combobox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@etape/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
import { Separator } from "@etape/ui/components/separator";
import { StatusRegion } from "@etape/ui/components/status-region";

import { formatSiret } from "../domain/format-siret";
import {
  EMPLOYEUR_FIELD_ID,
  employeurOptionId,
  type UseEmployeurSearchResult,
} from "../hooks/use-employeur-search";

const DESCRIPTION_ID = `${EMPLOYEUR_FIELD_ID}-description`;
const ERROR_ID = `${EMPLOYEUR_FIELD_ID}-error`;
const LIST_ID = `${EMPLOYEUR_FIELD_ID}-list`;

export interface EmployeurSearchProps {
  search: UseEmployeurSearchResult;
  fieldRef: React.Ref<HTMLInputElement>;
  isInvalid: boolean;
  error?: { message?: string };
  /** Vrai après « Changer l'entreprise » : le focus revient au champ. */
  isFocusRequested: boolean;
}

export function EmployeurSearch({
  search,
  fieldRef,
  isInvalid,
  error,
  isFocusRequested,
}: EmployeurSearchProps) {
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={EMPLOYEUR_FIELD_ID} required>
        Votre employeur
      </FieldLabel>
      <div className="relative">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id={EMPLOYEUR_FIELD_ID}
            ref={fieldRef}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={search.isListOpen}
            aria-controls={LIST_ID}
            aria-activedescendant={search.active ? employeurOptionId(search.active) : undefined}
            aria-invalid={isInvalid || undefined}
            aria-describedby={isInvalid ? `${DESCRIPTION_ID} ${ERROR_ID}` : DESCRIPTION_ID}
            autoComplete="off"
            autoFocus={isFocusRequested}
            value={search.searchText}
            {...search.inputHandlers}
          />
          {search.searchText && (
            <InputGroupAddon align="inline-end">
              <Button
                variant="secondary"
                size="icon-xs"
                aria-label="Effacer la recherche"
                onClick={search.clear}
              >
                <CircleXIcon aria-hidden="true" />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>
        <Combobox className="absolute top-full z-50 mt-1" hidden={!search.isListOpen}>
          <ComboboxList
            id={LIST_ID}
            aria-label="Établissements"
            // Garde le focus dans le champ : un clic sur une option ne doit pas fermer la liste avant d'être pris en compte.
            onMouseDown={(event) => event.preventDefault()}
          >
            {search.etablissements.length === 0 ? (
              <ComboboxEmpty>{search.listMessage}</ComboboxEmpty>
            ) : (
              <ComboboxGroup label={search.listMessage}>
                {search.etablissements.map((etablissement) => (
                  <Fragment key={etablissement.siret}>
                    <li role="presentation">
                      <Separator />
                    </li>
                    <ComboboxOption
                      id={employeurOptionId(etablissement)}
                      active={etablissement === search.active}
                      onClick={() => search.select(etablissement)}
                    >
                      <span className="flex flex-col gap-1 py-1">
                        <span className="text-base font-medium">{etablissement.denomination}</span>
                        {etablissement.enseigne && (
                          <Detail label="Enseigne" value={etablissement.enseigne} />
                        )}
                        <Detail label="Adresse" value={etablissement.adresse} />
                        <Detail label="SIRET" value={formatSiret(etablissement.siret)} />
                      </span>
                    </ComboboxOption>
                  </Fragment>
                ))}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </Combobox>
      </div>
      <FieldDescription id={DESCRIPTION_ID}>
        Saisissez le numéro SIRET indiqué sur votre bulletin de salaire, ou le nom de l’entreprise
        suivi de la ville.
      </FieldDescription>
      {isInvalid && <FieldError id={ERROR_ID} errors={[error]} />}
      <StatusRegion message={search.announcement} />
    </Field>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-muted-foreground text-sm">
      {label} : <span className="text-foreground">{value}</span>
    </span>
  );
}

import {
  Combobox,
  ComboboxEmpty,
  ComboboxList,
  ComboboxOption,
} from "@etape/ui/components/combobox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@etape/ui/components/field";
import { Input } from "@etape/ui/components/input";
import { StatusRegion } from "@etape/ui/components/status-region";

import { formatSecteurActivite } from "../domain/secteur-activite";
import {
  SECTEUR_ACTIVITE_FIELD_ID,
  secteurActiviteOptionId,
  type UseSecteurActiviteSearchResult,
} from "../hooks/use-secteur-activite-search";
import { SITUATION_PROFESSIONNELLE_FIELD_LABEL } from "../schema";

const DESCRIPTION_ID = `${SECTEUR_ACTIVITE_FIELD_ID}-description`;
const ERROR_ID = `${SECTEUR_ACTIVITE_FIELD_ID}-error`;
const LIST_ID = `${SECTEUR_ACTIVITE_FIELD_ID}-list`;

/** Ce que reçoit `SecteurActiviteInput` : la recherche, la valeur choisie et le lien au formulaire. */
export interface SecteurActiviteInputProps {
  search: UseSecteurActiviteSearchResult;
  value: string;
  fieldRef: React.Ref<HTMLInputElement>;
  onBlur: () => void;
  error?: { message?: string };
}

/** Le champ du secteur d'activité et sa liste de suggestions. */
export function SecteurActiviteInput({
  search,
  value,
  fieldRef,
  onBlur,
  error,
}: SecteurActiviteInputProps) {
  const isInvalid = error !== undefined;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={SECTEUR_ACTIVITE_FIELD_ID} required>
        {SITUATION_PROFESSIONNELLE_FIELD_LABEL.secteurActivite}
      </FieldLabel>
      <div className="relative">
        <Input
          id={SECTEUR_ACTIVITE_FIELD_ID}
          ref={fieldRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={search.isListOpen}
          aria-controls={LIST_ID}
          aria-activedescendant={search.active ? secteurActiviteOptionId(search.active) : undefined}
          aria-invalid={isInvalid || undefined}
          aria-describedby={isInvalid ? ERROR_ID : DESCRIPTION_ID}
          autoComplete="off"
          value={search.inputText}
          {...search.inputHandlers}
          onBlur={() => {
            search.inputHandlers.onBlur();
            onBlur();
          }}
        />
        <Combobox className="absolute top-full z-50 mt-1" hidden={!search.isListOpen}>
          <ComboboxList
            id={LIST_ID}
            aria-label="Secteurs d’activité"
            // Garde le focus dans le champ : un clic sur une option ne doit pas fermer la liste avant d'être pris en compte.
            onMouseDown={(event) => event.preventDefault()}
          >
            {search.secteurs.map((secteur) => (
              <ComboboxOption
                key={secteur.code}
                id={secteurActiviteOptionId(secteur)}
                selected={secteur.code === value}
                active={secteur === search.active}
                onClick={() => search.select(secteur)}
              >
                {formatSecteurActivite(secteur)}
              </ComboboxOption>
            ))}
          </ComboboxList>
          {search.secteurs.length === 0 && <ComboboxEmpty>{search.emptyMessage}</ComboboxEmpty>}
          {search.moreMessage && <ComboboxEmpty>{search.moreMessage}</ComboboxEmpty>}
        </Combobox>
      </div>
      {/* Comme dans le kit et `FormField` : l'erreur remplace la description. */}
      {isInvalid ? (
        <FieldError id={ERROR_ID} errors={[error]} />
      ) : (
        <FieldDescription id={DESCRIPTION_ID}>
          Saisissez le code APE (ou NAF) indiqué sur votre bulletin de salaire (par exemple : 1071C)
          ou un mot-clé.
        </FieldDescription>
      )}
      <StatusRegion message={search.announcement} />
    </Field>
  );
}

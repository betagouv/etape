import { Fragment } from "react";
import { ETABLISSEMENT_SEARCH_MAX_LENGTH } from "@etape/api-contract";
import {
  CircleXIcon,
  FilePenLineIcon,
  RefreshCwIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Alert, AlertActions, AlertDescription, AlertTitle } from "@etape/ui/components/alert";
import { Button } from "@etape/ui/components/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxList,
  ComboboxOption,
  ComboboxOptionDetail,
  ComboboxOptionTitle,
} from "@etape/ui/components/combobox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@etape/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
import { Separator } from "@etape/ui/components/separator";
import { StatusRegion } from "@etape/ui/components/status-region";

import { formatSiret } from "../domain/format-siret";
import {
  EMPLOYEUR_FIELD_ID,
  employeurOptionId,
  NO_RESULT_TITLE,
  SEARCH_ERROR_TITLE,
  SEARCH_STATUS,
  type UseEmployeurSearchResult,
} from "../hooks/use-employeur-search";
import { SITUATION_PROFESSIONNELLE_FIELD_LABEL } from "../schema";

const DESCRIPTION_ID = `${EMPLOYEUR_FIELD_ID}-description`;
const ERROR_ID = `${EMPLOYEUR_FIELD_ID}-error`;
const LIST_ID = `${EMPLOYEUR_FIELD_ID}-list`;

export interface EmployeurSearchProps {
  search: UseEmployeurSearchResult;
  fieldRef: React.Ref<HTMLInputElement>;
  onBlur: () => void;
  error?: { message?: string };
  /** Vrai après « Changer l'entreprise » ou un retour de la saisie manuelle : le focus revient au champ. */
  isFocusRequested: boolean;
  onManualEntry: () => void;
}

/** Le champ de recherche de l'employeur dans Sirene, sa liste de résultats et ses alertes. */
export function EmployeurSearch({
  search,
  fieldRef,
  onBlur,
  error,
  isFocusRequested,
  onManualEntry,
}: EmployeurSearchProps) {
  const isInvalid = error !== undefined;
  const isRetrying = search.status === SEARCH_STATUS.RETRYING;
  const manualEntryButton = (
    <Button type="button" variant="outline" size="sm" onClick={onManualEntry}>
      <FilePenLineIcon aria-hidden="true" />
      Saisir mon employeur moi-même
    </Button>
  );

  return (
    <Field
      data-invalid={isInvalid}
      // On ne quitte le champ qu'en sortant de tout le groupe : la liste reste ouverte pour son bouton,
      // et « Relancer la recherche » ne déclenche pas la validation.
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        search.close();
        onBlur();
      }}
    >
      <FieldLabel htmlFor={EMPLOYEUR_FIELD_ID} required>
        {SITUATION_PROFESSIONNELLE_FIELD_LABEL.employeur}
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
            aria-expanded={search.isPopupOpen}
            aria-controls={LIST_ID}
            aria-activedescendant={search.active ? employeurOptionId(search.active) : undefined}
            aria-invalid={isInvalid || undefined}
            aria-describedby={isInvalid ? ERROR_ID : DESCRIPTION_ID}
            autoComplete="off"
            maxLength={ETABLISSEMENT_SEARCH_MAX_LENGTH}
            autoFocus={isFocusRequested}
            value={search.searchText}
            {...search.inputHandlers}
          />
          {search.searchText && (
            <InputGroupAddon align="inline-end">
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                aria-label="Effacer la recherche"
                onClick={() => {
                  search.clear();
                  // Le bouton disparaît avec le texte : sans cela, le focus tomberait sur la page.
                  document.getElementById(EMPLOYEUR_FIELD_ID)?.focus();
                }}
              >
                <CircleXIcon aria-hidden="true" />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>
        <Combobox className="absolute top-full z-50 mt-1" hidden={!search.isPopupOpen}>
          {/* Une liste d'options ne contient que des options (ARIA) : l'alerte et son bouton sont à côté. */}
          {search.status === SEARCH_STATUS.NO_RESULT && (
            <Alert variant="warning">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertTitle>{NO_RESULT_TITLE}</AlertTitle>
              <AlertDescription>
                Vérifiez l’orthographe, ajoutez la ville, ou saisissez le numéro SIRET indiqué sur
                votre bulletin de salaire.
              </AlertDescription>
              <AlertActions>{manualEntryButton}</AlertActions>
            </Alert>
          )}
          <ComboboxList
            id={LIST_ID}
            aria-label="Établissements"
            hidden={search.etablissements.length === 0}
            // Garde le focus dans le champ : un clic sur une option ne doit pas fermer la liste avant d'être pris en compte.
            onMouseDown={(event) => event.preventDefault()}
          >
            <ComboboxGroup label={search.resultLabel}>
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
                      <ComboboxOptionTitle>{etablissement.denomination}</ComboboxOptionTitle>
                      {etablissement.enseigne && (
                        <ComboboxOptionDetail label="Enseigne">
                          {etablissement.enseigne}
                        </ComboboxOptionDetail>
                      )}
                      <ComboboxOptionDetail label="Adresse">
                        {etablissement.adresse}
                      </ComboboxOptionDetail>
                      <ComboboxOptionDetail label="SIRET">
                        {formatSiret(etablissement.siret)}
                      </ComboboxOptionDetail>
                    </span>
                  </ComboboxOption>
                </Fragment>
              ))}
            </ComboboxGroup>
          </ComboboxList>
          {search.moreMessage && <ComboboxEmpty>{search.moreMessage}</ComboboxEmpty>}
        </Combobox>
      </div>
      {/* Comme dans le kit et `FormField` : l'erreur remplace la description. */}
      {isInvalid ? (
        <FieldError id={ERROR_ID} errors={[error]} />
      ) : (
        <FieldDescription id={DESCRIPTION_ID}>
          Saisissez le numéro SIRET indiqué sur votre bulletin de salaire, ou le nom de l’entreprise
          suivi de la ville.
        </FieldDescription>
      )}
      {(search.status === SEARCH_STATUS.ERROR || search.status === SEARCH_STATUS.RETRYING) && (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>{SEARCH_ERROR_TITLE}</AlertTitle>
          <AlertDescription>
            Vous pouvez saisir vous-même les informations de votre employeur.
          </AlertDescription>
          <AlertActions>
            {manualEntryButton}
            <Button
              type="button"
              variant="link"
              size="inline-sm"
              // Pas de `disabled` : il ferait perdre le focus pendant l'appel.
              aria-disabled={isRetrying || undefined}
              aria-busy={isRetrying || undefined}
              onClick={search.retry}
            >
              <RefreshCwIcon aria-hidden="true" />
              Relancer la recherche
            </Button>
          </AlertActions>
        </Alert>
      )}
      <StatusRegion message={search.announcement} />
    </Field>
  );
}

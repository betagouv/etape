import { Fragment } from "react";
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
  NO_RESULT_TITLE,
  SEARCH_ERROR_TITLE,
  SEARCH_STATUS,
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
  /** Vrai après « Changer l'entreprise » ou un retour de la saisie manuelle : le focus revient au champ. */
  isFocusRequested: boolean;
  onManualEntry: () => void;
}

export function EmployeurSearch({
  search,
  fieldRef,
  isInvalid,
  error,
  isFocusRequested,
  onManualEntry,
}: EmployeurSearchProps) {
  const manualEntryButton = (
    <Button type="button" variant="outline" size="sm" onClick={onManualEntry}>
      <FilePenLineIcon aria-hidden="true" />
      Saisir mon employeur moi-même
    </Button>
  );

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={EMPLOYEUR_FIELD_ID} required>
        Votre employeur
      </FieldLabel>
      {/* La liste reste ouverte tant que le focus est dans le champ ou dans la liste : le bouton de l'alerte doit rester atteignable. */}
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) search.close();
        }}
      >
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
          </ComboboxList>
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
      {search.status === SEARCH_STATUS.ERROR && (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>{SEARCH_ERROR_TITLE}</AlertTitle>
          <AlertDescription>
            Vous pouvez saisir vous-même les informations de votre employeur.
          </AlertDescription>
          <AlertActions>
            {manualEntryButton}
            <Button type="button" variant="link" size="inline-sm" onClick={search.retry}>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-muted-foreground text-sm">
      {label} : <span className="text-foreground">{value}</span>
    </span>
  );
}

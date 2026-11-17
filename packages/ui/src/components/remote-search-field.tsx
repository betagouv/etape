"use client";

import * as React from "react";
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
} from "@etape/ui/components/combobox";
import { Field, FieldDescription, FieldError, FieldLabel } from "@etape/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@etape/ui/components/input-group";
import { Separator } from "@etape/ui/components/separator";
import { StatusRegion } from "@etape/ui/components/status-region";
import {
  SEARCH_STATUS,
  type RemoteSearchFieldDefinition,
  type RemoteSearchState,
} from "@etape/ui/lib/remote-search";

/** Le lien du champ au formulaire. */
interface RemoteSearchFieldControl {
  fieldRef: React.Ref<HTMLInputElement>;
  onBlur: () => void;
  error?: { message?: string };
  /** Vrai quand le champ vient de remplacer le choix affiché ou la saisie manuelle : il prend le focus. */
  isFocusRequested: boolean;
}

/** Ce que reçoit `RemoteSearchField` : la recherche, ce qui la distingue, le lien au formulaire et le passage à la saisie manuelle. */
interface RemoteSearchFieldProps<TItem> {
  search: RemoteSearchState<TItem>;
  definition: RemoteSearchFieldDefinition<TItem>;
  control: RemoteSearchFieldControl;
  onManualEntry: () => void;
  /** Le contenu d'une ligne de résultat : un `ComboboxOptionTitle`, puis ses `ComboboxOptionDetail`. */
  renderOption: (item: TItem) => React.ReactNode;
  /** Mise en page seulement : largeur, marge. */
  className?: string;
}

/**
 * Champ obligatoire de recherche auprès d'une API, au fil de la saisie : sa liste de résultats,
 * l'alerte « aucun résultat » et l'alerte de panne, qui mènent toutes deux à une saisie manuelle.
 * Vue pure : l'état vient de `search`, que l'app calcule (requête, clavier, annonce).
 */
function RemoteSearchField<TItem>({
  search,
  definition,
  control,
  onManualEntry,
  renderOption,
  className,
}: RemoteSearchFieldProps<TItem>) {
  const { id, label, maxLength, optionId, texts } = definition;
  const { fieldRef, onBlur, error, isFocusRequested } = control;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const listId = `${id}-list`;
  const isInvalid = error !== undefined;
  const isRetrying = search.status === SEARCH_STATUS.RETRYING;
  const manualEntryButton = (
    <Button type="button" variant="outline" size="sm" onClick={onManualEntry}>
      <FilePenLineIcon aria-hidden="true" />
      {texts.manualEntryLabel}
    </Button>
  );

  return (
    <Field
      data-slot="remote-search-field"
      className={className}
      data-invalid={isInvalid}
      // On ne quitte le champ qu'en sortant de tout le groupe : la liste reste ouverte pour son bouton,
      // et « Relancer la recherche » ne déclenche pas la validation.
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        search.close();
        onBlur();
      }}
    >
      <FieldLabel htmlFor={id} required>
        {label}
      </FieldLabel>
      <div className="relative">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id={id}
            ref={fieldRef}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={search.isPopupOpen && search.items.length > 0}
            aria-controls={listId}
            aria-activedescendant={search.active ? optionId(search.active) : undefined}
            aria-invalid={isInvalid || undefined}
            aria-describedby={isInvalid ? errorId : descriptionId}
            autoComplete="off"
            maxLength={maxLength}
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
                  document.getElementById(id)?.focus();
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
              <AlertTitle>{texts.noResultTitle}</AlertTitle>
              <AlertDescription>{texts.noResultDescription}</AlertDescription>
              <AlertActions>{manualEntryButton}</AlertActions>
            </Alert>
          )}
          <ComboboxList
            id={listId}
            aria-label={texts.listLabel}
            hidden={search.items.length === 0}
            // Garde le focus dans le champ : un clic sur une option ne doit pas fermer la liste avant d'être pris en compte.
            onMouseDown={(event) => event.preventDefault()}
          >
            <ComboboxGroup label={search.resultLabel}>
              {search.items.map((item) => (
                <React.Fragment key={optionId(item)}>
                  <li role="presentation">
                    <Separator />
                  </li>
                  <ComboboxOption
                    id={optionId(item)}
                    active={item === search.active}
                    onClick={() => search.select(item)}
                  >
                    <span className="flex flex-col gap-1 py-1">{renderOption(item)}</span>
                  </ComboboxOption>
                </React.Fragment>
              ))}
            </ComboboxGroup>
          </ComboboxList>
          {search.moreMessage && <ComboboxEmpty>{search.moreMessage}</ComboboxEmpty>}
        </Combobox>
      </div>
      {/* Comme dans le kit et `FormField` : l'erreur remplace la description. */}
      {isInvalid ? (
        <FieldError id={errorId} errors={[error]} />
      ) : (
        <FieldDescription id={descriptionId}>{texts.description}</FieldDescription>
      )}
      {(search.status === SEARCH_STATUS.ERROR || isRetrying) && (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>{texts.errorTitle}</AlertTitle>
          <AlertDescription>{texts.errorDescription}</AlertDescription>
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

export { RemoteSearchField };
export type { RemoteSearchFieldControl, RemoteSearchFieldProps };

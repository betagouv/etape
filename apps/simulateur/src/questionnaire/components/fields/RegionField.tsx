"use client";

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
} from "@etape/ui/components/combobox";

import type { RegionField as RegionFieldDef } from "../../domain/types";
import { useRegionSearch } from "../../hooks/useRegionSearch";
import { fieldErrorMark, joinIds } from "./aria";
import { FieldError } from "./FieldError";

interface RegionFieldProps {
  field: RegionFieldDef;
  value: string | undefined;
  onChange: (value: string | null) => void;
  labelledBy?: string;
  describedBy?: string;
  /** Message affiché sous le champ : région absente ou introuvable. */
  error?: string;
}

/** Annonce du nombre de régions proposées, selon ce qu'il en reste. */
function countAnnouncement(count: number): string {
  if (count === 0) return "Aucune région ne correspond à votre saisie.";
  return count === 1 ? "1 région proposée." : `${count} régions proposées.`;
}

/**
 * Choix d'une région en la cherchant par son nom (maquette Q7) : le champ filtre
 * la liste, affichée dessous dans le fil de la page.
 *
 * Le nombre de régions proposées est annoncé à chaque frappe, dans une région
 * `role="status"` toujours montée : la liste qui se raccourcit ne se voit pas
 * au lecteur d'écran.
 */
export function RegionField({
  field,
  value,
  onChange,
  labelledBy,
  describedBy,
  error,
}: RegionFieldProps) {
  const inputId = field.name;
  const listId = `${field.name}-list`;
  const hintId = field.hint ? `${field.name}-hint` : undefined;
  const errorId = `${field.name}-error`;

  const search = useRegionSearch({ idPrefix: field.name, value, onChange });
  // Sans région à proposer, la liste n'est pas déployée : seul le message
  // « Aucune région ne correspond » s'affiche à sa place.
  const isListShown = search.isOpen && search.regions.length > 0;

  return (
    <div className="flex w-full flex-col gap-2">
      {field.label && (
        <label htmlFor={inputId} className="text-foreground text-sm font-medium">
          {field.label}
        </label>
      )}
      <Combobox>
        <ComboboxInput
          id={inputId}
          value={search.text}
          placeholder={field.placeholder}
          aria-expanded={isListShown}
          aria-controls={listId}
          aria-activedescendant={search.activeCode ? search.optionId(search.activeCode) : undefined}
          // Le `<label for>` nomme le champ quand il existe ; sinon c'est le
          // titre de la question, seul texte disponible.
          aria-labelledby={field.label ? undefined : labelledBy}
          aria-describedby={joinIds(hintId, error ? errorId : undefined, describedBy)}
          aria-invalid={error ? true : undefined}
          {...fieldErrorMark(error)}
          {...search.inputHandlers}
        />
        <ComboboxList
          id={listId}
          aria-label={field.label ?? "Régions"}
          hidden={!isListShown}
          // Garde le focus dans le champ : sans cela, un clic sur une option ou
          // sur la barre de défilement le ferait sortir, et fermerait la liste
          // avant que le choix ne soit pris.
          onMouseDown={(event) => event.preventDefault()}
        >
          {search.regions.map((region) => (
            <ComboboxOption
              key={region.code}
              id={search.optionId(region.code)}
              selected={region.code === value}
              active={region.code === search.activeCode}
              onClick={() => search.select(region.code)}
            >
              {region.nom}
            </ComboboxOption>
          ))}
        </ComboboxList>
        {search.isOpen && search.regions.length === 0 && (
          <ComboboxEmpty>Aucune région ne correspond à votre saisie.</ComboboxEmpty>
        )}
      </Combobox>
      {field.hint && (
        // `content-secondary` et non `muted-foreground` : sur le fond de
        // l'encart en retrait, ce dernier n'atteint pas 4,5:1.
        <p id={hintId} className="text-content-secondary text-sm">
          {field.hint}
        </p>
      )}
      <FieldError id={errorId} message={error} />
      <p role="status" className="sr-only">
        {search.isOpen ? countAnnouncement(search.regions.length) : ""}
      </p>
    </div>
  );
}

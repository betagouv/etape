import type { ReactNode } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { RemoteSearchField } from "@etape/ui/components/remote-search-field";

import { ENTRY_MODE, type EntryMode } from "../domain/entry-mode";
import type { RemoteSearchDefinition } from "../hooks/use-remote-search";
import {
  useRemoteSearchEntry,
  type RemoteSearchEntryActions,
} from "../hooks/use-remote-search-entry";

/** La recherche : sa définition et le rendu d'un résultat dans la liste. */
export interface RemoteSearchEntrySearch<TItem> {
  definition: RemoteSearchDefinition<TItem>;
  renderOption: (item: TItem) => ReactNode;
}

/**
 * Où en est la saisie dans le formulaire, et de quoi l'y écrire. Le volet lit et écrit lui-même
 * ses champs : react-hook-form ne type pas `setValue` sur un formulaire générique.
 */
export interface RemoteSearchEntryState<
  TItem,
  TName extends string,
> extends RemoteSearchEntryActions<TItem, TName> {
  mode: EntryMode;
  item: TItem | null;
  /** Les champs de chaque mode : ceux du mode quitté perdent leurs erreurs. */
  fields: Record<EntryMode, readonly TName[]>;
}

/** Ce que reçoit la carte du résultat choisi, pour en changer. */
export interface RemoteSearchCardControl {
  /** Vrai quand la carte vient de remplacer la recherche : son bouton prend le focus. */
  isFocusRequested: boolean;
  onChange: () => void;
}

/** Ce que reçoivent les champs de la saisie manuelle, pour revenir à la recherche. */
export interface RemoteSearchManualFieldsControl {
  /** Vrai quand les champs viennent de remplacer la recherche : le premier prend le focus. */
  isFocusRequested: boolean;
  onSearch: () => void;
}

/** Ce que reçoit `RemoteSearchEntryField` : le champ du formulaire, sa recherche et ses trois contenus. */
export interface RemoteSearchEntryFieldProps<
  TItem,
  TName extends string,
  TFieldValues extends FieldValues,
> {
  control: Control<TFieldValues>;
  /** Le champ qui porte le résultat choisi : son erreur s'affiche sous la recherche. */
  name: FieldPath<TFieldValues>;
  search: RemoteSearchEntrySearch<TItem>;
  entry: RemoteSearchEntryState<TItem, TName>;
  renderCard: (item: TItem, control: RemoteSearchCardControl) => ReactNode;
  renderManualFields: (control: RemoteSearchManualFieldsControl) => ReactNode;
}

/**
 * Un champ qui se remplit par une recherche : la recherche, la carte du résultat choisi,
 * ou la saisie manuelle quand la recherche échoue.
 */
export function RemoteSearchEntryField<
  TItem,
  TName extends string,
  TFieldValues extends FieldValues,
>({
  control,
  name,
  search: { definition, renderOption },
  entry: { mode, item, fields, ...actions },
  renderCard,
  renderManualFields,
}: RemoteSearchEntryFieldProps<TItem, TName, TFieldValues>) {
  const { search, isFocusRequested, openManualEntry, openSearch, clearItem } = useRemoteSearchEntry(
    definition,
    mode,
    fields,
    actions,
  );

  if (mode === ENTRY_MODE.MANUAL) {
    return renderManualFields({ isFocusRequested, onSearch: openSearch });
  }

  if (item) {
    return renderCard(item, { isFocusRequested, onChange: clearItem });
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <RemoteSearchField
          search={search}
          definition={definition}
          control={{
            fieldRef: field.ref,
            onBlur: field.onBlur,
            error: fieldState.error,
            isFocusRequested,
          }}
          onManualEntry={openManualEntry}
          renderOption={renderOption}
        />
      )}
    />
  );
}

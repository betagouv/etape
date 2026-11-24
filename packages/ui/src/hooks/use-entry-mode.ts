"use client";

import { useState } from "react";

/** Les actions du formulaire dont dépend un changement de mode de saisie. */
export interface EntryModeActions<TMode extends string, TName extends string> {
  clearErrors: (names: TName[]) => void;
  setMode: (mode: TMode) => void;
}

/** La demande de focus et le changement de mode, à brancher sur les contenus qui se remplacent. */
export interface UseEntryModeResult<TMode extends string> {
  /** Vrai dès qu'un contenu en a remplacé un autre : celui qui s'affiche prend le focus. */
  isFocusRequested: boolean;
  requestFocus: () => void;
  switchMode: (nextMode: TMode) => void;
}

/**
 * Un champ qui se remplit de plusieurs façons (recherche ou saisie manuelle, comme autour de
 * `RemoteSearchField`) : changer de mode efface les erreurs des champs du mode quitté et
 * demande le focus. `mode` est la valeur en cours dans le formulaire, `fields` les champs
 * de chaque mode.
 */
export function useEntryMode<TMode extends string, TName extends string>(
  mode: TMode,
  fields: Record<TMode, readonly TName[]>,
  { clearErrors, setMode }: EntryModeActions<TMode, TName>,
): UseEntryModeResult<TMode> {
  // Les contenus se remplacent : sans cela, le focus tomberait sur la page.
  const [isFocusRequested, setFocusRequested] = useState(false);

  return {
    isFocusRequested,
    requestFocus: () => setFocusRequested(true),
    switchMode: (nextMode) => {
      // Quitter un mode efface les erreurs de ses champs.
      clearErrors([...fields[mode]]);
      setMode(nextMode);
      setFocusRequested(true);
    },
  };
}

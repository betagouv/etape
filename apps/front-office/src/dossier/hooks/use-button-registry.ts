import { useRef, type RefCallback } from "react";

/** Ce que renvoie `useButtonRegistry` : de quoi enregistrer le bouton de chaque élément d'une liste, et lui rendre le focus. */
export interface UseButtonRegistryResult {
  /** La référence à poser sur le bouton de l'élément `id`. */
  register: (id: string) => RefCallback<HTMLButtonElement>;
  /** Donne le focus au bouton de l'élément `id` ; faux s'il n'est plus affiché. */
  focus: (id: string) => boolean;
}

/** Les boutons d'une liste, par l'`id` de leur élément : ils reprennent le focus quand une action se referme. */
export function useButtonRegistry(): UseButtonRegistryResult {
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const register =
    (id: string): RefCallback<HTMLButtonElement> =>
    (button) => {
      if (button) buttons.current.set(id, button);
      else buttons.current.delete(id);
    };

  const focus = (id: string): boolean => {
    const button = buttons.current.get(id);
    button?.focus();
    return button !== undefined;
  };

  return { register, focus };
}

import { useEffect, useRef } from "react";

/**
 * Un focus à placer une fois le prochain rendu affiché : quand l'action s'exécute, l'élément
 * visé n'existe pas encore, ou celui qui porte le focus va disparaître. Le dernier focus
 * demandé avant le rendu l'emporte.
 */
export function useFocusAfterRender(): (focus: () => void) => void {
  const pendingFocus = useRef<(() => void) | null>(null);

  // Sans dépendances : le rendu qui suit la demande est celui qui affiche l'élément visé.
  useEffect(() => {
    pendingFocus.current?.();
    pendingFocus.current = null;
  });

  return (focus) => {
    pendingFocus.current = focus;
  };
}

"use client";

import { useEffect, useRef } from "react";

/** Les deux écouteurs à poser sur le conteneur surveillé. */
export interface UseFocusLeaveResult {
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * Prévient quand le focus quitte un conteneur pour de bon. Les événements de focus de React
 * remontent aussi depuis les portails : ouvrir une liste rendue ailleurs dans la page (`Select`,
 * `Popover`) ne compte pas comme une sortie.
 */
export function useFocusLeave(onLeave: () => void): UseFocusLeaveResult {
  const isInside = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeout.current), []);

  return {
    onFocus: () => {
      isInside.current = true;
    },
    onBlur: () => {
      isInside.current = false;
      clearTimeout(timeout.current);
      // D'un élément à l'autre du conteneur, le focus en sort un instant : on attend le suivant.
      timeout.current = setTimeout(() => {
        if (!isInside.current) onLeave();
      });
    },
  };
}

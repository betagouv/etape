import { useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

const NO_ACTIVE = -1;

export interface UseListboxNavigationResult<T> {
  /** L'option désignée au clavier, pour `aria-activedescendant`. */
  active: T | null;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  reset: () => void;
}

/**
 * Flèches et Entrée dans une liste d'options, le focus restant dans le champ
 * (motif combobox de l'APG, `aria-activedescendant`).
 */
export function useListboxNavigation<T>(
  items: readonly T[],
  optionId: (item: T) => string,
  onSelect: (item: T) => void,
): UseListboxNavigationResult<T> {
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE);
  const active = items[activeIndex] ?? null;

  function activate(index: number): void {
    flushSync(() => setActiveIndex(index));
    document.getElementById(optionId(items[index]))?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    const last = items.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (last >= 0) activate(Math.min(activeIndex + 1, last));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (last >= 0) activate(activeIndex > 0 ? activeIndex - 1 : last);
        return;
      case "Enter":
        if (!active) return;
        event.preventDefault();
        onSelect(active);
        setActiveIndex(NO_ACTIVE);
        return;
    }
  }

  return { active, onKeyDown, reset: () => setActiveIndex(NO_ACTIVE) };
}

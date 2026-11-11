"use client";

import { useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import { KEY } from "@etape/ui/lib/keys";

/** Les options de la liste, l'`id` de chacune dans la page, et ce que déclenchent Entrée et Échap. */
export interface UseListboxNavigationOptions<T> {
  items: readonly T[];
  optionId: (item: T) => string;
  /** Liste fermée, ni flèche ni Entrée ne désignent une option masquée. Ouverte par défaut. */
  isOpen?: boolean;
  onSelect: (item: T) => void;
  onEscape?: () => void;
}

/** L'option désignée au clavier, le gestionnaire à poser sur le champ, et sa remise à zéro. */
export interface UseListboxNavigationResult<T> {
  /** L'option désignée au clavier, pour `aria-activedescendant`. */
  active: T | null;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  reset: () => void;
}

/**
 * Flèches, Entrée et Échap dans une liste d'options, le focus restant dans le champ
 * (motif combobox de l'APG, `aria-activedescendant`). Le complément des parties de
 * `combobox.tsx`, qui ne portent que l'apparence et les rôles.
 */
export function useListboxNavigation<T>({
  items,
  optionId,
  isOpen = true,
  onSelect,
  onEscape,
}: UseListboxNavigationOptions<T>): UseListboxNavigationResult<T> {
  // Par son id, pas par sa position : quand la liste change, une option disparue cesse d'être désignée.
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIndex = items.findIndex((item) => optionId(item) === activeId);
  const active = items[activeIndex] ?? null;

  function activate(index: number): void {
    const id = optionId(items[index]);
    flushSync(() => setActiveId(id));
    document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === KEY.ESCAPE) {
      setActiveId(null);
      onEscape?.();
      return;
    }
    if (!isOpen) return;

    const last = items.length - 1;
    switch (event.key) {
      case KEY.ARROW_DOWN:
        event.preventDefault();
        if (last >= 0) activate(Math.min(activeIndex + 1, last));
        return;
      case KEY.ARROW_UP:
        event.preventDefault();
        if (last >= 0) activate(activeIndex > 0 ? activeIndex - 1 : last);
        return;
      case KEY.ENTER:
        if (!active) return;
        event.preventDefault();
        onSelect(active);
        setActiveId(null);
        return;
    }
  }

  return { active, onKeyDown, reset: () => setActiveId(null) };
}

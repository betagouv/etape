"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import {
  findRegionByName,
  findRegions,
  isRegionCode,
  regionName,
  type Region,
} from "../domain/regions";

interface UseRegionSearchOptions {
  /** Préfixe des `id` des options, unique sur l'écran (le nom du champ). */
  idPrefix: string;
  value: string | undefined;
  onChange: (value: string | null) => void;
}

export interface RegionSearchInputHandlers {
  onFocus: () => void;
  onClick: () => void;
  onBlur: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export interface UseRegionSearchResult {
  text: string;
  isOpen: boolean;
  regions: readonly Region[];
  activeCode: string | null;
  /** `id` de l'option d'une région, pour `aria-activedescendant`. */
  optionId: (code: string) => string;
  inputHandlers: RegionSearchInputHandlers;
  select: (code: string) => void;
}

const NO_ACTIVE = -1;

/**
 * Combobox à autocomplétion (APG W3C) : focus dans le champ, option désignée par
 * `aria-activedescendant` ; Échap ferme puis vide. Chaque frappe est enregistrée :
 * un nom complet vaut un choix, sinon la validation déclare le texte invalide.
 */
export function useRegionSearch({
  idPrefix,
  value,
  onChange,
}: UseRegionSearchOptions): UseRegionSearchResult {
  // `null` hors saisie : on affiche le nom officiel de la région retenue.
  const [draft, setDraft] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE);

  const chosen = isRegionCode(value) ? value : null;
  const typedValue = chosen ? "" : (value ?? "");
  const text = draft ?? (chosen ? (regionName(chosen) ?? "") : typedValue);
  // Une région déjà retenue ne filtre pas la liste : rouvrir le champ les propose toutes.
  const regions = findRegions(draft ?? typedValue);
  const active = activeIndex < regions.length ? activeIndex : NO_ACTIVE;
  const activeCode = isOpen && active !== NO_ACTIVE ? regions[active].code : null;

  const optionId = (code: string) => `${idPrefix}-option-${code}`;

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setActiveIndex(NO_ACTIVE);
  }

  function select(code: string) {
    onChange(code);
    setDraft(null);
    close();
  }

  function activate(index: number) {
    // Monter la liste avant de faire défiler : masquée, l'option ne défilerait pas.
    flushSync(() => {
      setIsOpen(true);
      setActiveIndex(index);
    });
    const code = regions[index]?.code;
    if (code) document.getElementById(optionId(code))?.scrollIntoView({ block: "nearest" });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    // Aucun nom de région ne contient de chiffre : en refuser la frappe garantit
    // aussi qu'un texte saisi ne se confonde jamais avec un code INSEE.
    const typed = event.target.value.replace(/\d/g, "");
    setDraft(typed);
    setActiveIndex(NO_ACTIVE);
    open();
    onChange(findRegionByName(typed) ?? (typed.trim() === "" ? null : typed));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const last = regions.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (last >= 0) activate(isOpen ? Math.min(active + 1, last) : 0);
        else open();
        return;
      case "ArrowUp":
        event.preventDefault();
        if (last >= 0) activate(isOpen && active > 0 ? active - 1 : last);
        else open();
        return;
      case "Enter":
        if (activeCode === null) return;
        event.preventDefault();
        select(activeCode);
        return;
      case "Escape":
        event.preventDefault();
        if (isOpen) {
          close();
          return;
        }
        setDraft("");
        onChange(null);
        return;
    }
  }

  return {
    text,
    isOpen,
    regions,
    activeCode,
    optionId,
    inputHandlers: {
      onFocus: open,
      // La liste fermée par Échap ou par un choix se rouvre au clic, sans
      // devoir quitter le champ.
      onClick: open,
      onBlur: () => {
        setDraft(null);
        close();
      },
      onChange: handleChange,
      onKeyDown: handleKeyDown,
    },
    select,
  };
}

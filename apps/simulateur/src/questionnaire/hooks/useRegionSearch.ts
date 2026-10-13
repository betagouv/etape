"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";

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
  /** Réponse enregistrée : un code de région, ou le texte saisi s'il n'en désigne aucune. */
  value: string | undefined;
  onChange: (value: string | null) => void;
}

/** Ce que le champ branche sur son `<input>`. */
export interface RegionSearchInputHandlers {
  onFocus: () => void;
  onClick: () => void;
  onBlur: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export interface UseRegionSearchResult {
  /** Contenu du champ. */
  text: string;
  isOpen: boolean;
  /** Régions proposées, dans l'ordre d'affichage. */
  regions: readonly Region[];
  /** Région désignée au clavier, `null` quand aucune ne l'est. */
  activeCode: string | null;
  /** `id` de l'option d'une région, pour `aria-activedescendant`. */
  optionId: (code: string) => string;
  inputHandlers: RegionSearchInputHandlers;
  /** Retenir une région de la liste. */
  select: (code: string) => void;
}

/** Aucune option désignée au clavier. */
const NO_ACTIVE = -1;

/**
 * Recherche d'une région dans la liste fermée, au clavier ou à la souris —
 * comportement du motif « combobox » de l'APG W3C, liste à autocomplétion.
 *
 * - La liste s'ouvre avec le focus, se filtre à la frappe, se ferme au choix
 *   d'une région, à Échap et à la sortie du champ.
 * - Flèches haut et bas : désignent une option, que la touche Entrée retient.
 *   Le focus reste dans le champ ; l'option n'est désignée que par
 *   `aria-activedescendant`.
 * - Échap, liste fermée : vide le champ.
 *
 * La saisie est enregistrée à chaque frappe : un nom complet (« normandie »)
 * vaut un choix, tout autre texte est gardé tel quel, et c'est la validation
 * qui le déclare invalide à la sortie du champ.
 */
export function useRegionSearch({
  idPrefix,
  value,
  onChange,
}: UseRegionSearchOptions): UseRegionSearchResult {
  // Texte en cours de frappe. `null` hors saisie : le champ affiche alors le
  // nom de la région retenue, avec son orthographe, quelle que soit la casse
  // tapée.
  const [draft, setDraft] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(NO_ACTIVE);

  const chosen = isRegionCode(value) ? value : null;
  const text = draft ?? (chosen ? (regionName(chosen) ?? "") : (value ?? ""));
  // Une région déjà retenue ne filtre pas la liste : rouvrir le champ propose
  // toutes les régions, pour en changer.
  const regions = findRegions(draft ?? (chosen ? "" : (value ?? "")));
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

  /** Désigne une option et la fait défiler dans la liste si elle est masquée. */
  function activate(index: number) {
    setActiveIndex(index);
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
        open();
        if (last >= 0) activate(isOpen ? Math.min(active + 1, last) : 0);
        return;
      case "ArrowUp":
        event.preventDefault();
        open();
        if (last >= 0) activate(isOpen && active > 0 ? active - 1 : last);
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

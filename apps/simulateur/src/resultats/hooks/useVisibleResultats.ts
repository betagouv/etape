"use client";

import { useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";

import { INITIAL_RESULTAT_COUNT } from "../domain/selection";
import type { ResultatAffiche } from "../domain/types";

export interface UseVisibleResultatsResult {
  visibleResultats: ResultatAffiche[];
  hiddenCount: number;
  announcement: string;
  firstRevealedRef: RefObject<HTMLHeadingElement | null>;
  showMore: () => void;
}

function revealAnnouncement(count: number): string {
  return count === 1
    ? `${count} résultat supplémentaire affiché.`
    : `${count} résultats supplémentaires affichés.`;
}

/**
 * Le bouton « Afficher plus » disparaît au clic : le focus part sur le titre de
 * la première carte révélée, sans quoi il retomberait sur `<body>`. `flushSync`
 * monte cette carte avant l'appel à `focus()`.
 */
export function useVisibleResultats(resultats: ResultatAffiche[]): UseVisibleResultatsResult {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstRevealedRef = useRef<HTMLHeadingElement | null>(null);

  const extraCount = Math.max(resultats.length - INITIAL_RESULTAT_COUNT, 0);
  const hiddenCount = isExpanded ? 0 : extraCount;
  const visibleResultats = resultats.slice(0, resultats.length - hiddenCount);
  const announcement = isExpanded && extraCount > 0 ? revealAnnouncement(extraCount) : "";

  function showMore() {
    flushSync(() => setIsExpanded(true));
    firstRevealedRef.current?.focus();
  }

  return { visibleResultats, hiddenCount, announcement, firstRevealedRef, showMore };
}

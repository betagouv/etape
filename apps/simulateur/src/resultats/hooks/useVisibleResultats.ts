"use client";

import { useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";

import { NOMBRE_RESULTATS_INITIAL } from "../domain/selection";
import type { ResultatAffiche } from "../domain/types";

export interface UseVisibleResultatsResult {
  visibleResultats: ResultatAffiche[];
  hiddenCount: number;
  announcement: string;
  firstRevealedRef: RefObject<HTMLHeadingElement | null>;
  showMore: () => void;
}

function revealAnnouncement(count: number): string {
  return count <= 1
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

  const hiddenCount = isExpanded ? 0 : Math.max(resultats.length - NOMBRE_RESULTATS_INITIAL, 0);
  const visibleResultats = isExpanded ? resultats : resultats.slice(0, NOMBRE_RESULTATS_INITIAL);
  const revealedCount = resultats.length - NOMBRE_RESULTATS_INITIAL;
  const announcement = isExpanded && revealedCount > 0 ? revealAnnouncement(revealedCount) : "";

  function showMore() {
    flushSync(() => setIsExpanded(true));
    firstRevealedRef.current?.focus();
  }

  return { visibleResultats, hiddenCount, announcement, firstRevealedRef, showMore };
}

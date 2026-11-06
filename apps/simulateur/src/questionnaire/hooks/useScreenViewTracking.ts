"use client";

import { useEffect, useRef } from "react";
import { trackPageView } from "@etape/analytics";

import { STEP_PARAM } from "./useFlowNavigation";

/**
 * Une page vue par écran du questionnaire. Les étapes changent par
 * `history.pushState`, que la mesure des chemins ne voit pas : c'est ici qu'on
 * les compte, sur l'identifiant de l'écran, jamais sur les réponses.
 *
 * Le premier écran affiché est sauté : la page vue du chargement l'a déjà
 * compté. Avant l'hydratation, l'écran calculé sur des réponses encore vides
 * n'est pas celui qu'on affichera.
 */
export function useScreenViewTracking(screenId: string | undefined, isHydrated: boolean): void {
  const lastScreenId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isHydrated || !screenId) return;

    const previousScreenId = lastScreenId.current;
    lastScreenId.current = screenId;
    if (previousScreenId === undefined || previousScreenId === screenId) return;

    trackPageView(`${window.location.pathname}?${STEP_PARAM}=${screenId}`, document.title);
  }, [isHydrated, screenId]);
}

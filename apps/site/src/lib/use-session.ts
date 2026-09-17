"use client";

import { useEffect, useState } from "react";

import { SESSION_URL, type PublicSession } from "@/lib/auth";

/**
 * `loading` est un état à part entière : sans lui, l'interface afficherait
 * « Se connecter » à quelqu'un qui l'est déjà, le temps d'un aller-retour.
 */
export type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; session: PublicSession };

/**
 * Partagée entre les composants qui interrogent la session au même instant — sur
 * `/compte/`, l'en-tête et le corps de page montent ensemble. Seule la requête
 * *en vol* l'est, jamais son résultat : une session expirée entre-temps est vue
 * comme telle.
 */
let pendingRequest: Promise<SessionState> | null = null;

function fetchSession(): Promise<SessionState> {
  pendingRequest ??= fetch(SESSION_URL, { credentials: "include" })
    .then(async (response): Promise<SessionState> => {
      if (!response.ok) return { status: "anonymous" };
      return { status: "authenticated", session: (await response.json()) as PublicSession };
    })
    .catch((): SessionState => ({ status: "anonymous" }))
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}

/** `credentials: "include"` sans quoi le cookie ne partirait pas, et tout serait 401. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    // Pas d'interruption au démontage : un autre composant attend peut-être la
    // requête partagée. Seule la mise à jour d'état est abandonnée.
    let isMounted = true;

    void fetchSession().then((result) => {
      if (isMounted) setState(result);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

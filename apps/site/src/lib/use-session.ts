"use client";

import { useEffect, useState } from "react";

import { SESSION_URL, type SessionPublique } from "@/lib/auth";

/**
 * `chargement` est un état à part entière : sans lui, l'interface afficherait
 * « Se connecter » à quelqu'un qui l'est déjà, le temps d'un aller-retour.
 */
export type EtatSession =
  { etat: "chargement" } | { etat: "anonyme" } | { etat: "connecte"; session: SessionPublique };

/**
 * Partagée entre les composants qui interrogent la session au même instant — sur
 * `/compte/`, l'en-tête et le corps de page montent ensemble. Seule la requête
 * *en vol* l'est, jamais son résultat : une session expirée entre-temps est vue
 * comme telle.
 */
let requeteEnCours: Promise<EtatSession> | null = null;

function interrogerSession(): Promise<EtatSession> {
  requeteEnCours ??= fetch(SESSION_URL, { credentials: "include" })
    .then(async (reponse): Promise<EtatSession> => {
      if (!reponse.ok) return { etat: "anonyme" };
      return { etat: "connecte", session: (await reponse.json()) as SessionPublique };
    })
    .catch((): EtatSession => ({ etat: "anonyme" }))
    .finally(() => {
      requeteEnCours = null;
    });

  return requeteEnCours;
}

/** `credentials: "include"` sans quoi le cookie ne partirait pas, et tout serait 401. */
export function useSession(): EtatSession {
  const [etat, setEtat] = useState<EtatSession>({ etat: "chargement" });

  useEffect(() => {
    // Pas d'interruption au démontage : un autre composant attend peut-être la
    // requête partagée. Seule la mise à jour d'état est abandonnée.
    let monte = true;

    void interrogerSession().then((resultat) => {
      if (monte) setEtat(resultat);
    });

    return () => {
      monte = false;
    };
  }, []);

  return etat;
}

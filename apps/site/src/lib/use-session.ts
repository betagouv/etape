"use client";

import { useEffect, useState } from "react";

import { SESSION_URL, type SessionPublique } from "@/lib/auth";

/**
 * État de la session, du point de vue du navigateur.
 *
 * `chargement` est un état à part entière et non un `null` : sans lui,
 * l'interface afficherait « Se connecter » le temps d'un aller-retour à
 * quelqu'un qui l'est déjà, ce qui donne un clignotement désagréable et
 * trompeur.
 */
export type EtatSession =
  { etat: "chargement" } | { etat: "anonyme" } | { etat: "connecte"; session: SessionPublique };

/**
 * Interroge l'API sur l'état de connexion.
 *
 * Le site étant un export statique, rien ne peut être décidé au build : la
 * question se pose forcément depuis le navigateur. `credentials: "include"` est
 * indispensable — sans lui le cookie de session ne serait pas envoyé, et toute
 * réponse serait un 401.
 */
export function useSession(): EtatSession {
  const [etat, setEtat] = useState<EtatSession>({ etat: "chargement" });

  useEffect(() => {
    // Évite de poser un état sur un composant démonté si l'on quitte la page
    // pendant la requête.
    const controleur = new AbortController();

    fetch(SESSION_URL, { credentials: "include", signal: controleur.signal })
      .then(async (reponse) => {
        if (!reponse.ok) return { etat: "anonyme" } as const;
        return { etat: "connecte", session: (await reponse.json()) as SessionPublique } as const;
      })
      .then(setEtat)
      .catch((erreur: unknown) => {
        // Une requête interrompue n'est pas une déconnexion : laisser l'état tel
        // quel, le composant part de toute façon.
        if (erreur instanceof DOMException && erreur.name === "AbortError") return;
        setEtat({ etat: "anonyme" });
      });

    return () => controleur.abort();
  }, []);

  return etat;
}

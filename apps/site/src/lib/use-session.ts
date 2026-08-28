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
 * Requête en cours, partagée entre tous les composants qui interrogent la
 * session au même instant.
 *
 * Sur `/compte/`, l'en-tête et le corps de page montent ensemble et posaient
 * chacun leur question : deux allers-retours pour une seule réponse. Seule la
 * requête *en vol* est mise en commun, jamais son résultat — un montage
 * ultérieur redemande, et une session expirée entre-temps est vue comme telle.
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
    // La requête étant partagée, elle n'est pas interrompue au démontage : un
    // autre composant l'attend peut-être encore. Seule la mise à jour d'état
    // est abandonnée.
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

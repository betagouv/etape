"use client";

import { useEffect, useState } from "react";

import { SESSION_URL, type SessionPublique } from "@/lib/auth";

/**
 * `chargement` est un état à part entière et non un `null` : sans lui,
 * l'interface afficherait « Se connecter » le temps d'un aller-retour à
 * quelqu'un qui l'est déjà.
 */
export type EtatSession =
  { etat: "chargement" } | { etat: "anonyme" } | { etat: "connecte"; session: SessionPublique };

/**
 * Requête partagée entre les composants qui interrogent la session au même
 * instant : sur `/compte/`, l'en-tête et le corps de page montent ensemble et
 * posaient chacun la leur.
 *
 * Seule la requête *en vol* est mise en commun, jamais son résultat : un montage
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
 * Le site étant un export statique, la question se pose forcément depuis le
 * navigateur. `credentials: "include"` est indispensable : sans lui le cookie ne
 * serait pas envoyé, et toute réponse serait un 401.
 */
export function useSession(): EtatSession {
  const [etat, setEtat] = useState<EtatSession>({ etat: "chargement" });

  useEffect(() => {
    // La requête partagée n'est pas interrompue au démontage — un autre
    // composant l'attend peut-être. Seule la mise à jour d'état est abandonnée.
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

"use client";

import Link from "next/link";

import { Button } from "@etape/ui/components/button";

import { avecRetour, COMPTE_PATH, LOGIN_URL } from "@/lib/auth";
import { useSession } from "@/lib/use-session";

/**
 * Entrée d'authentification de l'en-tête.
 *
 * Deux états, et un troisième qui n'en est pas moins visible : le temps de
 * l'aller-retour vers l'API, la place du bouton est réservée. Sans cela
 * l'en-tête sauterait à chaque chargement de page, et afficherait brièvement
 * « Se connecter » à quelqu'un qui l'est déjà.
 */
export function AuthMenu() {
  const etat = useSession();

  if (etat.etat === "chargement") {
    return <div aria-hidden className="bg-muted h-9 w-32 shrink-0 animate-pulse rounded-md" />;
  }

  if (etat.etat === "connecte") {
    return (
      <Button asChild variant="outline" className="shrink-0">
        <Link href={COMPTE_PATH}>Mon compte</Link>
      </Button>
    );
  }

  /*
    Un lien, pas un bouton : la connexion quitte le site pour `apps/api`, qui
    redirige ensuite vers Keycloak. `<a>` et non `<Link>`, Next ne pouvant pas
    router vers une origine qu'il ne sert pas.

    `returnTo` ramène sur la page de compte plutôt que sur l'accueil : sinon,
    quelqu'un déjà connecté à Keycloak repasse par tout le parcours pour
    revenir là d'où il vient, et a l'impression que le bouton n'a rien fait.
  */
  return (
    <Button asChild className="shrink-0">
      <a href={avecRetour(LOGIN_URL, COMPTE_PATH)}>Se connecter</a>
    </Button>
  );
}

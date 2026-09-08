"use client";

import Link from "next/link";

import { Button } from "@etape/ui/components/button";

import { avecRetour, COMPTE_PATH, LOGIN_URL } from "@/lib/auth";
import { useSession } from "@/lib/use-session";

/**
 * La place du bouton est réservée pendant l'aller-retour vers l'API : sans cela
 * l'en-tête sauterait à chaque chargement de page.
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
    `<a>` et non `<Link>` : Next ne route pas vers une origine qu'il ne sert pas.
    `returnTo` évite que quelqu'un déjà connecté à Keycloak repasse par tout le
    parcours pour revenir là d'où il vient, et croie le bouton inerte.
  */
  return (
    <Button asChild className="shrink-0">
      <a href={avecRetour(LOGIN_URL, COMPTE_PATH)}>Se connecter</a>
    </Button>
  );
}

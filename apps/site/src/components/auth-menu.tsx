"use client";

import Link from "next/link";

import { Button } from "@etape/ui/components/button";

import { ACCOUNT_PATH, LOGIN_URL, withReturnTo } from "@/lib/auth";
import { useSession } from "@/lib/use-session";

/**
 * La place du bouton est réservée pendant l'aller-retour vers l'API : sans cela
 * l'en-tête sauterait à chaque chargement de page.
 */
export function AuthMenu() {
  const sessionState = useSession();

  if (sessionState.status === "loading") {
    return <div aria-hidden className="bg-muted h-9 w-32 shrink-0 animate-pulse rounded-md" />;
  }

  if (sessionState.status === "authenticated") {
    return (
      <Button asChild variant="outline" className="shrink-0">
        <Link href={ACCOUNT_PATH}>Mon compte</Link>
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
      <a href={withReturnTo(LOGIN_URL, ACCOUNT_PATH)}>Se connecter</a>
    </Button>
  );
}

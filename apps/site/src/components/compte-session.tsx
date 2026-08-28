"use client";

import { Badge } from "@etape/ui/components/badge";
import { Button } from "@etape/ui/components/button";
import { Section } from "@etape/ui/components/section";
import { Separator } from "@etape/ui/components/separator";

import { avecRetour, COMPTE_PATH, LOGIN_URL, LOGOUT_URL } from "@/lib/auth";
import { useSession } from "@/lib/use-session";

/**
 * Affichage seulement, jamais filtrage : un champ absent de cette table est
 * montré sous son nom technique — c'est l'objet même de cette page.
 */
const LIBELLES: Record<string, string> = {
  given_name: "Prénom",
  family_name: "Nom",
  name: "Nom complet",
  preferred_username: "Identifiant",
  email: "Adresse électronique",
  email_verified: "Adresse vérifiée",
  birthdate: "Date de naissance",
  birthplace: "Lieu de naissance",
  birthcountry: "Pays de naissance",
  gender: "Genre",
  identity_provider: "Fournisseur d'identité",
  acr: "Niveau de garantie eIDAS",
  amr: "Méthode d'authentification",
};

function formater(valeur: unknown): string {
  if (typeof valeur === "boolean") return valeur ? "oui" : "non";
  if (Array.isArray(valeur)) return valeur.map(formater).join(", ");
  if (valeur !== null && typeof valeur === "object") return JSON.stringify(valeur);
  return String(valeur);
}

/** Plutôt que `SectionHeader`, qui rend un `<h2>` : cette page ouvre le plan. */
function EnTete({ titre, chapo }: { titre: string; chapo: string }) {
  return (
    <div className="flex flex-col items-start gap-2 text-left lg:gap-4">
      <h1 className="text-h1 font-bold">{titre}</h1>
      <p className="text-body-lg text-muted-foreground">{chapo}</p>
    </div>
  );
}

function Champ({ nom, valeur }: { nom: string; valeur: unknown }) {
  const libelle = LIBELLES[nom];

  return (
    <div className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-muted-foreground text-sm">
        {libelle ?? nom}
        {/* Le nom technique sert à discuter avec le portail partenaires. */}
        {libelle ? <span className="block font-mono text-xs opacity-60">{nom}</span> : null}
      </dt>
      <dd className="text-foreground font-medium break-words sm:col-span-2">{formater(valeur)}</dd>
    </div>
  );
}

/** Montre l'identité telle qu'elle arrive, sans remise en forme. */
export function CompteSession() {
  const etat = useSession();

  if (etat.etat === "chargement") {
    return (
      <Section>
        <p className="text-muted-foreground" aria-live="polite">
          Vérification de la session…
        </p>
      </Section>
    );
  }

  if (etat.etat === "anonyme") {
    return (
      <Section>
        <EnTete
          titre="Vous n'êtes pas connecté"
          chapo="Cette page rend compte de la session en cours. Connectez-vous pour voir l'identité transmise."
        />
        <Button asChild className="mt-8">
          <a href={avecRetour(LOGIN_URL, COMPTE_PATH)}>Se connecter</a>
        </Button>
      </Section>
    );
  }

  const { session } = etat;
  const champs = Object.entries(session.claims).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Section>
      <EnTete
        titre="Vous êtes connecté"
        chapo="Voici l'identité transmise par le fournisseur, telle que l'API la reçoit."
      />

      <Badge className="mt-6" variant={session.viaFranceConnect ? "default" : "secondary"}>
        {session.viaFranceConnect ? "Connecté via FranceConnect" : "Compte ETAPE"}
      </Badge>

      <dl className="mt-8">
        <Champ nom="sub" valeur={session.sub} />
        <Separator />
        {champs.map(([nom, valeur], index) => (
          <div key={nom}>
            <Champ nom={nom} valeur={valeur} />
            {index < champs.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </dl>

      {champs.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          {
            "Aucun champ d'identité au-delà de l'identifiant. Le fournisseur n'en a transmis aucun autre, ou les mappers correspondants manquent côté Keycloak."
          }
        </p>
      ) : null}

      <div className="mt-10">
        {/* `<a>` : la déconnexion quitte le site pour l'API, qui propage ensuite. */}
        <Button asChild variant="outline">
          <a href={LOGOUT_URL}>Se déconnecter</a>
        </Button>
      </div>
    </Section>
  );
}

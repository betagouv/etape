"use client";

import { Badge } from "@etape/ui/components/badge";
import { Button } from "@etape/ui/components/button";
import { Section } from "@etape/ui/components/section";

import { ACCOUNT_PATH, LOGIN_URL, LOGOUT_URL, withReturnTo } from "@/lib/auth";
import { useSession, type SessionState } from "@/lib/use-session";

/**
 * Affichage seulement, jamais filtrage : un champ absent de cette table est
 * montré sous son nom technique — c'est l'objet même de cette page.
 */
const CLAIM_LABELS: Record<string, string> = {
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

function formatValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "oui" : "non";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Plutôt que `SectionHeader`, qui rend un `<h2>` : cette page ouvre le plan. */
function PageHeader({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="flex flex-col items-start gap-2 text-left lg:gap-4">
      <h1 className="text-h1 font-bold">{title}</h1>
      <p className="text-body-lg text-muted-foreground">{lead}</p>
    </div>
  );
}

const SESSION_ANNOUNCEMENTS: Record<SessionState["status"], string> = {
  loading: "Vérification de la session en cours.",
  anonymous: "Session vérifiée : aucune connexion en cours.",
  authenticated: "Session vérifiée : connexion en cours.",
};

function ClaimRow({ name, value }: { name: string; value: unknown }) {
  const label = CLAIM_LABELS[name];

  return (
    <div className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-muted-foreground text-sm">
        {label ?? name}
        {/* Le nom technique sert à discuter avec le portail partenaires. */}
        {label ? <span className="block font-mono text-xs opacity-60">{name}</span> : null}
      </dt>
      <dd className="text-foreground font-medium break-words sm:col-span-2">
        {formatValue(value)}
      </dd>
    </div>
  );
}

/** Montre l'identité telle qu'elle arrive, sans remise en forme. */
export function AccountDetails() {
  const sessionState = useSession();

  return (
    <>
      <p role="status" className="sr-only">
        {SESSION_ANNOUNCEMENTS[sessionState.status]}
      </p>
      <AccountDetailsContent sessionState={sessionState} />
    </>
  );
}

function AccountDetailsContent({ sessionState }: { sessionState: SessionState }) {
  if (sessionState.status === "loading") {
    return (
      <Section>
        <p className="text-muted-foreground">Vérification de la session…</p>
      </Section>
    );
  }

  if (sessionState.status === "anonymous") {
    return (
      <Section>
        <PageHeader
          title="Vous n'êtes pas connecté"
          lead="Cette page rend compte de la session en cours. Connectez-vous pour voir l'identité transmise."
        />
        <Button asChild className="mt-8">
          <a href={withReturnTo(LOGIN_URL, ACCOUNT_PATH)}>Se connecter</a>
        </Button>
      </Section>
    );
  }

  const { session } = sessionState;
  const claims = Object.entries(session.claims).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Section>
      <PageHeader
        title="Vous êtes connecté"
        lead="Voici l'identité transmise par le fournisseur, telle que l'API la reçoit."
      />

      <Badge className="mt-6" variant={session.isFranceConnectSession ? "default" : "secondary"}>
        {session.isFranceConnectSession ? "Connecté via FranceConnect" : "Compte ETAPE"}
      </Badge>

      <dl className="divide-border mt-8 divide-y">
        <ClaimRow name="sub" value={session.sub} />
        {claims.map(([name, value]) => (
          <ClaimRow key={name} name={name} value={value} />
        ))}
      </dl>

      {claims.length === 0 ? (
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

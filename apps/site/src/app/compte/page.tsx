import type { Metadata } from "next";

import { CompteSession } from "@/components/compte-session";

export const metadata: Metadata = {
  title: "Votre connexion — ETAPE",
  description: "État de la session et identité transmise par le fournisseur d'identité.",
  // Page de compte : elle n'a rien à faire dans un index, et son contenu
  // dépend de toute façon d'une session que le robot n'aura jamais.
  robots: { index: false, follow: false },
};

export default function Compte() {
  return <CompteSession />;
}

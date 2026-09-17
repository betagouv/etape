import type { Metadata } from "next";

import { AccountDetails } from "@/components/account-details";

export const metadata: Metadata = {
  title: "Votre connexion — ETAPE",
  description: "État de la session et identité transmise par le fournisseur d'identité.",
  // Page de compte : elle n'a rien à faire dans un index, et son contenu
  // dépend de toute façon d'une session que le robot n'aura jamais.
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountDetails />;
}

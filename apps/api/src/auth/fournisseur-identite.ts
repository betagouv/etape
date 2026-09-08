import { claimTexte } from "./identity-claims.js";

export const FOURNISSEUR_LOCAL = "local";

export function fournisseurIdentite(claims: Record<string, unknown>): string {
  return claimTexte(claims.identity_provider) ?? FOURNISSEUR_LOCAL;
}

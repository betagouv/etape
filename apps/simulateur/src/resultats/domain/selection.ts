// Sélection des cartes affichées : filtrer le catalogue avec le profil, puis
// ordonner par catégorie (Interlocuteurs → Outils → Dispositifs).
//
// L'ordre vient de `CATEGORIES` et le rang à l'intérieur d'une catégorie de
// l'ordre de déclaration du catalogue : parcourir les catégories dans l'ordre
// suffit, sans tri à comparateur.

import type { RegionCode } from "@/questionnaire/domain/regions";

import { CATALOGUE } from "./catalogue";
import type { Profil } from "./profil";
import { CATEGORIES, type Resultat, type ResultatAffiche } from "./types";

/** Résout le lien d'une carte pour la région de l'utilisateur. */
function lien(url: Resultat["url"], region: RegionCode | null): string {
  return typeof url === "function" ? url(region) : url;
}

/** Cartes retenues pour ce profil, dans l'ordre d'affichage. */
export function selectResultats(profil: Profil): ResultatAffiche[] {
  const retenus = CATALOGUE.filter((resultat) => resultat.quand(profil));

  return CATEGORIES.flatMap((categorie) =>
    retenus
      .filter((resultat) => resultat.categorie === categorie)
      .map(({ id, nom, description, url }) => ({
        id,
        categorie,
        nom,
        description,
        url: lien(url, profil.region),
      })),
  );
}

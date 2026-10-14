// Sélection des cartes affichées : filtrer le catalogue avec le profil, puis
// ordonner par catégorie (Interlocuteurs → Outils → Dispositifs).
//
// L'ordre vient de `CATEGORIES` et le rang à l'intérieur d'une catégorie de
// l'ordre de déclaration du catalogue : parcourir les catégories dans l'ordre
// suffit, sans tri à comparateur. Seule exception : le résultat prioritaire
// passe en tête, quelle que soit sa catégorie.

import { CATALOGUE } from "./catalogue";
import type { Profil } from "./profil";
import { CATEGORIES, type Resultat, type ResultatAffiche } from "./types";

export const INITIAL_RESULTAT_COUNT = 10;

/** Le premier présent devient le résultat prioritaire. */
const ORDRE_RESULTAT_PRIORITAIRE = ["demission-reconversion", "cep"];

function resolveUrl(url: Resultat["url"], profil: Profil): string {
  return typeof url === "function" ? url(profil) : url;
}

/** Cartes retenues pour ce profil, dans l'ordre d'affichage. */
export function selectResultats(profil: Profil): ResultatAffiche[] {
  const selected = CATALOGUE.filter((resultat) => resultat.quand(profil));
  const prioritaireId = ORDRE_RESULTAT_PRIORITAIRE.find((id) =>
    selected.some((resultat) => resultat.id === id),
  );

  const ordered = CATEGORIES.flatMap((categorie) =>
    selected
      .filter((resultat) => resultat.categorie === categorie)
      .map(({ id, nom, description, url }) => ({
        id,
        categorie,
        nom,
        description,
        url: resolveUrl(url, profil),
        isPrioritaire: id === prioritaireId,
      })),
  );

  return [
    ...ordered.filter((resultat) => resultat.isPrioritaire),
    ...ordered.filter((resultat) => !resultat.isPrioritaire),
  ];
}

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

export const NOMBRE_RESULTATS_INITIAL = 10;

/** Le premier de ces résultats présent devient le résultat prioritaire (ticket « carte maîtresse »). */
const ORDRE_RESULTAT_PRIORITAIRE = ["demission-reconversion", "cep"];

/** Résout le lien d'une carte pour le profil de l'utilisateur. */
function lien(url: Resultat["url"], profil: Profil): string {
  return typeof url === "function" ? url(profil) : url;
}

/** Cartes retenues pour ce profil, dans l'ordre d'affichage. */
export function selectResultats(profil: Profil): ResultatAffiche[] {
  const retenus = CATALOGUE.filter((resultat) => resultat.quand(profil));
  const prioritaireId = ORDRE_RESULTAT_PRIORITAIRE.find((id) =>
    retenus.some((resultat) => resultat.id === id),
  );

  const ordonnes = CATEGORIES.flatMap((categorie) =>
    retenus
      .filter((resultat) => resultat.categorie === categorie)
      .map(({ id, nom, description, url }) => ({
        id,
        categorie,
        nom,
        description,
        url: lien(url, profil),
        isPrioritaire: id === prioritaireId,
      })),
  );

  return [
    ...ordonnes.filter((resultat) => resultat.isPrioritaire),
    ...ordonnes.filter((resultat) => !resultat.isPrioritaire),
  ];
}

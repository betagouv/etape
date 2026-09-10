// Modèle de données des résultats.
//
// Un résultat est une CARTE : un interlocuteur, un outil ou un dispositif que
// les réponses de l'utilisateur rendent pertinent. Contrairement à la version
// précédente, rien n'est affiché « sous réserve » ni « non éligible » : une
// carte est retenue ou elle ne l'est pas (règle du ticket — aucun filtre, aucun
// onglet, uniquement ce à quoi la personne a droit).

import type { RegionCode } from "@/questionnaire/domain/regions";

import type { Profil } from "./profil";

/**
 * Catégorie d'un résultat, affichée en tag sur la carte. L'ordre du tableau est
 * l'ordre d'affichage imposé par le ticket.
 */
export const CATEGORIES = ["interlocuteur", "outil", "dispositif"] as const;

export type Categorie = (typeof CATEGORIES)[number];

/** Libellé du tag, tel qu'il apparaît sur la carte. */
export const CATEGORIE_LABELS: Record<Categorie, string> = {
  interlocuteur: "Interlocuteur",
  outil: "Outil",
  dispositif: "Dispositif",
};

/** Une carte du catalogue. */
export interface Resultat {
  /** Identifiant stable (clé de rendu, et repère dans le ticket). */
  id: string;
  categorie: Categorie;
  /** Intitulé affiché en titre de carte. */
  nom: string;
  /** Deux phrases maximum : ce que c'est, et ce que ça change pour la personne. */
  description: string;
  /**
   * Lien « En savoir plus ». Une fonction quand le réseau est régionalisé
   * (Transitions Pro et l'offre de formation des Régions dépendent de la région
   * de l'utilisateur).
   */
  url: string | ((region: RegionCode | null) => string);
  /**
   * Condition d'affichage. Vraie = la carte est retenue. C'est la seule règle
   * d'éligibilité : pas de statut intermédiaire.
   */
  quand: (profil: Profil) => boolean;
}

/** Une carte retenue, son lien déjà résolu pour la région de l'utilisateur. */
export interface ResultatAffiche extends Omit<Resultat, "url" | "quand"> {
  url: string;
}

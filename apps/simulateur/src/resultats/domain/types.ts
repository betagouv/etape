// Modèle de données des résultats.
//
// TOUT le catalogue est analysé pour un profil : chaque dispositif est classé
// dans l'un des trois onglets de la maquette (Éligible / Sous réserve / Non
// éligible) à partir du statut de ses critères d'accès. Les critères sont donc
// la seule source de vérité du classement — y compris les conditions d'entrée
// du dispositif, qui font tomber en « Non éligible » plutôt que de le masquer.

import type { FlagSet } from "@/questionnaire/domain/flags";
import type { RegionCode } from "@/questionnaire/domain/regions";

/** Onglet de classement d'un dispositif. */
export type Tier = "eligible" | "sous-reserve" | "non-eligible";

/**
 * Statut d'un critère d'accès :
 *  - `valide`     → rempli d'après les réponses (icône verte)
 *  - `a-verifier` → conditionnel / non déterminable ici (icône orange)
 *  - `manquant`   → condition bloquante non remplie (icône rouge)
 */
export type CritereStatut = "valide" | "a-verifier" | "manquant";

export interface Critere {
  label: string;
  statut: CritereStatut;
}

/** Un dispositif du catalogue (repris du prototype HTML v2.1). */
export interface Device {
  /** Identifiant stable du dispositif (sert de clé de rendu). */
  id: string;
  /** Intitulé complet. */
  name: string;
  /** Description courte affichée sur la carte. */
  description: string;
  /** Organisme(s) porteur(s) — parfois fonction des flags (ex. CEP). */
  acteur: string | ((flags: FlagSet) => string);
  /**
   * Lien « Commencer ma reconversion » (optionnel). Fonction de la région quand
   * le réseau est régionalisé (ex. CEP → portails Avenir Actifs).
   */
  url?: string | ((region: RegionCode | null) => string);
  /** Priorité d'affichage au sein d'un onglet (1 = plus haut). */
  priorite: (flags: FlagSet) => number;
  /**
   * Critères d'accès décomposés — leur statut détermine l'onglet. Ils doivent
   * inclure les conditions d'entrée du dispositif (statut, âge, RQTH…) sous
   * forme de critère bloquant : c'est ce qui classe un dispositif hors cible en
   * « Non éligible », avec le motif visible, au lieu de le faire disparaître.
   */
  criteres: (flags: FlagSet) => Critere[];
}

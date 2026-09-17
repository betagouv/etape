// Régions administratives — liste fermée, source unique du produit.
//
// La région est demandée directement en Q6 : c'est la maille des organismes
// (Transitions Pro, programmes régionaux de formation), et elle ne bouge pas. Elle
// est donc écrite ici plutôt que cherchée sur une API : une liste de 18 entrées
// figées ne justifie ni requête réseau, ni état de chargement, ni panne
// possible.
//
// L'ordre du tableau est celui de l'affichage : métropole puis outre-mer,
// chacune par ordre alphabétique.
//
// Seules les RÉGIONS y figurent. Saint-Pierre-et-Miquelon, Saint-Barthélemy et
// Saint-Martin sont des collectivités d'outre-mer, pas des régions : elles ont
// été retirées sur décision produit, et les réseaux régionalisés n'ont donc
// pas à leur donner de lien.

import { FIELD_REGION_RESIDENCE, FIELD_REGION_TRAVAIL } from "./questions";
import type { Answers, AnswerValue } from "./types";

/** Une région, telle que proposée à la saisie. `code` est le code INSEE. */
export interface Region {
  code: string;
  nom: string;
  /** Les collectivités d'outre-mer sont groupées à part dans la liste. */
  outreMer?: true;
}

export const REGIONS = [
  { code: "84", nom: "Auvergne-Rhône-Alpes" },
  { code: "27", nom: "Bourgogne-Franche-Comté" },
  { code: "53", nom: "Bretagne" },
  { code: "24", nom: "Centre-Val de Loire" },
  { code: "94", nom: "Corse" },
  { code: "44", nom: "Grand Est" },
  { code: "32", nom: "Hauts-de-France" },
  { code: "11", nom: "Île-de-France" },
  { code: "28", nom: "Normandie" },
  { code: "75", nom: "Nouvelle-Aquitaine" },
  { code: "76", nom: "Occitanie" },
  { code: "52", nom: "Pays de la Loire" },
  { code: "93", nom: "Provence-Alpes-Côte d'Azur" },
  { code: "01", nom: "Guadeloupe", outreMer: true },
  { code: "03", nom: "Guyane", outreMer: true },
  { code: "04", nom: "La Réunion", outreMer: true },
  { code: "02", nom: "Martinique", outreMer: true },
  { code: "06", nom: "Mayotte", outreMer: true },
] as const satisfies readonly Region[];

/**
 * Code INSEE d'une région. Union littérale dérivée de `REGIONS` : ajouter une
 * région ici oblige les deux fichiers de liens régionalisés de
 * `resultats/domain/` — `transitions-pro.ts` et `conseil-regional.ts` — à lui
 * donner une URL.
 */
export type RegionCode = (typeof REGIONS)[number]["code"];

export function isRegionCode(code: unknown): code is RegionCode {
  return typeof code === "string" && REGIONS.some((region) => region.code === code);
}

/** Nom affichable d'une région. `null` si le code est inconnu. */
export function regionName(code: string | null | undefined): string | null {
  return REGIONS.find((region) => region.code === code)?.nom ?? null;
}

/** Code région d'une réponse, si elle en porte un. */
function regionOf(value: AnswerValue | undefined): RegionCode | null {
  return isRegionCode(value) ? value : null;
}

/**
 * Région retenue pour les liens régionalisés : celle du lieu de TRAVAIL quand
 * elle est renseignée (c'est elle qui détermine le Transitions Pro compétent),
 * à défaut celle de la RÉSIDENCE. `null` quand aucune des deux n'est
 * exploitable — les liens retombent alors sur le portail national.
 */
export function regionFromAnswers(answers: Answers): RegionCode | null {
  return regionOf(answers[FIELD_REGION_TRAVAIL]) ?? regionOf(answers[FIELD_REGION_RESIDENCE]);
}

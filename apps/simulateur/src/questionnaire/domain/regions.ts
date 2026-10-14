// Régions administratives — liste fermée, source unique du produit.
//
// La région est demandée directement en Q7 : c'est la maille des organismes
// (Transitions Pro, programmes régionaux de formation), et elle ne bouge pas. Elle
// est donc écrite ici plutôt que cherchée sur une API : une liste de 18 entrées
// figées ne justifie ni requête réseau, ni état de chargement, ni panne
// possible.
//
// Ordre d'affichage : alphabétique, outre-mer mêlé, la saisie filtrant par le début du nom.
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
}

export const REGIONS = [
  { code: "84", nom: "Auvergne-Rhône-Alpes" },
  { code: "27", nom: "Bourgogne-Franche-Comté" },
  { code: "53", nom: "Bretagne" },
  { code: "24", nom: "Centre-Val de Loire" },
  { code: "94", nom: "Corse" },
  { code: "44", nom: "Grand Est" },
  { code: "01", nom: "Guadeloupe" },
  { code: "03", nom: "Guyane" },
  { code: "32", nom: "Hauts-de-France" },
  { code: "11", nom: "Île-de-France" },
  { code: "04", nom: "La Réunion" },
  { code: "02", nom: "Martinique" },
  { code: "06", nom: "Mayotte" },
  { code: "28", nom: "Normandie" },
  { code: "75", nom: "Nouvelle-Aquitaine" },
  { code: "76", nom: "Occitanie" },
  { code: "52", nom: "Pays de la Loire" },
  { code: "93", nom: "Provence-Alpes-Côte d'Azur" },
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

/** Sans accent ni majuscule ; tirets et apostrophes → espace. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[\s'’-]+/g, " ")
    .trim();
}

/** Article en tête de nom, que la saisie peut omettre (« Réunion »). */
const ARTICLE = /^(la|le|les|l) /;

function searchKeys(region: Region): string[] {
  const nom = normalize(region.nom);
  return [nom, nom.replace(ARTICLE, "")];
}

/** Par début de nom : chercher au milieu proposerait la moitié de la liste dès la 1re lettre. */
export function findRegions(query: string): readonly Region[] {
  const wanted = normalize(query);
  if (wanted === "") return REGIONS;
  return REGIONS.filter((region) => searchKeys(region).some((key) => key.startsWith(wanted)));
}

/** Le nom complet tapé, aux accents et majuscules près, vaut un choix. */
export function findRegionByName(text: string): RegionCode | null {
  const wanted = normalize(text);
  if (wanted === "") return null;
  return REGIONS.find((region) => searchKeys(region).includes(wanted))?.code ?? null;
}

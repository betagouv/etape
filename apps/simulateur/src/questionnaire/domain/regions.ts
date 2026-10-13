// Régions administratives — liste fermée, source unique du produit.
//
// La région est demandée directement en Q7 : c'est la maille des organismes
// (Transitions Pro, programmes régionaux de formation), et elle ne bouge pas. Elle
// est donc écrite ici plutôt que cherchée sur une API : une liste de 18 entrées
// figées ne justifie ni requête réseau, ni état de chargement, ni panne
// possible.
//
// L'ordre du tableau est celui de l'affichage : une seule liste alphabétique,
// métropole et outre-mer mêlés (maquette SIMULATEUR-v3) — la saisie la filtre
// par le début du nom, un regroupement n'y aiderait pas.
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

/**
 * Forme comparable d'un nom : sans accent ni majuscule, tirets et apostrophes
 * réduits à une espace. « ile de france » retrouve ainsi « Île-de-France ».
 */
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

/** Les formes sous lesquelles une région se cherche : son nom, et sans article. */
function searchKeys(region: Region): string[] {
  const nom = normalize(region.nom);
  const sansArticle = nom.replace(ARTICLE, "");
  return sansArticle === nom ? [nom] : [nom, sansArticle];
}

/**
 * Régions dont le nom COMMENCE par la saisie (maquette Q7 : « No » propose
 * Normandie et Nouvelle-Aquitaine, « A » la seule Auvergne-Rhône-Alpes). Une
 * recherche au milieu des noms proposerait la moitié de la liste dès la
 * première lettre. Saisie vide : toute la liste.
 */
export function findRegions(query: string): readonly Region[] {
  const wanted = normalize(query);
  if (wanted === "") return REGIONS;
  return REGIONS.filter((region) => searchKeys(region).some((key) => key.startsWith(wanted)));
}

/**
 * Région dont le nom est EXACTEMENT la saisie, aux accents et majuscules près :
 * taper « normandie » en entier vaut un choix dans la liste. `null` sinon.
 */
export function findRegionByName(text: string): RegionCode | null {
  const wanted = normalize(text);
  if (wanted === "") return null;
  return REGIONS.find((region) => searchKeys(region).includes(wanted))?.code ?? null;
}

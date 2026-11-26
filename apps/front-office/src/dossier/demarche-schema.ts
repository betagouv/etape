import { z } from "zod";

import { CURRENT_DEMARCHE_PATH, type DemarcheFieldPath } from "./domain/demarche";
import { LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE } from "./domain/longueur-max-texte";
import { pieceJustificativeSchema } from "./piece-justificative-schema";

/** Les messages des champs exigés de la démarche en cours de saisie, repris par ceux de chaque volet. */
export const DEMARCHE_REQUIRED_MESSAGES: Record<DemarcheFieldPath, string> = {
  [CURRENT_DEMARCHE_PATH.typeDemarche]: "Veuillez choisir le type de démarche.",
  [CURRENT_DEMARCHE_PATH.precisionTypeDemarche]: "Veuillez préciser le type de démarche.",
  [CURRENT_DEMARCHE_PATH.apportDemarche]: "Veuillez indiquer ce que la démarche vous a apporté.",
};

/**
 * La démarche en cours de saisie, sans son type que chaque volet prend dans sa liste : le champ
 * `currentDemarche` du volet. Ses champs ne sont exigés qu'après un « oui » : le `superRefine`
 * du volet s'en charge (`findOpenDemarcheFields`).
 */
export const currentDemarcheSchema = z.object({
  precisionTypeDemarche: z.string().trim(),
  apportDemarche: z.string().trim().max(LONGUEUR_MAX_TEXTE, LONGUEUR_MAX_TEXTE_MESSAGE),
  // Facultatives ; format et taille sont contrôlés à l'ajout (`checkFichiers`).
  piecesJustificatives: z.array(pieceJustificativeSchema),
});

/** L'état de la carte de saisie, à étaler dans le schéma d'un volet à côté de `currentDemarche`. */
export const currentDemarcheStateSchema = z.object({
  // Vrai tant que la carte de saisie est ouverte : elle se referme sur chaque démarche validée.
  hasCurrentDemarche: z.boolean(),
  // La démarche validée que la saisie modifie ; `null` pour une nouvelle démarche.
  currentDemarcheId: z.string().nullable(),
});

/** Une démarche validée, sans son type que chaque volet ajoute ; contrôlée à sa validation (`createDemarche`). */
export const demarcheSchema = z.object({
  id: z.string(),
  precisionTypeDemarche: z.string(),
  apportDemarche: z.string(),
  piecesJustificatives: z.array(pieceJustificativeSchema),
});

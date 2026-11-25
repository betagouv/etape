import { z } from "zod";

import { pieceJustificativeSchema } from "../demarche-schema";

/** Le schéma du formulaire « Mes documents » : les pièces de chaque document obligatoire, contrôlées à l'ajout (`checkFichiers`). */
export const documentsSchema = z.object({
  programmeFormation: z.array(pieceJustificativeSchema),
  calendrierFormation: z.array(pieceJustificativeSchema),
  devisFormation: z.array(pieceJustificativeSchema),
});

/** Les valeurs du formulaire « Mes documents ». */
export type DocumentsFormData = z.infer<typeof documentsSchema>;

/** Nom d'un champ du formulaire, tel que react-hook-form le connaît. */
export type DocumentsFieldName = keyof DocumentsFormData;

/** Les noms des champs du volet, pour les `name` des champs. */
export const DOCUMENTS_FIELD = {
  PROGRAMME_FORMATION: "programmeFormation",
  CALENDRIER_FORMATION: "calendrierFormation",
  DEVIS_FORMATION: "devisFormation",
} as const satisfies Record<string, DocumentsFieldName>;

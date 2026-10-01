/**
 * Statuts du dossier, côté domaine. Mêmes valeurs que l'enum Prisma
 * `StatutDossier` : la correspondance explicite vit dans `dossier.mapper.ts`,
 * et un statut ajouté au schéma sans être ajouté ici ne compile plus.
 */
export const STATUT_DOSSIER = {
  BROUILLON: "BROUILLON",
  EN_ATTENTE_CEP: "EN_ATTENTE_CEP",
  SIGNE: "SIGNE",
  SOUMIS: "SOUMIS",
  EN_CONTROLE: "EN_CONTROLE",
  EN_ATTENTE_COMPLEMENT: "EN_ATTENTE_COMPLEMENT",
  CONTROLE: "CONTROLE",
  ATTRIBUE_COMMISSION: "ATTRIBUE_COMMISSION",
  DECIDE: "DECIDE",
  CLOTURE: "CLOTURE",
  IRRECEVABLE: "IRRECEVABLE",
  DESISTE: "DESISTE",
} as const;

export type StatutDossier = (typeof STATUT_DOSSIER)[keyof typeof STATUT_DOSSIER];

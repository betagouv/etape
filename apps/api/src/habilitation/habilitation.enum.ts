/**
 * Rôle porté par une habilitation. Côté domaine, indépendant de l'enum Prisma
 * `Role` : `habilitation.prisma-repository.ts` fait la traduction.
 *
 * Le bénéficiaire n'y figure pas : ce n'est pas une habilitation mais une
 * relation au dossier (`dossier.beneficiaireId`). Le conseiller CEP non plus :
 * il accède par un lien, sans compte.
 */
export const HABILITATION_TYPE = {
  INSTRUCTEUR: "instructeur",
  ADMIN: "admin",
  SUPER_ADMIN: "superAdmin",
  MEMBRE_COMMISSION: "membreCommission",
} as const;

export type HabilitationType = (typeof HABILITATION_TYPE)[keyof typeof HABILITATION_TYPE];

/** Statuts d'une pièce, côté domaine (miroir de l'enum Prisma `StatutPiece`). */
export const STATUT_PIECE = {
  DEPOSEE: "DEPOSEE",
  VALIDEE: "VALIDEE",
  REFUSEE: "REFUSEE",
} as const;

export type StatutPiece = (typeof STATUT_PIECE)[keyof typeof STATUT_PIECE];

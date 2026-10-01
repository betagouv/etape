import type { StatutPiece as StatutPiecePrisma } from "../generated/prisma/enums.ts";
import { STATUT_PIECE, type StatutPiece } from "./piece-justificative.enum.js";
import type {
  PieceJustificative,
  PieceJustificativeResponse,
} from "./piece-justificative.types.js";

const STATUT_PIECE_BY_PRISMA: Record<StatutPiecePrisma, StatutPiece> = {
  DEPOSEE: STATUT_PIECE.DEPOSEE,
  VALIDEE: STATUT_PIECE.VALIDEE,
  REFUSEE: STATUT_PIECE.REFUSEE,
};

/** Colonnes lues par le repository : le `select` et ce type vont ensemble. */
export const SELECT_PIECE_JUSTIFICATIVE = {
  id: true,
  dossierId: true,
  typePieceId: true,
  version: true,
  statut: true,
  instructeurId: true,
  dateControle: true,
  motifRefus: true,
} as const;

export interface LignePieceJustificative {
  id: string;
  dossierId: string;
  typePieceId: string;
  version: number;
  statut: StatutPiecePrisma;
  instructeurId: string | null;
  dateControle: Date | null;
  motifRefus: string | null;
}

/** Base → domaine (utilisé par le repository). Les `null` deviennent des absences. */
export function toPieceJustificative(ligne: LignePieceJustificative): PieceJustificative {
  return {
    id: ligne.id,
    dossierId: ligne.dossierId,
    typePieceId: ligne.typePieceId,
    version: ligne.version,
    statut: STATUT_PIECE_BY_PRISMA[ligne.statut],
    instructeurId: ligne.instructeurId ?? undefined,
    dateControle: ligne.dateControle ?? undefined,
    motifRefus: ligne.motifRefus ?? undefined,
  };
}

/** Domaine → réponse HTTP (utilisé par le contrôleur). */
export function toPieceJustificativeResponse(
  piece: PieceJustificative,
): PieceJustificativeResponse {
  return {
    id: piece.id,
    statut: piece.statut,
    dateControle: piece.dateControle?.toISOString() ?? null,
  };
}

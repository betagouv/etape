import { EyeIcon, Trash2Icon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { FileUploadItem } from "@etape/ui/components/file-upload";

import { openFile } from "@/lib/open-file";
import { formatPieceDetails, type PieceJustificative } from "../domain/piece-justificative";

/** Ce que reçoit `PieceJustificativeItem` : la pièce, et de quoi la retirer là où c'est permis. */
export interface PieceJustificativeItemProps {
  piece: PieceJustificative;
  /** Sans retrait, la ligne ne propose que l'ouverture du fichier. */
  onRemove?: (piece: PieceJustificative) => void;
}

/** La ligne d'une pièce déposée : son nom, ses détails, son ouverture et, au besoin, son retrait. */
export function PieceJustificativeItem({ piece, onRemove }: PieceJustificativeItemProps) {
  const { name } = piece.fichier;

  return (
    <FileUploadItem name={name} details={formatPieceDetails(piece)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Voir ${name}`}
        onClick={() => openFile(piece.fichier)}
      >
        <EyeIcon aria-hidden="true" />
      </Button>
      {onRemove && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Retirer ${name}`}
          onClick={() => onRemove(piece)}
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      )}
    </FileUploadItem>
  );
}

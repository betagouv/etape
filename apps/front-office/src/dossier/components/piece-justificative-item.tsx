import type { Ref } from "react";
import { DownloadIcon, EyeIcon, Trash2Icon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import { FileUploadItem } from "@etape/ui/components/file-upload";

import { downloadFile } from "@/lib/download-file";
import { openFile } from "@/lib/open-file";
import {
  canPreviewFichier,
  formatPieceDetails,
  type PieceJustificative,
} from "../domain/piece-justificative";

/** Ce que reçoit `PieceJustificativeItem` : la pièce, et de quoi la retirer là où c'est permis. */
export interface PieceJustificativeItemProps {
  piece: PieceJustificative;
  /** Sans retrait, la ligne ne propose que l'ouverture, ou le téléchargement, du fichier. */
  onRemove?: (piece: PieceJustificative) => void;
  /** Pour rendre le focus à la corbeille quand la suppression est annulée. */
  removeRef?: Ref<HTMLButtonElement>;
}

/** La ligne d'une pièce déposée : son nom, ses détails, son ouverture ou son téléchargement et, au besoin, son retrait. */
export function PieceJustificativeItem({
  piece,
  onRemove,
  removeRef,
}: PieceJustificativeItemProps) {
  const { name } = piece.fichier;

  return (
    <FileUploadItem name={name} details={formatPieceDetails(piece)}>
      {canPreviewFichier(name) ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Voir ${name}`}
          onClick={() => openFile(piece.fichier)}
        >
          <EyeIcon aria-hidden="true" />
        </Button>
      ) : (
        // Un onglet ne sait pas afficher ce format : le fichier se télécharge, sous son nom.
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Télécharger ${name}`}
          onClick={() => downloadFile(piece.fichier)}
        >
          <DownloadIcon aria-hidden="true" />
        </Button>
      )}
      {onRemove && (
        <Button
          ref={removeRef}
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Retirer ${name}`}
          onClick={() => onRemove(piece)}
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      )}
    </FileUploadItem>
  );
}

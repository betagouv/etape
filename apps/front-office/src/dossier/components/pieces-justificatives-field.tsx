import { EyeIcon, Trash2Icon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import {
  FileUpload,
  FileUploadDescription,
  FileUploadError,
  FileUploadHeader,
  FileUploadHeading,
  FileUploadItem,
  FileUploadList,
  FileUploadTitle,
  FileUploadTrigger,
} from "@etape/ui/components/file-upload";
import { StatusRegion } from "@etape/ui/components/status-region";

import { openFile } from "@/lib/open-file";
import {
  ACCEPT_PIECE_JUSTIFICATIVE,
  formatPieceDetails,
  type PieceJustificative,
} from "../domain/piece-justificative";
import { usePiecesJustificatives } from "../hooks/use-pieces-justificatives";

/** Ce que reçoit `PiecesJustificativesField` : les pièces du champ, leur mise à jour, son titre et son aide. */
export interface PiecesJustificativesFieldProps {
  pieces: readonly PieceJustificative[];
  onChange: (pieces: PieceJustificative[]) => void;
  title: string;
  description: string;
}

/** Les pièces justificatives d'un champ de volet : dépôt, liste, fichiers refusés. */
export function PiecesJustificativesField({
  pieces,
  onChange,
  title,
  description,
}: PiecesJustificativesFieldProps) {
  const { refus, announcement, triggerRef, addFichiers, removePiece, dismissRefus } =
    usePiecesJustificatives(pieces, onChange);

  return (
    <FileUpload variant="plain" accept={ACCEPT_PIECE_JUSTIFICATIVE} onFilesAdd={addFichiers}>
      <FileUploadHeader>
        <FileUploadHeading>
          <FileUploadTitle>{title}</FileUploadTitle>
          <FileUploadDescription>{description}</FileUploadDescription>
        </FileUploadHeading>
      </FileUploadHeader>

      {pieces.length > 0 && (
        <FileUploadList aria-label="Fichiers déposés">
          {pieces.map((piece) => (
            <FileUploadItem
              key={piece.id}
              name={piece.fichier.name}
              details={formatPieceDetails(piece)}
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Voir ${piece.fichier.name}`}
                onClick={() => openFile(piece.fichier)}
              >
                <EyeIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Retirer ${piece.fichier.name}`}
                onClick={() => removePiece(piece)}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </FileUploadItem>
          ))}
        </FileUploadList>
      )}

      {refus.map(({ id, nom, message }) => (
        <FileUploadError
          key={id}
          title={nom}
          dismissLabel={`Fermer le message sur ${nom}`}
          onDismiss={() => dismissRefus(id)}
        >
          {message}
        </FileUploadError>
      ))}

      <FileUploadTrigger
        ref={triggerRef}
        label="Ajouter un fichier"
        hint="ou glissez vos fichiers ici"
        dropLabel="Relâchez pour ajouter vos fichiers"
      />
      <StatusRegion message={announcement} />
    </FileUpload>
  );
}

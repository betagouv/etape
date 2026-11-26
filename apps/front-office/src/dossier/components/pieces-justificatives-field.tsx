import {
  FileUpload,
  FileUploadDescription,
  FileUploadError,
  FileUploadHeader,
  FileUploadHeading,
  FileUploadList,
  FileUploadTitle,
  FileUploadTrigger,
} from "@etape/ui/components/file-upload";
import { StatusRegion } from "@etape/ui/components/status-region";

import { ACCEPT_PIECE_JUSTIFICATIVE, type PieceJustificative } from "../domain/piece-justificative";
import { usePiecesJustificatives } from "../hooks/use-pieces-justificatives";
import { PieceJustificativeItem } from "./piece-justificative-item";

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
  const { rejections, announcement, triggerRef, addFichiers, removePiece, dismissRejection } =
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
            <PieceJustificativeItem key={piece.id} piece={piece} onRemove={removePiece} />
          ))}
        </FileUploadList>
      )}

      {rejections.map(({ id, name, message }) => (
        <FileUploadError
          key={id}
          title={name}
          dismissLabel={`Fermer le message sur ${name}`}
          onDismiss={() => dismissRejection(id)}
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

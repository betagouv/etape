import { useId } from "react";
import { CircleAlertIcon, CircleCheckIcon, type LucideIcon } from "lucide-react";

import { Alert, AlertActions, AlertDescription, AlertTitle } from "@etape/ui/components/alert";
import { Button } from "@etape/ui/components/button";
import {
  FileUpload,
  FileUploadDescription,
  FileUploadError,
  FileUploadHeader,
  FileUploadHeading,
  FileUploadList,
  FileUploadTitle,
  FileUploadTrigger,
  type FileUploadVariant,
} from "@etape/ui/components/file-upload";
import { StatusRegion } from "@etape/ui/components/status-region";
import { Tag, type TagStatus } from "@etape/ui/components/tag";
import { joinIds } from "@etape/ui/lib/join-ids";

import {
  ACCEPT_PIECE_JUSTIFICATIVE,
  formatRemovalQuestion,
  type PieceJustificative,
} from "../domain/piece-justificative";
import { getStatutDocument, STATUT_DOCUMENT, type StatutDocument } from "../domain/statut-document";
import { FACULTATIF_LABEL } from "../domain/statut-volet";
import { usePiecesJustificatives } from "../hooks/use-pieces-justificatives";
import { PieceJustificativeItem } from "./piece-justificative-item";

interface StatutDocumentUi {
  label: string;
  status: TagStatus;
  Icon?: LucideIcon;
}

const STATUT_DOCUMENT_UI: Record<StatutDocument, StatutDocumentUi> = {
  [STATUT_DOCUMENT.A_DEPOSER]: { label: "À déposer", status: "warning" },
  [STATUT_DOCUMENT.DEPOSE]: { label: "Déposé", status: "success", Icon: CircleCheckIcon },
  [STATUT_DOCUMENT.FACULTATIF]: { label: FACULTATIF_LABEL, status: "neutral" },
};

const HAS_STATUT: Record<FileUploadVariant, boolean> = {
  card: true,
  plain: false,
};

const DEFAULT_DROP_LABEL = "Relâchez pour ajouter vos fichiers";

/** Les textes du champ : son titre, son aide et, au besoin, l'invitation à relâcher les fichiers et la suite de la confirmation. */
export interface PiecesJustificativesLabels {
  title: string;
  description: string;
  /** « Relâchez pour ajouter vos fichiers au calendrier de la formation. » */
  dropLabel?: string;
  /** Sous « Supprimer x.pdf ? », quand la pièce vit aussi ailleurs (`formatRemovalNotice`). */
  removalNotice?: string;
}

/** Ce que reçoit `PiecesJustificativesField` : les pièces du champ, leur mise à jour, ses textes et son apparence. */
export interface PiecesJustificativesFieldProps {
  pieces: readonly PieceJustificative[];
  onChange: (pieces: PieceJustificative[]) => void;
  labels: PiecesJustificativesLabels;
  /** `card` : un document demandé, avec l'étiquette de son statut (« Mes documents »). */
  variant?: FileUploadVariant;
  isRequired?: boolean;
  /** Ce que l'ajout ou le retrait change ailleurs, annoncé à la suite : le statut du volet. */
  describeChange?: (pieces: readonly PieceJustificative[]) => string;
}

/** Les pièces justificatives d'un champ de volet : dépôt, liste, suppression confirmée, fichiers refusés. */
export function PiecesJustificativesField({
  pieces,
  onChange,
  labels,
  variant = "plain",
  isRequired = false,
  describeChange,
}: PiecesJustificativesFieldProps) {
  const removalTitleId = useId();
  const removalNoticeId = useId();
  const removalDescribedBy = joinIds([removalTitleId, labels.removalNotice && removalNoticeId]);
  const {
    rejections,
    announcement,
    triggerRef,
    pendingRemovalId,
    cancelRemovalRef,
    registerRemoveButton,
    addFichiers,
    askRemoval,
    cancelRemoval,
    confirmRemoval,
    dismissRejection,
  } = usePiecesJustificatives(pieces, onChange, describeChange);
  const statut = STATUT_DOCUMENT_UI[getStatutDocument(isRequired, pieces.length)];

  return (
    <FileUpload variant={variant} accept={ACCEPT_PIECE_JUSTIFICATIVE} onFilesAdd={addFichiers}>
      <FileUploadHeader>
        <FileUploadHeading>
          <FileUploadTitle required={isRequired}>{labels.title}</FileUploadTitle>
          <FileUploadDescription>{labels.description}</FileUploadDescription>
        </FileUploadHeading>
        {HAS_STATUT[variant] && (
          <Tag status={statut.status} size="sm">
            {statut.Icon && <statut.Icon aria-hidden="true" />}
            {statut.label}
          </Tag>
        )}
      </FileUploadHeader>

      {pieces.length > 0 && (
        <FileUploadList aria-label="Fichiers déposés">
          {pieces.map((piece) =>
            piece.id === pendingRemovalId ? (
              <li key={piece.id}>
                <Alert variant="destructive-subdued">
                  <CircleAlertIcon aria-hidden="true" />
                  <AlertTitle id={removalTitleId} className="wrap-anywhere">
                    {formatRemovalQuestion(piece.fichier.name)}
                  </AlertTitle>
                  {labels.removalNotice && (
                    <AlertDescription id={removalNoticeId}>{labels.removalNotice}</AlertDescription>
                  )}
                  <AlertActions placement="end">
                    <Button
                      ref={cancelRemovalRef}
                      type="button"
                      variant="secondary"
                      size="sm"
                      aria-describedby={removalDescribedBy}
                      onClick={cancelRemoval}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      aria-describedby={removalDescribedBy}
                      onClick={confirmRemoval}
                    >
                      Supprimer
                    </Button>
                  </AlertActions>
                </Alert>
              </li>
            ) : (
              <PieceJustificativeItem
                key={piece.id}
                piece={piece}
                onRemove={askRemoval}
                removeRef={registerRemoveButton(piece.id)}
              />
            ),
          )}
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
        dropLabel={labels.dropLabel ?? DEFAULT_DROP_LABEL}
      />
      <StatusRegion message={announcement} />
    </FileUpload>
  );
}

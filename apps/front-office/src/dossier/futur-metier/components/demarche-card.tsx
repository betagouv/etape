import { useId, type Ref } from "react";
import { FileTextIcon, PaperclipIcon } from "lucide-react";

import {
  Card,
  CardDetail,
  CardDetailLabel,
  CardDetails,
  CardDetailValue,
  CardTitle,
} from "@etape/ui/components/card";
import { EditRemoveActions } from "@etape/ui/components/edit-remove-actions";
import { FieldDescription } from "@etape/ui/components/field";
import { FileUploadList } from "@etape/ui/components/file-upload";
import { Separator } from "@etape/ui/components/separator";

import { PieceJustificativeItem } from "../../components/piece-justificative-item";
import { formatEditLabel, formatRemoveLabel, type Demarche } from "../domain/demarche";
import { DemarcheTitle } from "./demarche-title";

/** La modification de la démarche : son action, et ce qui la fait attendre. */
export interface DemarcheCardEdit {
  onClick: () => void;
  /** Vrai tant qu'une autre saisie est ouverte : « Modifier » est grisé. */
  isDisabled: boolean;
  /** Ce qu'il faut faire d'abord, affiché quand on a cliqué « Modifier » grisé. */
  notice?: string;
}

/** Ce que reçoit `DemarcheCard` : la démarche validée, son rang et de quoi la modifier ou la supprimer. */
export interface DemarcheCardProps {
  /** Le rang de la démarche dans la liste, à partir de 0. */
  index: number;
  demarche: Demarche;
  edit: DemarcheCardEdit;
  onRemove: () => void;
  /** « Modifier » reprend le focus quand la modification se referme. */
  editButtonRef: Ref<HTMLButtonElement>;
  /** La corbeille reprend le focus quand la suppression est abandonnée. */
  removeButtonRef: Ref<HTMLButtonElement>;
}

/**
 * Une démarche validée, à la place de sa carte de saisie : `front-office-form-card` de la
 * maquette FRONT-OFFICE (frame 12). Sans justificatif, la carte n'en affiche pas la rubrique.
 * « Modifier » la rouvre en saisie ; la corbeille demande confirmation avant de la supprimer.
 */
export function DemarcheCard({
  index,
  demarche,
  edit,
  onRemove,
  editButtonRef,
  removeButtonRef,
}: DemarcheCardProps) {
  const titleId = useId();
  const noticeId = useId();
  const { apportDemarche, piecesJustificatives } = demarche;

  return (
    <Card variant="secondary" role="group" aria-labelledby={titleId}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle variant="label" asChild>
            <h4 id={titleId} className="min-w-0">
              <DemarcheTitle index={index} demarche={demarche} />
            </h4>
          </CardTitle>
          {/* Grisé pendant une autre saisie, « Modifier » reste cliquable : un clic dit quoi faire d'abord. */}
          <EditRemoveActions
            edit={{
              label: "Modifier",
              accessibleLabel: formatEditLabel(index),
              onClick: edit.onClick,
              isDisabled: edit.isDisabled,
              describedBy: edit.notice ? noticeId : undefined,
            }}
            remove={{ accessibleLabel: formatRemoveLabel(index), onClick: onRemove }}
            editRef={editButtonRef}
            removeRef={removeButtonRef}
          />
        </div>
        {edit.notice && <FieldDescription id={noticeId}>{edit.notice}</FieldDescription>}
      </div>
      <Separator />
      <CardDetails>
        <CardDetail orientation="vertical">
          <CardDetailLabel>
            <FileTextIcon aria-hidden="true" />
            Ce que la démarche m’a apporté
          </CardDetailLabel>
          {/* Les retours à la ligne de la saisie sont gardés. */}
          <CardDetailValue className="break-words whitespace-pre-line">
            {apportDemarche}
          </CardDetailValue>
        </CardDetail>
      </CardDetails>
      {piecesJustificatives.length > 0 && (
        <>
          <Separator />
          <CardDetails>
            <CardDetail orientation="vertical">
              <CardDetailLabel>
                <PaperclipIcon aria-hidden="true" />
                Justificatifs
              </CardDetailLabel>
              <CardDetailValue>
                {/* 8 px entre deux fichiers dans cette carte (maquette 12), 12 dans le dépôt. */}
                <FileUploadList className="gap-2">
                  {piecesJustificatives.map((piece) => (
                    <PieceJustificativeItem key={piece.id} piece={piece} />
                  ))}
                </FileUploadList>
              </CardDetailValue>
            </CardDetail>
          </CardDetails>
        </>
      )}
    </Card>
  );
}

import { useId, type Ref } from "react";
import { FileTextIcon, PaperclipIcon, PencilLineIcon } from "lucide-react";

import { Button } from "@etape/ui/components/button";
import {
  Card,
  CardDetail,
  CardDetailLabel,
  CardDetails,
  CardDetailValue,
} from "@etape/ui/components/card";
import { FileUploadList } from "@etape/ui/components/file-upload";
import { Separator } from "@etape/ui/components/separator";

import { PieceJustificativeItem } from "../../components/piece-justificative-item";
import {
  findDemarcheIntitule,
  formatDemarcheLabel,
  formatModifierLabel,
  type Demarche,
} from "../domain/demarche";

/** Ce que reçoit `DemarcheCard` : la démarche validée, son rang et de quoi la modifier. */
export interface DemarcheCardProps {
  /** Le rang de la démarche dans la liste, à partir de 0. */
  index: number;
  demarche: Demarche;
  /** Le bouton « Modifier » : il reprend le focus quand la modification se referme. */
  editButtonRef: Ref<HTMLButtonElement>;
  onEdit: () => void;
  /** Vrai tant qu'une autre saisie est ouverte : « Modifier » est grisé. */
  isEditDisabled: boolean;
  /** Ce qu'il faut faire d'abord, affiché quand on a cliqué « Modifier » grisé. */
  editNotice?: string;
}

/**
 * Une démarche validée, à la place de sa carte de saisie : `front-office-form-card` de la
 * maquette FRONT-OFFICE (frame 12). Sans justificatif, la carte n'en affiche pas la rubrique.
 * « Modifier » la rouvre en saisie.
 */
export function DemarcheCard({
  index,
  demarche,
  editButtonRef,
  onEdit,
  isEditDisabled,
  editNotice,
}: DemarcheCardProps) {
  const titleId = useId();
  const noticeId = useId();
  const { apportDemarche, piecesJustificatives } = demarche;

  return (
    <Card variant="secondary" role="group" aria-labelledby={titleId}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h4 id={titleId} className="text-primary min-w-0 text-sm leading-5 font-medium">
            {formatDemarcheLabel(index)} :{" "}
            <span className="text-foreground font-semibold">{findDemarcheIntitule(demarche)}</span>
          </h4>
          {/* Grisé pendant une autre saisie, il reste cliquable : un clic dit quoi faire d'abord. */}
          <Button
            ref={editButtonRef}
            type="button"
            variant="outline"
            aria-label={formatModifierLabel(index)}
            aria-disabled={isEditDisabled}
            aria-describedby={editNotice ? noticeId : undefined}
            onClick={onEdit}
          >
            <PencilLineIcon aria-hidden="true" className="size-5" />
            Modifier
          </Button>
        </div>
        {editNotice && (
          <p id={noticeId} className="text-muted-foreground text-sm">
            {editNotice}
          </p>
        )}
      </div>
      <Separator />
      <CardDetails>
        <CardDetail className="flex-col items-stretch gap-2">
          <CardDetailLabel className="font-medium">
            <FileTextIcon aria-hidden="true" />
            Ce que la démarche m’a apporté
          </CardDetailLabel>
          {/* Les retours à la ligne de la saisie sont gardés. */}
          <CardDetailValue className="text-left break-words whitespace-pre-line">
            {apportDemarche}
          </CardDetailValue>
        </CardDetail>
      </CardDetails>
      {piecesJustificatives.length > 0 && (
        <>
          <Separator />
          <CardDetails>
            <CardDetail className="flex-col items-stretch gap-2">
              <CardDetailLabel className="font-medium">
                <PaperclipIcon aria-hidden="true" />
                Justificatifs
              </CardDetailLabel>
              <CardDetailValue className="text-left">
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

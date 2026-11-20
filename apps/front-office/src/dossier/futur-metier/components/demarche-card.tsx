import { useId } from "react";
import { FileTextIcon, PaperclipIcon } from "lucide-react";

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
import { findDemarcheIntitule, type Demarche } from "../domain/demarche";

/** Ce que reçoit `DemarcheCard` : la démarche validée et son libellé, « Démarche 1 ». */
export interface DemarcheCardProps {
  label: string;
  demarche: Demarche;
}

/**
 * Une démarche validée, à la place de sa carte de saisie : `front-office-form-card` de la
 * maquette FRONT-OFFICE (frame 12). Sans justificatif, la carte n'en affiche pas la rubrique.
 */
export function DemarcheCard({ label, demarche }: DemarcheCardProps) {
  const titleId = useId();
  const { apportDemarche, piecesJustificatives } = demarche;

  return (
    <Card variant="secondary" role="group" aria-labelledby={titleId}>
      <h4 id={titleId} className="text-primary text-sm leading-5 font-medium">
        {label} :{" "}
        <span className="text-foreground font-semibold">{findDemarcheIntitule(demarche)}</span>
      </h4>
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

import { Trash2Icon } from "lucide-react";

import { Card, CardTitle } from "@etape/ui/components/card";
import { ConfirmationDialog } from "@etape/ui/components/confirmation-dialog";
import { FileUploadLine, FileUploadList } from "@etape/ui/components/file-upload";
import { Separator } from "@etape/ui/components/separator";

import { findDemarcheIntitule, formatRemovalMessage, formatRemovalTitle } from "../domain/demarche";
import type { DemarcheRemoval } from "../hooks/use-demarche-removal";
import { DemarcheTitle } from "./demarche-title";

/** Ce que reçoit `DemarcheRemovalDialog` : la suppression à confirmer, les libellés des types du volet et ses trois issues. */
export interface DemarcheRemovalDialogProps<TType extends string> {
  isOpen: boolean;
  /** Gardée après la fermeture, le temps que la fenêtre disparaisse. */
  removal: DemarcheRemoval<TType> | null;
  typeLabels: Record<TType, string>;
  onCancel: () => void;
  onConfirm: () => void;
  /** Le focus retenu par la fenêtre se place à sa fermeture. */
  onCloseFocus: () => void;
}

/**
 * La fenêtre qui confirme une suppression : elle montre chaque démarche concernée, avec ses
 * fichiers — une seule par la corbeille, toutes après un « non » (maquettes 15 et 14).
 */
export function DemarcheRemovalDialog<TType extends string>({
  isOpen,
  removal,
  typeLabels,
  onCancel,
  onConfirm,
  onCloseFocus,
}: DemarcheRemovalDialogProps<TType>) {
  const items = removal?.items ?? [];

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      text={{
        title: formatRemovalTitle(items.length),
        description: formatRemovalMessage(items.length),
      }}
      cancel={{ label: "Annuler", onClick: onCancel }}
      confirm={{
        label: "Supprimer",
        icon: <Trash2Icon aria-hidden="true" className="size-5" />,
        isDestructive: true,
        onClick: onConfirm,
      }}
      onCloseFocus={onCloseFocus}
    >
      <ul className="flex flex-col gap-3">
        {items.map(({ demarche, index }) => (
          <Card key={demarche.id} variant="secondary" asChild>
            <li>
              <CardTitle variant="label" asChild>
                <p>
                  <DemarcheTitle
                    index={index}
                    intitule={findDemarcheIntitule(demarche, typeLabels)}
                  />
                </p>
              </CardTitle>
              {demarche.piecesJustificatives.length > 0 && (
                <>
                  <Separator />
                  <FileUploadList>
                    {demarche.piecesJustificatives.map(({ id, fichier }) => (
                      <FileUploadLine key={id} name={fichier.name} />
                    ))}
                  </FileUploadList>
                </>
              )}
            </li>
          </Card>
        ))}
      </ul>
    </ConfirmationDialog>
  );
}

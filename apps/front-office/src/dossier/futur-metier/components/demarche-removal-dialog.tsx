import { FileDownIcon, Trash2Icon } from "lucide-react";

import { Card } from "@etape/ui/components/card";
import { ConfirmationDialog } from "@etape/ui/components/confirmation-dialog";
import { Separator } from "@etape/ui/components/separator";

import { formatRemovalMessage, formatRemovalTitle } from "../domain/demarche";
import type { DemarcheRemoval } from "../hooks/use-demarche-removal";
import { DemarcheTitle } from "./demarche-title";

/** Ce que reçoit `DemarcheRemovalDialog` : la suppression à confirmer et ses trois issues. */
export interface DemarcheRemovalDialogProps {
  isOpen: boolean;
  /** Gardée après la fermeture, le temps que la fenêtre disparaisse. */
  removal: DemarcheRemoval | null;
  onCancel: () => void;
  onConfirm: () => void;
  /** Le focus retenu par la fenêtre se place à sa fermeture. */
  onCloseFocus: () => void;
}

/**
 * La fenêtre qui confirme une suppression : elle montre chaque démarche concernée, avec ses
 * fichiers — une seule par la corbeille, toutes après un « non » (maquettes 15 et 14).
 */
export function DemarcheRemovalDialog({
  isOpen,
  removal,
  onCancel,
  onConfirm,
  onCloseFocus,
}: DemarcheRemovalDialogProps) {
  const items = removal?.items ?? [];

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      title={formatRemovalTitle(items.length)}
      description={formatRemovalMessage(items.length)}
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
              <p className="text-primary text-sm leading-5 font-medium">
                <DemarcheTitle index={index} demarche={demarche} />
              </p>
              {demarche.piecesJustificatives.length > 0 && (
                <>
                  <Separator />
                  <ul className="flex flex-col gap-3">
                    {demarche.piecesJustificatives.map(({ id, fichier }) => (
                      <li
                        key={id}
                        className="text-primary flex items-center gap-1 text-sm leading-5"
                      >
                        <FileDownIcon aria-hidden="true" className="size-5 shrink-0" />
                        <span className="min-w-0 truncate">{fichier.name}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          </Card>
        ))}
      </ul>
    </ConfirmationDialog>
  );
}

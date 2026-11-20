"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@etape/ui/components/alert-dialog";

/** Le bouton qui referme la fenêtre sans rien faire ; Échap fait de même. */
interface ConfirmationDialogCancel {
  label: string;
  onClick: () => void;
}

/** Le bouton qui confirme l'action. */
interface ConfirmationDialogConfirm {
  label: string;
  onClick: () => void;
  /** Devant le libellé : une icône de 20 px, masquée aux lecteurs d'écran. */
  icon?: React.ReactNode;
  /** Vrai pour une action qui détruit : le bouton passe en rouge clair (`Destructive=Yes` du kit). */
  isDestructive?: boolean;
}

/** Ce que reçoit `ConfirmationDialog` : son ouverture, ses textes, ses deux boutons et, en enfants, son contenu. */
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  cancel: ConfirmationDialogCancel;
  confirm: ConfirmationDialogConfirm;
  /**
   * Appelé quand la fenêtre a disparu. Elle n'a pas de déclencheur à qui rendre le focus :
   * c'est l'écran qui le place, selon ce qui vient de se passer.
   */
  onCloseFocus: () => void;
  /** Entre le texte et les boutons : ce que l'action va toucher. */
  children?: React.ReactNode;
}

/**
 * La fenêtre qui fait confirmer une action : `front-office-dialog-modal` du kit (`Size=MD`,
 * `Align=left`). L'écran l'ouvre et la referme (`isOpen`), et fournit tous les textes.
 * Le focus arrive sur le bouton d'annulation, le choix sans conséquence.
 */
function ConfirmationDialog({
  isOpen,
  title,
  description,
  cancel,
  confirm,
  onCloseFocus,
  children,
}: ConfirmationDialogProps) {
  // Radix referme aussi la fenêtre après une confirmation : ce n'est pas une annulation.
  const isConfirmed = React.useRef(false);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) return;
        if (!isConfirmed.current) cancel.onClick();
        isConfirmed.current = false;
      }}
    >
      <AlertDialogContent
        size="md"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onCloseFocus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children && <AlertDialogBody>{children}</AlertDialogBody>}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancel.label}</AlertDialogCancel>
          <AlertDialogAction
            variant={confirm.isDestructive ? "destructive" : "default"}
            onClick={() => {
              isConfirmed.current = true;
              confirm.onClick();
            }}
          >
            {confirm.icon}
            {confirm.label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export { ConfirmationDialog };
export type { ConfirmationDialogCancel, ConfirmationDialogConfirm, ConfirmationDialogProps };

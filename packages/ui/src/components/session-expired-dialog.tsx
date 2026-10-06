"use client";

import { useRef } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@etape/ui/components/alert-dialog";

export interface SessionExpiredDialogProps {
  open: boolean;
  onReconnect: () => void;
}

/**
 * Prévient qu'une requête a reçu un 401 en cours d'utilisation. Vue pure : c'est
 * l'app qui décide de l'ouvrir et de ce que fait « Se reconnecter ».
 *
 * Aucune région `role="status"` en plus : le focus déplacé dans l'`alertdialog`
 * suffit à l'annoncer, et une région répéterait le même message.
 */
export function SessionExpiredDialog({ open, onReconnect }: SessionExpiredDialogProps) {
  const reconnectRef = useRef<HTMLButtonElement>(null);

  return (
    // Sans `onOpenChange`, rien ne ferme le dialogue, ni Échap ni un clic
    // dehors : la session est terminée, revenir sur l'écran ne servirait qu'à
    // le rouvrir à la requête suivante.
    <AlertDialog open={open}>
      <AlertDialogContent
        // Radix ne donne le focus qu'à un bouton « Annuler », que ce dialogue
        // n'a pas : sans cette reprise, rien ne serait focalisé et le lecteur
        // d'écran n'annoncerait pas l'alerte.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          reconnectRef.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Votre session a expiré</AlertDialogTitle>
          <AlertDialogDescription>Reconnectez-vous pour continuer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction ref={reconnectRef} onClick={onReconnect}>
            Se reconnecter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

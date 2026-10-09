"use client";

import { useRef } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@etape/ui/components/alert-dialog";
import { Button } from "@etape/ui/components/button";

/**
 * Un lien quand l'action quitte l'app (« Se reconnecter » mène au formulaire de
 * connexion) ; un bouton quand elle reste dans la page (« Oui » prolonge la
 * session), avec son état d'envoi.
 */
export type SessionDialogAction = { href: string } | { onClick: () => void; isBusy: boolean };

export interface SessionDialogProps {
  open: boolean;
  title: string;
  message: string;
  actionLabel: string;
  action: SessionDialogAction;
}

/**
 * Prévient d'une fin de session, prochaine ou passée. Vue pure : c'est l'app
 * qui décide de l'ouvrir, de ses textes et de son action.
 *
 * Aucune région `role="status"` en plus : le focus déplacé dans l'`alertdialog`
 * suffit à l'annoncer, et une région répéterait le même message.
 */
export function SessionDialog({ open, title, message, actionLabel, action }: SessionDialogProps) {
  const actionRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);

  return (
    // Sans `onOpenChange`, rien ne ferme le dialogue, ni Échap ni un clic
    // dehors : seule son action en sort, et c'est l'app qui le referme.
    <AlertDialog open={open}>
      <AlertDialogContent
        // Radix ne donne le focus qu'à un bouton « Annuler », que ce dialogue
        // n'a pas : sans cette reprise, rien ne serait focalisé et le lecteur
        // d'écran n'annoncerait pas l'alerte.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          actionRef.current?.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {"href" in action ? (
            <Button ref={actionRef} asChild>
              <a href={action.href}>{actionLabel}</a>
            </Button>
          ) : (
            // Jamais `disabled` pendant l'envoi : le focus partirait sur
            // `body` (`accessibilite.md`, § 1). La garde est dans le handler.
            <Button
              ref={actionRef}
              aria-disabled={action.isBusy}
              aria-busy={action.isBusy}
              className="aria-busy:cursor-progress"
              onClick={() => {
                if (action.isBusy) return;
                action.onClick();
              }}
            >
              {actionLabel}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

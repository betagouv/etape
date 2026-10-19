"use client";

import { Loader2Icon } from "lucide-react";
import { useRef } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
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
 * session), avec son état d'envoi et le message de son échec, vide sinon.
 */
export type SessionDialogAction =
  { href: string } | { onClick: () => void; isBusy: boolean; failureMessage: string };

/**
 * Écarte le dialogue sans toucher à la session (« Continuer », le temps de
 * finir une saisie). Il reçoit le focus à l'ouverture : l'avertissement peut
 * tomber pendant une frappe, et Entrée sur « Se reconnecter » quitterait l'app.
 */
export interface SessionDialogDismiss {
  label: string;
  onClick: () => void;
}

export interface SessionDialogProps {
  open: boolean;
  title: string;
  message: string;
  actionLabel: string;
  action: SessionDialogAction;
  dismiss?: SessionDialogDismiss;
}

/**
 * Prévient d'une fin de session, prochaine ou passée. Vue pure : c'est l'app
 * qui décide de l'ouvrir, de ses textes et de son action.
 *
 * Son ouverture n'a pas besoin de région `role="status"` : le focus déplacé
 * dans l'`alertdialog` suffit à l'annoncer. L'échec de l'action, si : il a la
 * sienne, dans le dialogue, puisque Radix masque le reste de la page aux
 * lecteurs d'écran (`aria-hidden`) tant qu'il est ouvert.
 */
export function SessionDialog({
  open,
  title,
  message,
  actionLabel,
  action,
  dismiss,
}: SessionDialogProps) {
  const actionRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const dismissButton = dismiss && (
    <AlertDialogCancel ref={dismissRef}>{dismiss.label}</AlertDialogCancel>
  );

  return (
    // Sans `dismiss`, rien ne ferme le dialogue, ni Échap ni un clic dehors :
    // seule son action en sort, et c'est l'app qui le referme. Avec, Échap
    // l'écarte comme son bouton ; un clic dehors, jamais.
    <AlertDialog
      open={open}
      onOpenChange={
        dismiss &&
        ((isOpen) => {
          if (!isOpen) dismiss.onClick();
        })
      }
    >
      <AlertDialogContent
        // Radix donnerait le focus au bouton d'écart, ou à rien sans lui : le
        // lecteur d'écran n'annoncerait pas l'alerte. Le focus n'a pas encore
        // bougé : on retient où il était.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          previousFocusRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          (dismissRef.current ?? actionRef.current)?.focus();
        }}
        // À la fermeture, Radix rend le focus au bouton qui a ouvert le
        // dialogue ; celui-ci n'en a pas, et le focus tomberait sur `body`. On
        // le rend là où il était, si l'élément est encore affiché.
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const previousFocus = previousFocusRef.current;
          if (previousFocus?.isConnected) previousFocus.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        {"href" in action ? (
          <AlertDialogFooter>
            {dismissButton}
            <Button ref={actionRef} asChild>
              <a href={action.href}>{actionLabel}</a>
            </Button>
          </AlertDialogFooter>
        ) : (
          <>
            {/* Montée avec le dialogue, vide tant que l'action n'a pas échoué. */}
            <p role="status" className="text-destructive-text text-sm">
              {action.failureMessage}
            </p>
            <AlertDialogFooter>
              {dismissButton}
              {/*
                Jamais `disabled` pendant l'envoi : le focus partirait sur
                `body` (`accessibilite.md`, § 1). La garde est dans le handler.
              */}
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
                {action.isBusy && (
                  <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
                )}
                {actionLabel}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

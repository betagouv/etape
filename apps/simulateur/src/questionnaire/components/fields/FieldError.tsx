"use client";

import { createContext, useContext } from "react";

/**
 * Le message doit-il s'afficher SOUS le champ ?
 *
 * `false` sur les écrans à champ unique : le message y est affiché une seule
 * fois, en bas de l'écran, et c'est cette ligne-là qui porte l'`id` attendu par
 * l'`aria-describedby` du champ — l'annonce au lecteur d'écran est donc la même.
 *
 * Un contexte plutôt qu'une propriété : les composants traversés
 * (`FieldRenderer`, `RadioField`, `MonthYearField`…) n'ont rien à voir avec
 * cette décision de mise en page, et ne devraient pas avoir à la relayer.
 */
const InlineFieldError = createContext(true);

export const InlineFieldErrorProvider = InlineFieldError;

/**
 * Message d'erreur d'un champ.
 *
 * Pas de `role="alert"` : plusieurs champs peuvent être en erreur sur le même
 * écran, et autant d'annonces simultanées seraient illisibles. Le message est
 * rattaché au contrôle par `aria-describedby`, et l'écran déplace le focus sur
 * le premier champ fautif — c'est lui qui déclenche l'annonce.
 */
export function FieldError({ id, message }: { id: string; message?: string }) {
  const inline = useContext(InlineFieldError);
  if (!message || !inline) return null;

  return (
    <p id={id} className="text-destructive-text text-sm leading-5 font-semibold">
      {message}
    </p>
  );
}

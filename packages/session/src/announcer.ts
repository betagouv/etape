import { useEffect, useSyncExternalStore } from "react";

// La région `role="status"` est montée une fois, au-dessus du routeur, et ne
// bouge plus : l'attente au démarrage, les avis et la prolongation de la
// session s'y annoncent tour à tour (`accessibilite.md`, § 2). Les dialogues
// n'y passent pas : le focus déplacé dans l'`alertdialog` les annonce déjà.

let currentMessage = "";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setMessage(message: string): void {
  currentMessage = message;
  for (const listener of listeners) listener();
}

/** Le message à annoncer, pour la région de `SessionApp`. */
export function useAnnouncement(): string {
  return useSyncExternalStore(subscribe, () => currentMessage);
}

/**
 * Annonce `message` tant que l'écran qui l'appelle est affiché ; `""` n'annonce
 * rien. Un message appartient à qui l'a écrit : seul lui l'efface, quand il
 * change ou disparaît. Un parent qui n'a rien à dire n'efface donc pas
 * l'annonce de son enfant — les effets de l'enfant passent avant les siens —,
 * et un écran qui revient est annoncé de nouveau, la région étant repassée
 * par le vide.
 */
export function useAnnounce(message: string): void {
  useEffect(() => {
    if (!message) return;

    setMessage(message);
    return () => {
      if (currentMessage === message) setMessage("");
    };
  }, [message]);
}

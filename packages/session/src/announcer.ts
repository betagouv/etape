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

/** Le message à annoncer, pour la région de `SessionApp`. */
export function useAnnouncement(): string {
  return useSyncExternalStore(subscribe, () => currentMessage);
}

/** Annonce `message` quand l'écran s'affiche ou que le message change ; vide la région avec `""`. */
export function useAnnounce(message: string): void {
  useEffect(() => {
    currentMessage = message;
    for (const listener of listeners) listener();
  }, [message]);
}

/** Ce que `keepFocus` attend d'un événement de souris : de quoi annuler son effet par défaut. */
interface PreventableEvent {
  preventDefault: () => void;
}

/**
 * À poser sur `onMouseDown` d'un bouton proche d'un formulaire : le clic ne prend pas le focus
 * au champ en cours. Sinon la sortie du champ le contrôle, son erreur apparaît ou disparaît,
 * le bouton se déplace et le clic, relâché à côté, est perdu.
 */
export function keepFocus(event: PreventableEvent): void {
  event.preventDefault();
}

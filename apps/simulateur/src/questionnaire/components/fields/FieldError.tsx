/**
 * Message d'erreur d'un champ.
 *
 * Pas de `role="alert"` : plusieurs champs peuvent être en erreur sur le même
 * écran, et autant d'annonces simultanées seraient illisibles. Le message est
 * rattaché au contrôle par `aria-describedby`, et l'écran déplace le focus sur
 * le premier champ fautif — c'est lui qui déclenche l'annonce.
 */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} className="text-destructive-text text-sm leading-5 font-semibold">
      {message}
    </p>
  );
}

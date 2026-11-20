/** Le temps laissé au nouvel onglet pour charger le fichier avant que son adresse soit libérée. */
const REVOKE_DELAY_MS = 60_000;

/** Ouvre dans un nouvel onglet un fichier resté dans le navigateur, sans l'envoyer nulle part. */
export function openFile(file: File): void {
  const url = URL.createObjectURL(file);
  window.open(url, "_blank", "noopener");
  // L'adresse garde le fichier en mémoire tant qu'elle n'est pas libérée.
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

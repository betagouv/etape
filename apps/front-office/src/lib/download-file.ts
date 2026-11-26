/** Le temps laissé au navigateur pour lancer le téléchargement avant que l'adresse soit libérée. */
const REVOKE_DELAY_MS = 60_000;

/** Enregistre sous son nom un fichier resté dans le navigateur, sans l'envoyer nulle part. */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  // Sans cela, le navigateur nomme le fichier d'après son adresse : une suite de chiffres et de lettres.
  link.download = file.name;
  link.click();
  // Libérée tout de suite, l'adresse peut annuler le téléchargement dans certains navigateurs.
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

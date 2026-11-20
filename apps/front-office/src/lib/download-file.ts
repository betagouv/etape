/** Enregistre sous son nom un fichier resté dans le navigateur, sans l'envoyer nulle part. */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  // Sans cela, le navigateur nomme le fichier d'après son adresse : une suite de chiffres et de lettres.
  link.download = file.name;
  link.click();
  // Le téléchargement est lancé : l'adresse peut être libérée, et le fichier quitter la mémoire.
  URL.revokeObjectURL(url);
}

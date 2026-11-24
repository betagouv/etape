/** « 12/1000 caractères » : le compteur d'une zone de texte limitée, tel que la maquette l'écrit. */
export function formatCharacterCount(count: number, maxLength: number): string {
  return `${count}/${maxLength} caractères`;
}

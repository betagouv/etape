/** Le type que le navigateur annonce, dans `DataTransfer.types`, quand on glisse des fichiers. */
const FILES_TYPE = "Files";

/** Vrai si ce qu'on glisse contient des fichiers, et non du texte ou un lien. */
export function hasDraggedFiles(types: readonly string[]): boolean {
  return types.includes(FILES_TYPE);
}

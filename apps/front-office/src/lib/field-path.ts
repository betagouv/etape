const PATH_SEPARATOR = ".";

/** Les segments du chemin d'un champ : `currentDemarche.typeDemarche` désigne `typeDemarche` dans `currentDemarche`. */
export function splitFieldPath(path: string): string[] {
  return path.split(PATH_SEPARATOR);
}

/** Ce que porte un objet au bout du chemin d'un champ ; `undefined` dès qu'un segment manque. */
export function readFieldPath(source: unknown, path: string): unknown {
  let value = source;
  for (const segment of splitFieldPath(path)) {
    if (typeof value !== "object" || value === null) return undefined;
    // `Reflect.get` : TypeScript ne laisse pas lire une clé connue seulement à l'exécution.
    value = Reflect.get(value, segment);
  }
  return value;
}

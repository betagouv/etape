/** `%`, `_` et `\` saisis se cherchent tels quels, au lieu de servir de jokers à `like`. */
export function escapeLikePattern(word: string): string {
  return word.replace(/[\\%_]/g, "\\$&");
}

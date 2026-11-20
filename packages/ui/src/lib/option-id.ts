/**
 * L'`id` du bouton d'une option dans un groupe de formulaire : « <champ>-<valeur> ». Le groupe
 * s'en sert pour relier chaque bouton à son libellé, l'écran pour y mener le focus.
 */
export function formatOptionId(name: string, value: string): string {
  return `${name}-${value}`;
}

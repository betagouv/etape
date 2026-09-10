/**
 * Compose un `aria-labelledby` / `aria-describedby` à partir d'ids optionnels.
 * Renvoie `undefined` plutôt qu'une chaîne vide : un attribut ARIA vide pointe
 * sur rien et prive l'élément de son nom accessible.
 */
export function joinIds(...ids: (string | undefined)[]): string | undefined {
  return ids.filter(Boolean).join(" ") || undefined;
}

/**
 * Marque l'élément à viser quand un champ est en erreur : c'est LUI qui reçoit
 * le focus, donc lui qui est annoncé, avec son libellé et son message.
 *
 * Un attribut à nous plutôt que `aria-invalid` : celui-ci n'est pas valide sur
 * un `role="group"` (l'ARIA le réserve aux widgets), or c'est justement la
 * forme d'un groupe de cases à cocher ou d'un couple mois/année. Les deux
 * cohabitent : `aria-invalid` là où il a un sens pour les technologies
 * d'assistance, celui-ci partout où il faut pouvoir viser le champ.
 */
export const FIELD_ERROR_ATTRIBUTE = "data-field-error";

/**
 * Marque un élément DÉJÀ focusable : un champ de saisie, un déclencheur de
 * liste, ou un `radiogroup` Radix (dont la racine porte le point d'entrée au
 * clavier — lui imposer un `tabIndex` casserait sa navigation).
 */
export function fieldErrorMark(error: string | undefined) {
  return error ? { [FIELD_ERROR_ATTRIBUTE]: "true" } : {};
}

/**
 * Marque un conteneur qui n'est pas focusable de lui-même (`role="group"`).
 * `tabIndex={-1}` le rend atteignable par programme sans l'ajouter à l'ordre
 * de tabulation.
 */
export function fieldErrorGroupMark(error: string | undefined) {
  return error ? { [FIELD_ERROR_ATTRIBUTE]: "true", tabIndex: -1 } : {};
}

export interface FieldErrors {
  [name: string]: { message?: string } | undefined;
}

/** Texte annoncé quand on quitte un champ : son libellé et son erreur, ou rien s'il est valide. */
export function formatFieldErrorAnnouncement(
  name: string,
  errors: FieldErrors,
  labels: Partial<Record<string, string>>,
): string {
  const message = errors[name]?.message;
  if (!message) return "";
  const label = labels[name];
  return label ? `${label} : ${message}` : message;
}

import { readFieldPath } from "@/lib/field-path";

/** L'erreur d'un champ. */
export interface FieldError {
  message?: string;
}

/** Les erreurs d'un formulaire, rangées comme ses valeurs : celles d'un champ objet sous son nom. */
export interface FieldErrors {
  [name: string]: FieldError | FieldErrors | undefined;
}

function isFieldError(value: unknown): value is FieldError {
  if (typeof value !== "object" || value === null) return false;
  if (!("message" in value) || value.message === undefined) return true;
  return typeof value.message === "string";
}

/** L'erreur du champ à ce chemin (`currentDemarche.typeDemarche`), s'il en porte une. */
export function findFieldError(errors: FieldErrors, name: string): FieldError | undefined {
  const error = readFieldPath(errors, name);
  return isFieldError(error) ? error : undefined;
}

/** Texte annoncé quand on quitte un champ : son libellé et son erreur, ou rien s'il est valide. */
export function formatFieldErrorAnnouncement(
  name: string,
  errors: FieldErrors,
  labels: Partial<Record<string, string>>,
): string {
  const message = findFieldError(errors, name)?.message;
  if (!message) return "";
  const label = labels[name];
  return label ? `${label} : ${message}` : message;
}

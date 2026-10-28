import { selectPlural, type PluralForms } from "@/lib/plural";

const ERROR_NOUNS: PluralForms<string> = {
  one: "erreur",
  other: "erreurs",
};

/** Titre de l'alerte qui liste les erreurs d'un volet. */
export function formatVoletErrorsTitle(errorCount: number): string {
  return `Le formulaire contient ${errorCount} ${selectPlural(errorCount, ERROR_NOUNS)}`;
}

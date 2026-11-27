import { selectPlural, type PluralForms } from "@/lib/plural";

const CHARACTER_LABELS: PluralForms<string> = { one: "caractère", other: "caractères" };

/** « 12/1000 caractères » : le compteur d'une zone de texte limitée, tel que la maquette l'écrit. */
export function formatCharacterCount(count: number, maxLength: number): string {
  return `${count}/${maxLength} caractères`;
}

/** « 12 caractères sur 1000 » : le même compteur tel qu'il se lit, sans barre oblique à épeler. */
export function formatCharacterCountAnnouncement(count: number, maxLength: number): string {
  return `${count} ${selectPlural(count, CHARACTER_LABELS)} sur ${maxLength}`;
}

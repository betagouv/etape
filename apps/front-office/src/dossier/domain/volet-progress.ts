import type { FieldErrors } from "./field-error-announcement";
import {
  formatStatutVoletAnnouncement,
  type SectionProgress,
  type VoletProgress,
} from "./statut-volet";

/** Les champs qu'un volet demande au vu des réponses en cours, et ceux d'entre eux qui sont remplis. */
export interface RequiredFields<TSection extends string = string, TName extends string = string> {
  sectionFields: Record<TSection, readonly TName[]>;
  allFields: readonly TName[];
  filledFields: readonly TName[];
}

/** Les champs qui ont une valeur : ne change qu'au passage de vide à rempli, pas à chaque frappe. */
export function listFilledFields<TName extends string>(
  values: Partial<Record<TName, unknown>>,
  fields: readonly TName[],
): TName[] {
  // Une valeur est une chaîne, un objet (l'employeur choisi) ou `null`.
  return fields.filter((name) => {
    const value = values[name];
    return value !== undefined && value !== null && value !== "";
  });
}

/** Nombre de champs demandés parmi les champs remplis. */
function countFilled(filledFields: readonly string[], fields: readonly string[]): number {
  return fields.filter((name) => filledFields.includes(name)).length;
}

/** Nombre de champs demandés qui portent une erreur. */
function countInvalid(errors: FieldErrors, fields: readonly string[]): number {
  return fields.filter((name) => errors[name] !== undefined).length;
}

/** Avancement d'un volet sur les champs qu'il demande : remplis, restants et en erreur. */
export function computeVoletProgress(
  requiredFields: readonly string[],
  filledFields: readonly string[],
  errors: FieldErrors,
): VoletProgress {
  const filledFieldCount = countFilled(filledFields, requiredFields);
  return {
    requiredFieldCount: requiredFields.length,
    filledFieldCount,
    remainingFieldCount: requiredFields.length - filledFieldCount,
    errorCount: countInvalid(errors, requiredFields),
  };
}

/** Avancement d'une section sur ses champs : restants et en erreur. */
function computeSectionProgress(
  fields: readonly string[],
  filledFields: readonly string[],
  errors: FieldErrors,
): SectionProgress {
  return {
    remainingFieldCount: fields.length - countFilled(filledFields, fields),
    errorCount: countInvalid(errors, fields),
  };
}

/** Avancement de chaque section d'un volet, sur ses champs : restants et en erreur. */
export function computeSectionsProgress<TSection extends string>(
  sectionFields: Record<TSection, readonly string[]>,
  filledFields: readonly string[],
  errors: FieldErrors,
): Record<TSection, SectionProgress> {
  // `Object.entries` perd le type des clés, le cast le rend : `sectionFields` porte toutes
  // les sections, donc le résultat aussi.
  return Object.fromEntries(
    Object.entries<readonly string[]>(sectionFields).map(([section, fields]) => [
      section,
      computeSectionProgress(fields, filledFields, errors),
    ]),
  ) as Record<TSection, SectionProgress>;
}

/** Le statut d'un volet tel qu'il s'annonce : « Mes informations : 1 erreur à corriger et 4 champs restants. » */
export function describeVoletStatut(
  voletLabel: string,
  { allFields, filledFields }: RequiredFields,
  errors: FieldErrors,
): string {
  return formatStatutVoletAnnouncement(
    voletLabel,
    computeVoletProgress(allFields, filledFields, errors),
  );
}

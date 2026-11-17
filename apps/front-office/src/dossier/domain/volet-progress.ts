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
  /** Les champs contrôlés, exigés ou non, dans l'ordre de la page : ce sont eux qui peuvent porter une erreur. */
  sectionValidatedFields: Record<TSection, readonly TName[]>;
}

/** Les champs contrôlés de tout le volet, dans l'ordre de la page. */
export function listValidatedFields<TName extends string>({
  sectionValidatedFields,
}: RequiredFields<string, TName>): TName[] {
  return Object.values<readonly TName[]>(sectionValidatedFields).flat();
}

/** Les champs qui ont une valeur : ne change qu'au passage de vide à rempli, pas à chaque frappe. */
export function listFilledFields<TName extends string>(
  values: Partial<Record<TName, unknown>>,
  fields: readonly TName[],
): TName[] {
  // Une chaîne, un objet (l'employeur choisi) ou `null` ; une chaîne d'espaces est vide, comme pour le schéma.
  return fields.filter((name) => {
    const value = values[name];
    return (
      value !== undefined && value !== null && (typeof value !== "string" || value.trim() !== "")
    );
  });
}

/** Nombre de champs demandés parmi les champs remplis. */
function countFilled(filledFields: readonly string[], fields: readonly string[]): number {
  return fields.filter((name) => filledFields.includes(name)).length;
}

/** Nombre de champs qui portent une erreur. */
function countInvalid(errors: FieldErrors, fields: readonly string[]): number {
  return fields.filter((name) => errors[name] !== undefined).length;
}

/**
 * Avancement d'un volet : remplis et restants parmi les champs qu'il demande, en erreur parmi
 * ceux qu'il contrôle. Un champ facultatif mal rempli compte donc comme une erreur.
 */
export function computeVoletProgress(
  requiredFields: RequiredFields,
  errors: FieldErrors,
): VoletProgress {
  const { allFields, filledFields } = requiredFields;
  const filledFieldCount = countFilled(filledFields, allFields);
  return {
    requiredFieldCount: allFields.length,
    filledFieldCount,
    remainingFieldCount: allFields.length - filledFieldCount,
    errorCount: countInvalid(errors, listValidatedFields(requiredFields)),
  };
}

/** Avancement d'une section d'un volet : restants parmi ses champs demandés, en erreur parmi ses champs contrôlés. */
export function computeSectionProgress<TSection extends string>(
  { sectionFields, filledFields, sectionValidatedFields }: RequiredFields<TSection>,
  section: TSection,
  errors: FieldErrors,
): SectionProgress {
  const fields = sectionFields[section];
  return {
    remainingFieldCount: fields.length - countFilled(filledFields, fields),
    errorCount: countInvalid(errors, sectionValidatedFields[section]),
  };
}

/** Le statut d'un volet tel qu'il s'annonce : « Mes informations : 1 erreur à corriger et 4 champs restants. » */
export function describeVoletStatut(
  voletLabel: string,
  requiredFields: RequiredFields,
  errors: FieldErrors,
): string {
  return formatStatutVoletAnnouncement(voletLabel, computeVoletProgress(requiredFields, errors));
}

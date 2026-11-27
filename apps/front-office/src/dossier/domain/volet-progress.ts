import { readFieldPath } from "@/lib/field-path";
import { findFieldError, type FieldErrors } from "./field-error-announcement";
import type { SectionProgress, VoletProgress } from "./statut-volet";

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

/**
 * Les champs qui ont une valeur : ne change qu'au passage de vide à rempli, pas à chaque frappe.
 * Un champ se nomme par son chemin dans `values` : `currentDemarche.typeDemarche`.
 */
export function listFilledFields<TName extends string>(
  values: object,
  fields: readonly TName[],
): TName[] {
  // Une chaîne, un objet (l'employeur choisi), un tableau (les pièces d'un document) ou `null` ;
  // une chaîne d'espaces est vide, comme pour le schéma, et un tableau sans élément aussi.
  return fields.filter((name) => {
    const value = readFieldPath(values, name);
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

/**
 * Les champs demandés, remplis et contrôlés d'un volet, à partir des champs de ses sections.
 * Sans champ facultatif contrôlé, les champs contrôlés sont les champs demandés.
 */
export function buildRequiredFields<TSection extends string, TName extends string>(
  values: object,
  sectionFields: Record<TSection, readonly TName[]>,
  sectionValidatedFields: Record<TSection, readonly TName[]> = sectionFields,
): RequiredFields<TSection, TName> {
  const allFields = Object.values<readonly TName[]>(sectionFields).flat();
  return {
    sectionFields,
    allFields,
    filledFields: listFilledFields(values, allFields),
    sectionValidatedFields,
  };
}

/** Nombre de champs demandés parmi les champs remplis. */
function countFilled(filledFields: readonly string[], fields: readonly string[]): number {
  return fields.filter((name) => filledFields.includes(name)).length;
}

/** Nombre de champs qui portent une erreur. */
function countInvalid(errors: FieldErrors, fields: readonly string[]): number {
  return fields.filter((name) => findFieldError(errors, name) !== undefined).length;
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

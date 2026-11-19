import {
  INFORMATIONS_SECTION,
  type InformationsFieldName,
  type InformationsSection,
} from "../schema";

/** Champs obligatoires de chaque section ; les champs préremplis n'y figurent pas. */
export const INFORMATIONS_SECTION_FIELDS: Record<
  InformationsSection,
  readonly InformationsFieldName[]
> = {
  [INFORMATIONS_SECTION.IDENTITE]: ["civilite", "dateNaissance", "nationalite", "nir", "cleNir"],
  [INFORMATIONS_SECTION.CONTACT]: ["telephone"],
};

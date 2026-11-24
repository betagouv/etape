import {
  INFORMATIONS_SECTION,
  type InformationsFieldName,
  type InformationsSection,
} from "../schema";

/** Champs obligatoires de chaque section ; les champs préremplis n'y figurent pas. */
const INFORMATIONS_SECTION_FIELDS: Record<InformationsSection, readonly InformationsFieldName[]> = {
  [INFORMATIONS_SECTION.IDENTITE]: ["civilite", "dateNaissance", "nationalite", "nir", "cleNir"],
  [INFORMATIONS_SECTION.CONTACT]: ["telephone"],
};

/** Les champs demandés dans chaque section : toujours les mêmes dans ce volet. */
export function findSectionFields(): Record<InformationsSection, readonly InformationsFieldName[]> {
  return INFORMATIONS_SECTION_FIELDS;
}

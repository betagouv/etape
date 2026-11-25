import type { DocumentObligatoire } from "../../documents/domain/document-obligatoire";
import { DOCUMENTS_FIELD } from "../../documents/schema";

/**
 * Les documents de « Mes documents » que ce volet propose aussi de déposer, avec les textes de
 * la maquette « Ma formation » (écran 01) : le même champ, donc les mêmes pièces dans les deux volets.
 */
export const DOCUMENTS_FORMATION = {
  CALENDRIER: {
    field: DOCUMENTS_FIELD.CALENDRIER_FORMATION,
    title: "Calendrier de la formation",
    description:
      "Le document de l’organisme qui indique les dates et le rythme de la formation. Obligatoire pour signer : vous pouvez le déposer ici ou plus tard dans « Mes documents ».",
    dropLabel: "Relâchez pour ajouter vos fichiers au calendrier de la formation.",
  },
  PROGRAMME: {
    field: DOCUMENTS_FIELD.PROGRAMME_FORMATION,
    title: "Programme de la formation",
    description:
      "Le programme détaillé remis par l’organisme. Obligatoire pour signer : vous pouvez le déposer ici ou plus tard dans « Mes documents ».",
    dropLabel: "Relâchez pour ajouter vos fichiers au programme de la formation.",
  },
} as const satisfies Record<string, DocumentObligatoire>;

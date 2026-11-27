import type { RemoteSearchTexts } from "../../domain/remote-search";

/** Les textes de la recherche du diplôme ; les titres des alertes sont aussi annoncés. */
export const CERTIFICATION_VISEE_SEARCH_TEXTS: RemoteSearchTexts = {
  description: "Recherchez par intitulé ou par code RNCP ou RS. Par exemple : CAP boulanger",
  listLabel: "Certifications",
  noResultTitle: "Aucune certification ne correspond à cette recherche",
  noResultDescription:
    "Vérifiez l’orthographe ou essayez le code RNCP ou RS indiqué sur le programme.",
  errorTitle: "La recherche de certifications ne répond pas pour le moment",
  errorDescription: "Vous pouvez saisir vous-même l’intitulé du diplôme, titre ou certificat.",
  manualEntryLabel: "Saisir le diplôme moi-même",
  moreMessage: "Précisez votre recherche pour voir les autres certifications.",
  foundLabels: { one: "certification trouvée", other: "certifications trouvées" },
};

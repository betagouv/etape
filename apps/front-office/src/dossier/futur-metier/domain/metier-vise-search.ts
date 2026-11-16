import type { RemoteSearchTexts } from "../../domain/remote-search";

/** Les textes de la recherche du métier visé ; les titres des alertes sont aussi annoncés. */
export const METIER_VISE_SEARCH_TEXTS: RemoteSearchTexts = {
  description: "Par exemple : boulanger, aide-soignant, développeur web.",
  listLabel: "Métiers",
  noResultTitle: "Aucun métier ne correspond à cette recherche",
  noResultDescription: "Vérifiez l’orthographe ou essayez un autre intitulé.",
  errorTitle: "La recherche de métiers ne répond pas pour le moment",
  errorDescription: "Vous pouvez saisir vous-même l’intitulé du métier visé.",
  manualEntryLabel: "Saisir le métier moi-même",
  moreMessage: "Précisez votre recherche pour voir les autres métiers.",
  foundLabels: { one: "métier trouvé", other: "métiers trouvés" },
};

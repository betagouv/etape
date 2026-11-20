import type { RemoteSearchTexts } from "../../domain/remote-search";

/** Les textes de la recherche d'employeur ; les titres des alertes sont aussi annoncés. */
export const EMPLOYEUR_SEARCH_TEXTS: RemoteSearchTexts = {
  description:
    "Saisissez le numéro SIRET indiqué sur votre bulletin de salaire, ou le nom de l’entreprise suivi de la ville.",
  listLabel: "Établissements",
  noResultTitle: "Aucun établissement ne correspond à cette recherche",
  noResultDescription:
    "Vérifiez l’orthographe, ajoutez la ville, ou saisissez le numéro SIRET indiqué sur votre bulletin de salaire.",
  errorTitle: "La recherche d’entreprises ne répond pas pour le moment",
  errorDescription: "Vous pouvez saisir vous-même les informations de votre employeur.",
  manualEntryLabel: "Saisir mon employeur moi-même",
  moreMessage: "Précisez votre recherche pour voir les autres établissements.",
  foundLabels: { one: "établissement trouvé", other: "établissements trouvés" },
};

import type { Etablissement, SearchEtablissementsResponse } from "@etape/api-contract";
import { stripDiacritics } from "@etape/utils/text";

import { LIBELLES_NAF } from "../secteur-activite/libelles-naf.js";

const SEARCH_RESULT_LIMIT = 20;

const SIRET_PATTERN = /^\d{14}$/;

const SIRENE_FIELDS = [
  "siret",
  "denominationUniteLegale",
  "nomUniteLegale",
  "prenomUsuelUniteLegale",
  "enseigne1Etablissement",
  "numeroVoieEtablissement",
  "typeVoieEtablissement",
  "libelleVoieEtablissement",
  "codePostalEtablissement",
  "libelleCommuneEtablissement",
  "activitePrincipaleEtablissement",
].join(",");

/** Réponse de `GET /siret` restreinte à `SIRENE_FIELDS`. */
export interface SireneSearchResponse {
  header: { total: number };
  etablissements: SireneEtablissement[];
}

interface SireneEtablissement {
  siret: string;
  uniteLegale: {
    denominationUniteLegale: string | null;
    nomUniteLegale: string | null;
    prenomUsuelUniteLegale: string | null;
  };
  adresseEtablissement: {
    numeroVoieEtablissement: string | null;
    typeVoieEtablissement: string | null;
    libelleVoieEtablissement: string | null;
    codePostalEtablissement: string | null;
    libelleCommuneEtablissement: string | null;
  };
  /** La période en cours d'abord. */
  periodesEtablissement: {
    enseigne1Etablissement: string | null;
    activitePrincipaleEtablissement: string | null;
  }[];
}

/**
 * Un SIRET (espaces, points et tirets tolérés), sinon chaque mot cherché en début de mot du nom ou
 * de la commune. `null` sans aucun mot : Sirene refuserait une requête vide.
 */
export function buildSireneSearchUrl(baseUrl: string, search: string): URL | null {
  const siret = search.replace(/[\s.-]/g, "");
  // Seuls lettres et chiffres passent : le reste ferait partie de la syntaxe de `q`.
  // Sirene ignore les accents ; les retirer évite qu'une saisie décomposée (NFD) soit coupée en deux mots.
  const words = stripDiacritics(search).match(/[\p{L}\p{N}]+/gu) ?? [];

  const criteria = SIRET_PATTERN.test(siret)
    ? `siret:${siret}`
    : words
        .map((word) => `(raisonSociale:${word}* OR libelleCommuneEtablissement:${word}*)`)
        .join(" AND ");

  if (criteria === "") return null;

  const query = `${criteria} AND statutDiffusionEtablissement:O`;

  const url = new URL(`${baseUrl}/siret`);
  url.searchParams.set("q", query);
  url.searchParams.set("nombre", String(SEARCH_RESULT_LIMIT));
  url.searchParams.set("champs", SIRENE_FIELDS);
  return url;
}

export function toSearchEtablissementsResponse(
  sirene: SireneSearchResponse,
): SearchEtablissementsResponse {
  return {
    etablissementCount: sirene.header.total,
    etablissements: sirene.etablissements.map(toEtablissement),
  };
}

function toEtablissement({
  siret,
  uniteLegale,
  adresseEtablissement: adresse,
  periodesEtablissement: [periode],
}: SireneEtablissement): Etablissement {
  const codeNaf = periode?.activitePrincipaleEtablissement ?? null;

  return {
    siret,
    // Une entreprise individuelle n'a pas de dénomination : son nom est celui de la personne.
    denomination:
      uniteLegale.denominationUniteLegale ??
      [uniteLegale.prenomUsuelUniteLegale, uniteLegale.nomUniteLegale].filter(Boolean).join(" "),
    enseigne: periode?.enseigne1Etablissement ?? null,
    adresse: [
      adresse.numeroVoieEtablissement,
      adresse.typeVoieEtablissement,
      adresse.libelleVoieEtablissement,
      adresse.codePostalEtablissement,
      adresse.libelleCommuneEtablissement,
    ]
      .filter(Boolean)
      .join(" "),
    // Hors NAF rév. 2 (ancienne nomenclature) ou sans code : pas de libellé.
    secteurActivite: (codeNaf && LIBELLES_NAF[codeNaf]) ?? null,
  };
}

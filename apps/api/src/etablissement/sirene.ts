import type { Etablissement, SearchEtablissementsResponse } from "@etape/api-contract";
import { stripDiacritics } from "@etape/utils/text";
import { z } from "zod";

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

const sireneEtablissementSchema = z.object({
  siret: z.string(),
  uniteLegale: z.object({
    denominationUniteLegale: z.string().nullable(),
    nomUniteLegale: z.string().nullable(),
    prenomUsuelUniteLegale: z.string().nullable(),
  }),
  adresseEtablissement: z.object({
    numeroVoieEtablissement: z.string().nullable(),
    typeVoieEtablissement: z.string().nullable(),
    libelleVoieEtablissement: z.string().nullable(),
    codePostalEtablissement: z.string().nullable(),
    libelleCommuneEtablissement: z.string().nullable(),
  }),
  /** La période en cours d'abord. */
  periodesEtablissement: z.array(
    z.object({
      enseigne1Etablissement: z.string().nullable(),
      activitePrincipaleEtablissement: z.string().nullable(),
    }),
  ),
});

type SireneEtablissement = z.infer<typeof sireneEtablissementSchema>;

/** Réponse de `GET /siret` restreinte à `SIRENE_FIELDS`. */
export const sireneSearchResponseSchema = z.object({
  header: z.object({ total: z.number() }),
  etablissements: z.array(sireneEtablissementSchema),
});

export type SireneSearchResponse = z.infer<typeof sireneSearchResponseSchema>;

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

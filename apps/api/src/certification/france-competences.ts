import { parse } from "csv-parse/sync";
import { unzipSync } from "fflate";
import { z } from "zod";

import {
  REPERTOIRE_CERTIFICATION,
  STATUT_CERTIFICATION,
  type Certificateur,
  type ImportedCertification,
  type RepertoireCertification,
} from "./certification.types.js";

// Le jeu de données garde chaque export quotidien : 8 000 ressources, dont seul le dernier zip CSV sert.
const EXPORT_SEARCH = "export-fiches-csv";
const EXPORT_PAGE_SIZE = "10";
const EXPORT_TITLE_PATTERN = /^export-fiches-csv-\d{4}-\d{2}-\d{2}\.zip$/;

// Les noms des fichiers du zip portent des accents mal encodés : on les repère par leur partie ASCII.
const STANDARD_ENTRY = "_Standard_";
const CERTIFICATEURS_ENTRY = "_Certificateurs_";

const CSV_DELIMITER = ";";

const NUMERO_FICHE_PATTERN = /^(RNCP|RS)\d+$/;
const NIVEAU_PATTERN = /^NIV([2-8])$/;
const SIRET_PATTERN = /^\d{14}$/;

// Abrégé de repli de France compétences : « Autre Boulanger » n'apprendrait rien au bénéficiaire.
const ABREGE_AUTRE = "Autre";

/** Réponse de `GET /api/2/datasets/{id}/resources/` de data.gouv, restreinte à ce qui sert. */
export const exportResourcesResponseSchema = z.object({
  data: z.array(
    z.object({
      title: z.string(),
      url: z.url(),
      last_modified: z.iso.datetime({ offset: true }),
    }),
  ),
});

export type ExportResourcesResponse = z.infer<typeof exportResourcesResponseSchema>;

const standardRowSchema = z.object({
  Numero_Fiche: z.string().regex(NUMERO_FICHE_PATTERN),
  Intitule: z.string(),
  Abrege_Libelle: z.string(),
  Nomenclature_Europe_Niveau: z.string(),
  Actif: z.enum(STATUT_CERTIFICATION),
});

const certificateurRowSchema = z.object({
  Numero_Fiche: z.string(),
  // Le SIRET de l'export commence par une tabulation.
  Siret_Certificateur: z.string().trim().regex(SIRET_PATTERN),
  Nom_Certificateur: z.string(),
});

/** Le slash final évite la redirection 308 de data.gouv. */
export function buildExportResourcesUrl(baseUrl: string): URL {
  const url = new URL(`${baseUrl}/`);
  url.searchParams.set("q", EXPORT_SEARCH);
  url.searchParams.set("page_size", EXPORT_PAGE_SIZE);
  return url;
}

/** Le zip CSV le plus récent ; une erreur si aucun ne figure dans la réponse. */
export function findLatestExportUrl(response: ExportResourcesResponse): URL {
  const [latest] = response.data
    .filter(({ title }) => EXPORT_TITLE_PATTERN.test(title))
    .sort((a, b) => Date.parse(b.last_modified) - Date.parse(a.last_modified));
  if (!latest) throw new Error("Aucun export CSV des certifications sur data.gouv");

  return new URL(latest.url);
}

/** Les deux fichiers CSV du zip dont l'import a besoin. */
export function extractExportCsv(zip: Uint8Array): { standard: string; certificateurs: string } {
  const files = Object.entries(
    unzipSync(zip, {
      filter: ({ name }) => name.includes(STANDARD_ENTRY) || name.includes(CERTIFICATEURS_ENTRY),
    }),
  );
  const decoder = new TextDecoder();
  const read = (entry: string): string => {
    const file = files.find(([name]) => name.includes(entry));
    if (!file) throw new Error(`Fichier ${entry} absent de l'export des certifications`);
    return decoder.decode(file[1]);
  };

  return { standard: read(STANDARD_ENTRY), certificateurs: read(CERTIFICATEURS_ENTRY) };
}

/**
 * Rattache à chaque fiche ses certificateurs ; ceux d'une fiche absente sont ignorés. Une fiche,
 * ou un certificateur d'une même fiche, présent deux fois ne compte qu'une fois, dans sa dernière
 * version : un doublon ferait échouer l'écriture en masse.
 */
export function parseCertifications(
  standardCsv: string,
  certificateursCsv: string,
): ImportedCertification[] {
  const certificateursByFiche = new Map<string, Map<string, Certificateur>>();
  for (const row of z.array(certificateurRowSchema).parse(parseCsv(certificateursCsv))) {
    const certificateurs = certificateursByFiche.get(row.Numero_Fiche) ?? new Map();
    certificateurs.set(row.Siret_Certificateur, {
      siret: row.Siret_Certificateur,
      nom: collapseWhitespace(row.Nom_Certificateur),
    });
    certificateursByFiche.set(row.Numero_Fiche, certificateurs);
  }

  const certifications = new Map<string, ImportedCertification>();
  for (const row of z.array(standardRowSchema).parse(parseCsv(standardCsv))) {
    certifications.set(row.Numero_Fiche, {
      numeroFiche: row.Numero_Fiche,
      repertoire: toRepertoire(row.Numero_Fiche),
      intitule: collapseWhitespace(row.Intitule),
      abrege: toAbrege(row.Abrege_Libelle),
      niveau: toNiveau(row.Nomenclature_Europe_Niveau),
      statut: row.Actif,
      certificateurs: [...(certificateursByFiche.get(row.Numero_Fiche)?.values() ?? [])],
    });
  }

  return [...certifications.values()];
}

function parseCsv(csv: string): unknown[] {
  return parse(csv, { columns: true, delimiter: CSV_DELIMITER, bom: true, skip_empty_lines: true });
}

// 3 045 intitulés de l'export contiennent un retour à la ligne.
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function toRepertoire(numeroFiche: string): RepertoireCertification {
  return numeroFiche.startsWith(REPERTOIRE_CERTIFICATION.RNCP)
    ? REPERTOIRE_CERTIFICATION.RNCP
    : REPERTOIRE_CERTIFICATION.RS;
}

function toAbrege(abrege: string): string | null {
  const trimmed = abrege.trim();
  return trimmed === "" || trimmed === ABREGE_AUTRE ? null : trimmed;
}

/** « NIV4 » donne 4 ; vide (fiche RS) ou « REPRISE » (ancienne nomenclature) ne donnent rien. */
function toNiveau(niveau: string): number | null {
  const [, digit] = NIVEAU_PATTERN.exec(niveau) ?? [];
  return digit === undefined ? null : Number(digit);
}

import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { REPERTOIRE_CERTIFICATION, STATUT_CERTIFICATION } from "./certification.types.js";
import {
  buildExportResourcesUrl,
  extractExportCsv,
  findLatestExport,
  parseCertifications,
  type ExportResourcesResponse,
} from "./france-competences.js";

const RESOURCES_URL = "https://data.test/api/2/datasets/rncp/resources";

const STANDARD_HEADER =
  '"Id_Fiche";"Numero_Fiche";"Intitule";"Abrege_Libelle";"Abrege_Intitule";"Nomenclature_Europe_Niveau";"Actif"';
const CERTIFICATEURS_HEADER = '"Numero_Fiche";"Siret_Certificateur";"Nom_Certificateur"';

function csv(header: string, ...lines: string[]): string {
  return [header, ...lines].join("\r\n");
}

function resource(title: string, lastModified: string): ExportResourcesResponse["data"][number] {
  return {
    title,
    url: `https://static.data.test/${title}`,
    last_modified: lastModified,
  };
}

describe("buildExportResourcesUrl", () => {
  it("cherche les exports CSV, avec le slash final qui évite la redirection", () => {
    expect(String(buildExportResourcesUrl(RESOURCES_URL))).toBe(
      `${RESOURCES_URL}/?q=export-fiches-csv&page_size=10`,
    );
  });
});

describe("findLatestExport", () => {
  it("prend le zip CSV le plus récent, quel que soit l'ordre de la réponse", () => {
    const { fileName, url } = findLatestExport({
      data: [
        resource("export-fiches-csv-2026-11-23.zip", "2026-11-23T02:00:09.055000+00:00"),
        resource("export-fiches-csv-2026-11-24.zip", "2026-11-24T02:00:09.694000+00:00"),
        resource("export-fiches-rncp-v4-1-2026-11-25.zip", "2026-11-25T02:00:51.000000+00:00"),
      ],
    });

    expect(fileName).toBe("export-fiches-csv-2026-11-24.zip");
    expect(String(url)).toBe("https://static.data.test/export-fiches-csv-2026-11-24.zip");
  });

  it("refuse une réponse sans export CSV", () => {
    expect(() => findLatestExport({ data: [] })).toThrow(
      "Aucun export CSV des certifications sur data.gouv",
    );
  });
});

describe("extractExportCsv", () => {
  it("lit les fichiers Standard et Certificateurs malgré leurs noms mal encodés", () => {
    const zip = zipSync({
      "export_fiches_CSV_Standard_2026_11_23.csv": strToU8("standard"),
      "export_fiches_CSV_Certificateurs_2026_11_23.csv": strToU8("certificateurs"),
      "export_fiches_CSV_Blocs_De_CompÃ©tences_2026_11_23.csv": strToU8("blocs"),
    });

    expect(extractExportCsv(zip)).toEqual({
      standard: "standard",
      certificateurs: "certificateurs",
    });
  });

  it("refuse un zip sans fichier des certificateurs", () => {
    const zip = zipSync({ "export_fiches_CSV_Standard_2026_11_23.csv": strToU8("standard") });

    expect(() => extractExportCsv(zip)).toThrow(
      "Fichier _Certificateurs_ absent de l'export des certifications",
    );
  });
});

describe("parseCertifications", () => {
  it("rattache à chaque fiche ses certificateurs, SIRET sans tabulation", () => {
    const certifications = parseCertifications(
      csv(
        STANDARD_HEADER,
        '"1";"RNCP41937";"Boulanger";"BP";"Brevet professionnel";"NIV4";"ACTIVE"',
      ),
      csv(
        CERTIFICATEURS_HEADER,
        '"RNCP41937";"\t11000007200014";"MINISTERE DE L\'EDUCATION NATIONALE"',
        '"RNCP41937";"\t13002526500013";"MINISTERE DE L\'AGRICULTURE"',
      ),
    );

    expect(certifications).toEqual([
      {
        numeroFiche: "RNCP41937",
        repertoire: REPERTOIRE_CERTIFICATION.RNCP,
        intitule: "Boulanger",
        abrege: "BP",
        niveau: 4,
        statut: STATUT_CERTIFICATION.ACTIVE,
        certificateurs: [
          { siret: "11000007200014", nom: "MINISTERE DE L'EDUCATION NATIONALE" },
          { siret: "13002526500013", nom: "MINISTERE DE L'AGRICULTURE" },
        ],
      },
    ]);
  });

  it("lit une fiche RS, sans niveau ni abrégé", () => {
    const [certification] = parseCertifications(
      csv(STANDARD_HEADER, '"2";"RS5547";"Instructeur ULM";"";"";"";"INACTIVE"'),
      csv(CERTIFICATEURS_HEADER),
    );

    expect(certification).toMatchObject({
      repertoire: REPERTOIRE_CERTIFICATION.RS,
      abrege: null,
      niveau: null,
      statut: STATUT_CERTIFICATION.INACTIVE,
      certificateurs: [],
    });
  });

  it("réduit les espaces et le retour à la ligne d'un intitulé", () => {
    const [certification] = parseCertifications(
      csv(
        STANDARD_HEADER,
        '"3";"RNCP181";"Technicien supérieur  en contrôle \n";"";"";"NIV5";"ACTIVE"',
      ),
      csv(CERTIFICATEURS_HEADER),
    );

    expect(certification?.intitule).toBe("Technicien supérieur en contrôle");
  });

  it("ne garde ni l'abrégé « Autre » ni le niveau « REPRISE »", () => {
    const [certification] = parseCertifications(
      csv(STANDARD_HEADER, '"4";"RNCP183";"Monteur";"Autre";"Autre";"REPRISE";"INACTIVE"'),
      csv(CERTIFICATEURS_HEADER),
    );

    expect(certification).toMatchObject({ abrege: null, niveau: null });
  });

  it("ignore les certificateurs d'une fiche absente", () => {
    const certifications = parseCertifications(
      csv(STANDARD_HEADER, '"1";"RNCP41937";"Boulanger";"BP";"";"NIV4";"ACTIVE"'),
      csv(CERTIFICATEURS_HEADER, '"RNCP99999";"11000007200014";"MINISTERE"'),
    );

    expect(certifications.map(({ certificateurs }) => certificateurs)).toEqual([[]]);
  });

  it("garde une seule fois une fiche ou un certificateur en double, dans sa dernière version", () => {
    const certifications = parseCertifications(
      csv(
        STANDARD_HEADER,
        '"1";"RNCP41937";"Boulanger";"BP";"";"NIV4";"ACTIVE"',
        '"2";"RNCP41937";"Boulanger pâtissier";"BP";"";"NIV4";"ACTIVE"',
      ),
      csv(
        CERTIFICATEURS_HEADER,
        '"RNCP41937";"11000007200014";"MINISTERE"',
        '"RNCP41937";"11000007200014";"MINISTERE DE L\'EDUCATION NATIONALE"',
      ),
    );

    expect(certifications).toMatchObject([
      {
        intitule: "Boulanger pâtissier",
        certificateurs: [{ siret: "11000007200014", nom: "MINISTERE DE L'EDUCATION NATIONALE" }],
      },
    ]);
  });

  it("refuse un numéro de fiche hors RNCP et RS", () => {
    expect(() =>
      parseCertifications(
        csv(STANDARD_HEADER, '"1";"XYZ1";"Boulanger";"";"";"NIV4";"ACTIVE"'),
        csv(CERTIFICATEURS_HEADER),
      ),
    ).toThrow(ZodError);
  });
});

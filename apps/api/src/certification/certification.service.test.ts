import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "../config/env.js";
import { FakeCertificationRepository } from "./certification.repository.fake.js";
import { CertificationService } from "./certification.service.js";
import {
  REPERTOIRE_CERTIFICATION,
  STATUT_CERTIFICATION,
  type Certificateur,
  type ImportedCertification,
} from "./certification.types.js";
import { FranceCompetencesClient } from "./france-competences.client.js";

const EXPORT_FILE_NAME = "export-fiches-csv-2026-11-25.zip";

const EDUCATION_NATIONALE: Certificateur = {
  siret: "11000007200014",
  nom: "Ministère de l'Éducation nationale",
};

const FEDERATION_BOULANGERIE: Certificateur = {
  siret: "78435466400029",
  nom: "Fédération des entreprises de boulangerie",
};

const BP_BOULANGER: ImportedCertification = {
  numeroFiche: "RNCP41937",
  repertoire: REPERTOIRE_CERTIFICATION.RNCP,
  intitule: "Boulanger",
  abrege: "BP",
  niveau: 4,
  statut: STATUT_CERTIFICATION.ACTIVE,
  certificateurs: [EDUCATION_NATIONALE],
};

const CQP_BOULANGER: ImportedCertification = {
  numeroFiche: "RNCP42950",
  repertoire: REPERTOIRE_CERTIFICATION.RNCP,
  intitule: "CQP Boulanger",
  abrege: null,
  niveau: 3,
  statut: STATUT_CERTIFICATION.ACTIVE,
  certificateurs: [FEDERATION_BOULANGERIE],
};

const AIDE_BOULANGER: ImportedCertification = {
  numeroFiche: "RNCP41648",
  repertoire: REPERTOIRE_CERTIFICATION.RNCP,
  intitule: "Aide boulanger",
  abrege: null,
  niveau: 3,
  statut: STATUT_CERTIFICATION.ACTIVE,
  certificateurs: [],
};

const ANCIEN_BOULANGER: ImportedCertification = {
  ...BP_BOULANGER,
  numeroFiche: "RNCP181",
  statut: STATUT_CERTIFICATION.INACTIVE,
};

function setup() {
  const client = new FranceCompetencesClient(new ConfigService<Env, true>({}));
  const repository = new FakeCertificationRepository();

  return {
    repository,
    service: new CertificationService(client, repository),
    fetchCertifications: vi.spyOn(client, "fetchCertifications"),
  };
}

async function importExport(
  { service, fetchCertifications }: ReturnType<typeof setup>,
  certifications: ImportedCertification[],
): Promise<void> {
  fetchCertifications.mockResolvedValueOnce({ fileName: EXPORT_FILE_NAME, certifications });
  await service.syncCertifications();
}

describe("CertificationService : import", () => {
  const log = vi.spyOn(Logger.prototype, "log");

  beforeEach(() => {
    log.mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockReset();
  });

  it("importe les fiches, inactives comprises, et leurs certificateurs", async () => {
    const context = setup();

    await importExport(context, [BP_BOULANGER, ANCIEN_BOULANGER]);

    expect(context.repository.certifications.get("RNCP181")?.statut).toBe(
      STATUT_CERTIFICATION.INACTIVE,
    );
    expect(context.repository.listCertificateurs("RNCP41937")).toEqual([EDUCATION_NATIONALE]);
  });

  it("ne journalise que le fichier importé et les deux compteurs", async () => {
    const context = setup();

    await importExport(context, [BP_BOULANGER, ANCIEN_BOULANGER]);

    expect(log).toHaveBeenCalledExactlyOnceWith(
      "Certifications importées de export-fiches-csv-2026-11-25.zip : 2 fiches, dont 1 actives.",
    );
  });

  it("reprend un intitulé, un statut et un certificateur modifiés", async () => {
    const context = setup();
    await importExport(context, [BP_BOULANGER]);

    await importExport(context, [
      {
        ...BP_BOULANGER,
        intitule: "Boulanger (BP)",
        statut: STATUT_CERTIFICATION.INACTIVE,
        certificateurs: [{ ...EDUCATION_NATIONALE, nom: "Ministère de l'Éducation" }],
      },
    ]);

    expect(context.repository.certifications.get("RNCP41937")).toMatchObject({
      intitule: "Boulanger (BP)",
      statut: STATUT_CERTIFICATION.INACTIVE,
    });
    expect(context.repository.listCertificateurs("RNCP41937")).toEqual([
      { ...EDUCATION_NATIONALE, nom: "Ministère de l'Éducation" },
    ]);
  });

  it("retire d'une fiche le certificateur qu'elle ne liste plus", async () => {
    const context = setup();
    await importExport(context, [
      { ...BP_BOULANGER, certificateurs: [EDUCATION_NATIONALE, FEDERATION_BOULANGERIE] },
    ]);

    await importExport(context, [BP_BOULANGER]);

    expect(context.repository.listCertificateurs("RNCP41937")).toEqual([EDUCATION_NATIONALE]);
  });

  it("garde une fiche absente de l'export, avec ses certificateurs", async () => {
    const context = setup();
    await importExport(context, [BP_BOULANGER, CQP_BOULANGER]);

    await importExport(context, [BP_BOULANGER]);

    expect(context.repository.certifications.has("RNCP42950")).toBe(true);
    expect(context.repository.listCertificateurs("RNCP42950")).toEqual([FEDERATION_BOULANGERIE]);
  });

  it("refuse un export vide sans rien écrire", async () => {
    const context = setup();
    await importExport(context, [BP_BOULANGER]);

    await expect(importExport(context, [])).rejects.toThrow(
      "France compétences a publié un export de certifications vide",
    );

    expect([...context.repository.certifications.keys()]).toEqual(["RNCP41937"]);
  });

  it("ne télécharge rien au démarrage quand une fiche est en base", async () => {
    const context = setup();
    await importExport(context, [BP_BOULANGER]);

    await context.service.syncCertificationsIfEmpty();

    expect(context.fetchCertifications).toHaveBeenCalledOnce();
  });

  it("remplit la base vide au démarrage", async () => {
    const context = setup();
    context.fetchCertifications.mockResolvedValueOnce({
      fileName: EXPORT_FILE_NAME,
      certifications: [BP_BOULANGER],
    });

    await context.service.syncCertificationsIfEmpty();

    expect([...context.repository.certifications.keys()]).toEqual(["RNCP41937"]);
  });
});

describe("CertificationService : recherche d'une certification", () => {
  async function setupWith(
    certifications: ImportedCertification[],
  ): Promise<ReturnType<typeof setup>> {
    const context = setup();
    await context.repository.saveCertifications(certifications);
    await context.repository.saveCertificateurs(certifications);

    return context;
  }

  it("trouve une fiche par ses mots, quels que soient l'ordre, les accents et la casse", async () => {
    const { service } = await setupWith([BP_BOULANGER, CQP_BOULANGER]);

    await expect(service.searchCertifications("  BOULANGER   bp ")).resolves.toEqual({
      certificationCount: 1,
      certifications: [
        {
          numeroFiche: "RNCP41937",
          repertoire: REPERTOIRE_CERTIFICATION.RNCP,
          intitule: "Boulanger",
          abrege: "BP",
          niveau: 4,
          certificateurs: [EDUCATION_NATIONALE],
        },
      ],
    });
  });

  it("trouve une fiche par son numéro, avec ou sans préfixe", async () => {
    const { service } = await setupWith([BP_BOULANGER, CQP_BOULANGER]);

    const withPrefix = await service.searchCertifications("RNCP 41937");
    const withoutPrefix = await service.searchCertifications("41937");

    expect(withPrefix.certifications.map(({ numeroFiche }) => numeroFiche)).toEqual(["RNCP41937"]);
    expect(withoutPrefix.certifications.map(({ numeroFiche }) => numeroFiche)).toEqual([
      "RNCP41937",
    ]);
  });

  it("distingue deux homonymes par le nom du certificateur", async () => {
    const { service } = await setupWith([BP_BOULANGER, CQP_BOULANGER]);

    const { certifications } = await service.searchCertifications("boulanger federation");

    expect(certifications.map(({ numeroFiche }) => numeroFiche)).toEqual(["RNCP42950"]);
  });

  it("place d'abord l'abrégé et l'intitulé qui commencent par le premier mot", async () => {
    const { service } = await setupWith([AIDE_BOULANGER, BP_BOULANGER, CQP_BOULANGER]);

    const { certifications } = await service.searchCertifications("aide boulanger");
    const { certifications: all } = await service.searchCertifications("boulanger");

    expect(certifications.map(({ numeroFiche }) => numeroFiche)).toEqual(["RNCP41648"]);
    expect(all.map(({ numeroFiche }) => numeroFiche)).toEqual([
      "RNCP41648",
      "RNCP41937",
      "RNCP42950",
    ]);
  });

  it("écarte une fiche inactive", async () => {
    const { service } = await setupWith([BP_BOULANGER, ANCIEN_BOULANGER]);

    const result = await service.searchCertifications("boulanger");

    expect(result.certificationCount).toBe(1);
    expect(result.certifications.map(({ numeroFiche }) => numeroFiche)).toEqual(["RNCP41937"]);
  });

  it("rend 20 fiches et le nombre de toutes celles trouvées", async () => {
    const { service } = await setupWith(
      Array.from({ length: 25 }, (_, index) => ({
        ...AIDE_BOULANGER,
        numeroFiche: `RNCP${String(50_000 + index)}`,
        intitule: `Soudeur ${String(index)}`,
      })),
    );

    const result = await service.searchCertifications("soudeur");

    expect(result.certificationCount).toBe(25);
    expect(result.certifications).toHaveLength(20);
  });

  it("ne trouve rien pour une saisie sans mot", async () => {
    const { service } = await setupWith([BP_BOULANGER]);

    await expect(service.searchCertifications("   ")).resolves.toEqual({
      certificationCount: 0,
      certifications: [],
    });
  });
});

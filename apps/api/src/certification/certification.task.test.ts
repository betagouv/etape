import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "../config/env.js";
import { FakeCertificationRepository } from "./certification.repository.fake.js";
import { CertificationService } from "./certification.service.js";
import { CertificationSyncTask } from "./certification.task.js";
import {
  REPERTOIRE_CERTIFICATION,
  STATUT_CERTIFICATION,
  type ImportedCertification,
} from "./certification.types.js";
import { FranceCompetencesClient } from "./france-competences.client.js";

const CERTIFICATIONS: ImportedCertification[] = [
  {
    numeroFiche: "RNCP41937",
    repertoire: REPERTOIRE_CERTIFICATION.RNCP,
    intitule: "Boulanger",
    abrege: "BP",
    niveau: 4,
    statut: STATUT_CERTIFICATION.ACTIVE,
    certificateurs: [],
  },
];

function setup() {
  const client = new FranceCompetencesClient(new ConfigService<Env, true>({}));
  const repository = new FakeCertificationRepository();

  return {
    repository,
    task: new CertificationSyncTask(new CertificationService(client, repository)),
    fetchCertifications: vi.spyOn(client, "fetchCertifications").mockResolvedValue(CERTIFICATIONS),
  };
}

describe("CertificationSyncTask", () => {
  const log = vi.spyOn(Logger.prototype, "log");
  const logError = vi.spyOn(Logger.prototype, "error");

  beforeEach(() => {
    log.mockImplementation(() => undefined);
    logError.mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockReset();
    logError.mockReset();
  });

  describe("au démarrage", () => {
    it("remplit la base quand rien n'y est", async () => {
      const { task, repository } = setup();

      task.onApplicationBootstrap();

      await vi.waitFor(() => {
        expect([...repository.certifications.keys()]).toEqual(["RNCP41937"]);
      });
    });

    it("ne télécharge rien quand une fiche est en base", async () => {
      const { task, repository, fetchCertifications } = setup();
      await repository.saveCertifications(CERTIFICATIONS);
      const hasCertification = vi.spyOn(repository, "hasCertification");

      task.onApplicationBootstrap();

      await vi.waitFor(() => {
        expect(hasCertification).toHaveResolved();
      });
      expect(fetchCertifications).not.toHaveBeenCalled();
    });

    it("journalise une erreur de data.gouv sans la lever", async () => {
      const { task, repository, fetchCertifications } = setup();
      fetchCertifications.mockRejectedValue(new Error("data.gouv a répondu 503"));

      expect(() => {
        task.onApplicationBootstrap();
      }).not.toThrow();

      await vi.waitFor(() => {
        expect(logError).toHaveBeenCalledExactlyOnceWith(
          "La synchronisation des certifications a échoué.",
          expect.stringContaining("data.gouv a répondu 503"),
        );
      });
      expect(repository.certifications.size).toBe(0);
    });
  });

  describe("chaque jour", () => {
    it("importe l'export même quand la base est remplie", async () => {
      const { task, repository, fetchCertifications } = setup();
      await repository.saveCertifications(CERTIFICATIONS);

      await task.syncDaily();

      expect(fetchCertifications).toHaveBeenCalledOnce();
    });

    it("journalise une erreur de data.gouv sans la lever", async () => {
      const { task, fetchCertifications } = setup();
      fetchCertifications.mockRejectedValue(new Error("data.gouv a répondu 503"));

      await expect(task.syncDaily()).resolves.toBeUndefined();

      expect(logError).toHaveBeenCalledOnce();
    });
  });

  describe("sans chevauchement", () => {
    it("ignore la tâche du jour pendant l'import du démarrage", async () => {
      const { task, repository, fetchCertifications } = setup();
      let publishExport: (certifications: ImportedCertification[]) => void = () => undefined;
      fetchCertifications.mockReturnValueOnce(
        new Promise((resolve) => {
          publishExport = resolve;
        }),
      );

      task.onApplicationBootstrap();
      await vi.waitFor(() => {
        expect(fetchCertifications).toHaveBeenCalledOnce();
      });

      await task.syncDaily();

      expect(fetchCertifications).toHaveBeenCalledOnce();
      expect(log).toHaveBeenCalledWith(
        "Synchronisation des certifications déjà en cours : appel ignoré.",
      );

      publishExport(CERTIFICATIONS);
      await vi.waitFor(() => {
        expect(repository.certifications.size).toBe(1);
      });
    });

    it("libère le verrou après une erreur", async () => {
      const { task, fetchCertifications } = setup();
      fetchCertifications.mockRejectedValueOnce(new Error("data.gouv a répondu 503"));

      await task.syncDaily();
      await task.syncDaily();

      expect(fetchCertifications).toHaveBeenCalledTimes(2);
    });
  });
});

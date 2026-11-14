import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "../config/env.js";
import { FranceTravailClient } from "./france-travail.client.js";
import { FakeMetierRomeRepository } from "./metier-rome.repository.fake.js";
import { MetierRomeService } from "./metier-rome.service.js";
import { MetierRomeSyncTask } from "./metier-rome.task.js";
import {
  CLASSIFICATION_APPELLATION_ROME,
  type MetierRome,
  type VersionRome,
} from "./metier-rome.types.js";

const VERSION: VersionRome = {
  version: "62",
  dateModification: new Date("2026-10-16T16:55:33.170Z"),
};

const METIERS: MetierRome[] = [
  {
    code: "D1102",
    libelle: "Boulanger / Boulangère",
    appellations: [
      {
        code: "11573",
        libelle: "Boulanger / Boulangère",
        libelleCourt: "Boulanger / Boulangère",
        classification: CLASSIFICATION_APPELLATION_ROME.PRINCIPALE,
      },
    ],
  },
];

function setup() {
  const client = new FranceTravailClient(new ConfigService<Env, true>({}));
  const repository = new FakeMetierRomeRepository();

  return {
    repository,
    task: new MetierRomeSyncTask(new MetierRomeService(client, repository)),
    fetchVersionRome: vi.spyOn(client, "fetchVersionRome").mockResolvedValue(VERSION),
    fetchMetiersRome: vi.spyOn(client, "fetchMetiersRome").mockResolvedValue(METIERS),
  };
}

describe("MetierRomeSyncTask", () => {
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
    it("remplit le référentiel quand rien n'est en base", async () => {
      const { task, repository } = setup();

      task.onApplicationBootstrap();

      await vi.waitFor(() => {
        expect(repository.versions).toEqual([VERSION]);
      });
      expect([...repository.metiers.keys()]).toEqual(["D1102"]);
    });

    it("ne contacte pas France Travail quand une version est en base", async () => {
      const { task, repository, fetchVersionRome } = setup();
      await repository.saveVersionRome(VERSION);
      const findCurrentVersionRome = vi.spyOn(repository, "findCurrentVersionRome");

      task.onApplicationBootstrap();

      await vi.waitFor(() => {
        expect(findCurrentVersionRome).toHaveResolved();
      });
      expect(fetchVersionRome).not.toHaveBeenCalled();
    });

    it("journalise une erreur de France Travail sans la lever", async () => {
      const { task, repository, fetchVersionRome } = setup();
      fetchVersionRome.mockRejectedValue(new Error("France Travail a répondu 503"));

      expect(() => {
        task.onApplicationBootstrap();
      }).not.toThrow();

      await vi.waitFor(() => {
        expect(logError).toHaveBeenCalledExactlyOnceWith(
          "La synchronisation du référentiel ROME a échoué.",
          expect.stringContaining("France Travail a répondu 503"),
        );
      });
      expect(repository.versions).toEqual([]);
    });
  });

  describe("chaque jour", () => {
    it("importe la version publiée quand elle a changé", async () => {
      const { task, repository } = setup();
      await repository.saveVersionRome({ ...VERSION, version: "61" });

      await task.syncDaily();

      expect(repository.versions.at(-1)).toEqual(VERSION);
      expect([...repository.metiers.keys()]).toEqual(["D1102"]);
    });

    it("ne télécharge rien quand la version n'a pas changé", async () => {
      const { task, repository, fetchMetiersRome } = setup();
      await repository.saveVersionRome(VERSION);

      await task.syncDaily();

      expect(fetchMetiersRome).not.toHaveBeenCalled();
    });

    it("journalise une erreur de France Travail sans la lever", async () => {
      const { task, fetchVersionRome } = setup();
      fetchVersionRome.mockRejectedValue(new Error("France Travail a répondu 503"));

      await expect(task.syncDaily()).resolves.toBeUndefined();

      expect(logError).toHaveBeenCalledOnce();
    });

    it("rattrape un premier remplissage raté", async () => {
      const { task, repository, fetchVersionRome } = setup();
      fetchVersionRome.mockRejectedValueOnce(new Error("France Travail a répondu 503"));

      task.onApplicationBootstrap();
      await vi.waitFor(() => {
        expect(logError).toHaveBeenCalledOnce();
      });
      expect(repository.versions).toEqual([]);

      await task.syncDaily();

      expect(repository.versions).toEqual([VERSION]);
    });
  });

  describe("sans chevauchement", () => {
    it("ignore la tâche du jour pendant l'import du démarrage", async () => {
      const { task, repository, fetchVersionRome } = setup();
      let publishVersion: (version: VersionRome) => void = () => undefined;
      fetchVersionRome.mockReturnValueOnce(
        new Promise((resolve) => {
          publishVersion = resolve;
        }),
      );

      task.onApplicationBootstrap();
      await vi.waitFor(() => {
        expect(fetchVersionRome).toHaveBeenCalledOnce();
      });

      await task.syncDaily();

      expect(fetchVersionRome).toHaveBeenCalledOnce();
      expect(log).toHaveBeenCalledWith(
        "Synchronisation du référentiel ROME déjà en cours : appel ignoré.",
      );

      publishVersion(VERSION);
      await vi.waitFor(() => {
        expect(repository.versions).toEqual([VERSION]);
      });
    });

    it("libère le verrou après une erreur", async () => {
      const { task, fetchVersionRome } = setup();
      fetchVersionRome.mockRejectedValueOnce(new Error("France Travail a répondu 503"));

      await task.syncDaily();
      await task.syncDaily();

      expect(fetchVersionRome).toHaveBeenCalledTimes(2);
    });
  });
});

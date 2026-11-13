import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "../config/env.js";
import { FranceTravailClient } from "./france-travail.client.js";
import { FakeMetierRomeRepository } from "./metier-rome.repository.fake.js";
import { MetierRomeService } from "./metier-rome.service.js";
import {
  CLASSIFICATION_APPELLATION_ROME,
  type AppellationRome,
  type MetierRome,
  type VersionRome,
} from "./metier-rome.types.js";

const VERSION_62: VersionRome = {
  version: "62",
  dateModification: new Date("2026-10-16T16:55:33.170Z"),
};

const VERSION_63: VersionRome = {
  version: "63",
  dateModification: new Date("2026-11-20T09:00:00.000Z"),
};

const VIENNOISIER: AppellationRome = {
  code: "38444",
  libelle: "Boulanger-viennoisier / Boulangère-viennoisière",
  libelleCourt: "Boulanger-viennoisier / Boulangère-viennoisière",
  classification: CLASSIFICATION_APPELLATION_ROME.SYNONYME,
};

const BOULANGER: MetierRome = {
  code: "D1102",
  libelle: "Boulanger / Boulangère",
  appellations: [
    {
      code: "11573",
      libelle: "Boulanger / Boulangère",
      libelleCourt: "Boulanger / Boulangère",
      classification: CLASSIFICATION_APPELLATION_ROME.PRINCIPALE,
    },
    VIENNOISIER,
  ],
};

const PATISSIER: MetierRome = {
  code: "D1104",
  libelle: "Pâtissier / Pâtissière",
  appellations: [
    {
      code: "17551",
      libelle: "Pâtissier / Pâtissière",
      libelleCourt: "Pâtissier / Pâtissière",
      classification: CLASSIFICATION_APPELLATION_ROME.PRINCIPALE,
    },
  ],
};

function setup() {
  const client = new FranceTravailClient(new ConfigService<Env, true>({}));
  const repository = new FakeMetierRomeRepository();

  return {
    repository,
    service: new MetierRomeService(client, repository),
    fetchVersionRome: vi.spyOn(client, "fetchVersionRome"),
    fetchMetiersRome: vi.spyOn(client, "fetchMetiersRome"),
  };
}

async function importVersion(
  { service, fetchVersionRome, fetchMetiersRome }: ReturnType<typeof setup>,
  version: VersionRome,
  metiers: MetierRome[],
): Promise<void> {
  fetchVersionRome.mockResolvedValueOnce(version);
  fetchMetiersRome.mockResolvedValueOnce(metiers);
  await service.syncMetiersRome();
}

describe("MetierRomeService", () => {
  const log = vi.spyOn(Logger.prototype, "log");

  beforeEach(() => {
    log.mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockReset();
  });

  it("importe le référentiel quand rien n'est en base", async () => {
    const context = setup();

    await importVersion(context, VERSION_62, [BOULANGER, PATISSIER]);

    expect([...context.repository.metiers.keys()]).toEqual(["D1102", "D1104"]);
    expect(context.repository.appellations.get("38444")).toEqual({
      codeMetier: "D1102",
      libelle: VIENNOISIER.libelle,
      libelleCourt: VIENNOISIER.libelleCourt,
      classification: CLASSIFICATION_APPELLATION_ROME.SYNONYME,
      isObsolete: false,
    });
    expect(context.repository.versions).toEqual([VERSION_62]);
  });

  it("ne journalise que la version et les deux compteurs", async () => {
    const context = setup();

    await importVersion(context, VERSION_62, [BOULANGER, PATISSIER]);

    expect(log).toHaveBeenCalledExactlyOnceWith(
      "ROME version 62 importé : 2 métiers, 3 appellations.",
    );
  });

  it("ne télécharge rien quand la version est déjà celle en base", async () => {
    const context = setup();
    await importVersion(context, VERSION_62, [BOULANGER]);

    context.fetchVersionRome.mockResolvedValueOnce(VERSION_62);
    await context.service.syncMetiersRome();

    expect(context.fetchMetiersRome).toHaveBeenCalledTimes(1);
    expect(context.repository.versions).toEqual([VERSION_62]);
  });

  it("marque obsolètes le métier et les appellations absents de la nouvelle version", async () => {
    const context = setup();
    await importVersion(context, VERSION_62, [BOULANGER, PATISSIER]);

    await importVersion(context, VERSION_63, [{ ...BOULANGER, appellations: [VIENNOISIER] }]);

    expect(context.repository.metiers.get("D1104")?.isObsolete).toBe(true);
    expect(context.repository.appellations.get("17551")?.isObsolete).toBe(true);
    expect(context.repository.appellations.get("11573")?.isObsolete).toBe(true);
    expect(context.repository.metiers.get("D1102")?.isObsolete).toBe(false);
    expect(context.repository.appellations.get("38444")?.isObsolete).toBe(false);
    expect(context.repository.versions.at(-1)).toEqual(VERSION_63);
  });

  it("retire la marque d'un métier qui revient", async () => {
    const context = setup();
    await importVersion(context, VERSION_62, [BOULANGER, PATISSIER]);
    await importVersion(context, VERSION_63, [BOULANGER]);

    await importVersion(context, { ...VERSION_63, version: "64" }, [BOULANGER, PATISSIER]);

    expect(context.repository.metiers.get("D1104")?.isObsolete).toBe(false);
    expect(context.repository.appellations.get("17551")?.isObsolete).toBe(false);
  });

  it("reprend un libellé modifié et une appellation passée à un autre métier", async () => {
    const context = setup();
    await importVersion(context, VERSION_62, [BOULANGER, PATISSIER]);

    await importVersion(context, VERSION_63, [
      { ...BOULANGER, libelle: "Boulanger", appellations: [BOULANGER.appellations[0]] },
      { ...PATISSIER, appellations: [...PATISSIER.appellations, VIENNOISIER] },
    ]);

    expect(context.repository.metiers.get("D1102")?.libelle).toBe("Boulanger");
    expect(context.repository.appellations.get("38444")?.codeMetier).toBe("D1104");
    expect(context.repository.appellations.get("38444")?.isObsolete).toBe(false);
  });

  it("réimporte une version déjà importée autrefois", async () => {
    const context = setup();
    await importVersion(context, VERSION_62, [BOULANGER, PATISSIER]);
    await importVersion(context, VERSION_63, [BOULANGER]);

    await importVersion(context, VERSION_62, [BOULANGER, PATISSIER]);

    expect(context.repository.versions).toEqual([VERSION_63, VERSION_62]);
    expect(context.repository.metiers.get("D1104")?.isObsolete).toBe(false);
  });

  it("refuse un référentiel vide sans rien écrire", async () => {
    const context = setup();
    await importVersion(context, VERSION_62, [BOULANGER]);

    await expect(importVersion(context, VERSION_63, [])).rejects.toThrow(
      "France Travail a renvoyé un référentiel ROME vide",
    );

    expect(context.repository.metiers.get("D1102")?.isObsolete).toBe(false);
    expect(context.repository.versions).toEqual([VERSION_62]);
  });

  it("n'écrit rien quand France Travail ne répond pas", async () => {
    const context = setup();
    context.fetchVersionRome.mockRejectedValueOnce(new Error("France Travail a répondu 503"));

    await expect(context.service.syncMetiersRome()).rejects.toThrow("France Travail a répondu 503");

    expect(context.fetchMetiersRome).not.toHaveBeenCalled();
    expect(context.repository.metiers.size).toBe(0);
    expect(context.repository.versions).toEqual([]);
  });
});

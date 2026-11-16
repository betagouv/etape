import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "../config/env.js";
import { FranceTravailClient } from "./france-travail.client.js";
import { FakeMetierRomeRepository } from "./metier-rome.repository.fake.js";
import { MetierRomeService } from "./metier-rome.service.js";
import {
  CLASSIFICATION_APPELLATION_ROME,
  type ImportedAppellationRome,
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

const VIENNOISIER: ImportedAppellationRome = {
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

describe("MetierRomeService : recherche d'une appellation", () => {
  const AIDE_PATISSIER: ImportedAppellationRome = {
    code: "10885",
    libelle: "Aide-pâtissier / Aide-pâtissière",
    libelleCourt: "Aide-pâtissier / Aide-pâtissière",
    classification: CLASSIFICATION_APPELLATION_ROME.SYNONYME,
  };

  async function setupWith(metiers: MetierRome[]): Promise<ReturnType<typeof setup>> {
    const context = setup();
    await context.repository.saveMetiersRome(metiers);

    return context;
  }

  it("trouve une appellation par ses mots, quels que soient l'ordre, les accents et la casse", async () => {
    const { service } = await setupWith([BOULANGER, PATISSIER]);

    await expect(service.searchAppellationsRome("  VIENNOISIERE   boulanger ")).resolves.toEqual({
      appellationRomeCount: 1,
      appellationsRome: [
        {
          code: "38444",
          libelle: VIENNOISIER.libelle,
          metierRome: { code: "D1102", libelle: BOULANGER.libelle },
        },
      ],
    });
  });

  it("ne garde que les appellations qui contiennent tous les mots", async () => {
    const { service } = await setupWith([BOULANGER, PATISSIER]);

    const { appellationsRome } = await service.searchAppellationsRome("boulanger patissier");

    expect(appellationsRome).toEqual([]);
  });

  it("place d'abord les libellés qui commencent par le premier mot", async () => {
    const { service } = await setupWith([
      { ...PATISSIER, appellations: [AIDE_PATISSIER, ...PATISSIER.appellations] },
    ]);

    const { appellationsRome } = await service.searchAppellationsRome("patissier");

    expect(appellationsRome.map(({ code }) => code)).toEqual(["17551", "10885"]);
  });

  it("écarte une appellation obsolète", async () => {
    const context = await setupWith([BOULANGER]);
    await context.repository.markAppellationsRomeObsoleteExcept(["11573"]);

    const result = await context.service.searchAppellationsRome("boulanger");

    expect(result.appellationRomeCount).toBe(1);
    expect(result.appellationsRome.map(({ code }) => code)).toEqual(["11573"]);
  });

  it("rend 20 appellations et le nombre de toutes celles trouvées", async () => {
    const { service } = await setupWith([
      {
        code: "H2913",
        libelle: "Soudeur / Soudeuse",
        appellations: Array.from({ length: 25 }, (_, index) => ({
          code: String(20_000 + index),
          libelle: `Soudeur / Soudeuse ${index}`,
          libelleCourt: `Soudeur(se) ${index}`,
          classification: CLASSIFICATION_APPELLATION_ROME.SYNONYME,
        })),
      },
    ]);

    const result = await service.searchAppellationsRome("soudeur");

    expect(result.appellationRomeCount).toBe(25);
    expect(result.appellationsRome).toHaveLength(20);
  });

  it("ne trouve rien pour une saisie sans mot", async () => {
    const { service } = await setupWith([BOULANGER]);

    await expect(service.searchAppellationsRome("   ")).resolves.toEqual({
      appellationRomeCount: 0,
      appellationsRome: [],
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { informationsSchema } from "./schema";

const CLE_MISMATCH =
  "La clé ne correspond pas au numéro : vérifiez les 2 derniers chiffres de votre carte Vitale.";

function findCleNirMessages(data: Record<string, string | undefined>): string[] {
  const issues = informationsSchema.safeParse(data).error?.issues ?? [];
  return issues.filter((issue) => issue.path[0] === "cleNir").map((issue) => issue.message);
}

function findDateNaissanceMessages(data: Record<string, string | undefined>): string[] {
  const issues = informationsSchema.safeParse(data).error?.issues ?? [];
  return issues.filter((issue) => issue.path[0] === "dateNaissance").map((issue) => issue.message);
}

const VALIDES = {
  civilite: "madame",
  dateNaissance: "15/01/1990",
  nationalite: "fr",
  nir: "1 85 05 78 006 084",
  cleNir: "91",
  telephone: "06 12 34 56 78",
};

describe("informationsSchema, clé du NIR", () => {
  it("accepte la clé qui correspond au NIR", () => {
    expect(findCleNirMessages(VALIDES)).toEqual([]);
  });

  it("refuse une clé qui ne correspond pas au NIR, même quand la civilité est vide", () => {
    expect(findCleNirMessages({ ...VALIDES, cleNir: "12" })).toEqual([CLE_MISMATCH]);
    expect(findCleNirMessages({ ...VALIDES, cleNir: "12", civilite: "" })).toEqual([CLE_MISMATCH]);
  });

  it("ne compare pas la clé à un NIR incomplet", () => {
    expect(findCleNirMessages({ ...VALIDES, nir: "1 85", cleNir: "12" })).toEqual([]);
  });
});

describe("informationsSchema, date de naissance", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 10, 11, 15) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepte 18 ans et 70 ans le jour même", () => {
    expect(findDateNaissanceMessages({ ...VALIDES, dateNaissance: "11/11/2008" })).toEqual([]);
    expect(findDateNaissanceMessages({ ...VALIDES, dateNaissance: "11/11/1956" })).toEqual([]);
  });

  it("refuse une naissance trop récente", () => {
    expect(findDateNaissanceMessages({ ...VALIDES, dateNaissance: "12/11/2008" })).toEqual([
      "Vous devez avoir au moins 18 ans.",
    ]);
  });

  it("refuse une naissance trop ancienne", () => {
    expect(findDateNaissanceMessages({ ...VALIDES, dateNaissance: "10/11/1956" })).toEqual([
      "Vous devez avoir moins de 70 ans.",
    ]);
  });
});

describe("informationsSchema, civilité", () => {
  it("demande la civilité quand elle n'est pas choisie", () => {
    const issues =
      informationsSchema.safeParse({ ...VALIDES, civilite: undefined }).error?.issues ?? [];
    expect(
      issues.filter((issue) => issue.path[0] === "civilite").map((issue) => issue.message),
    ).toEqual(["Veuillez indiquer votre civilité."]);
  });
});

import { describe, expect, it } from "vitest";

import { STATUT_DOSSIER } from "../dossier/dossier.enum.js";
import { HABILITATION_TYPE } from "../habilitation/habilitation.enum.js";
import type { Actor, CibleDossier, CibleRegion } from "./authorization.types.js";
import { PORTEE } from "./portee.enum.js";
import { hasHabilitationInRegion, matchesPortee, matchesStatuts } from "./portee.js";

const cibleDossier: CibleDossier = {
  type: "dossier",
  dossierId: "d1",
  regionId: "93",
  beneficiaireId: "alice",
  statut: STATUT_DOSSIER.SOUMIS,
  membreCommissionIds: ["marc"],
};
const cibleRegion: CibleRegion = { type: "region", regionId: "93" };

const alice: Actor = { accountId: "alice", habilitations: [] };
const marc: Actor = {
  accountId: "marc",
  habilitations: [{ type: HABILITATION_TYPE.MEMBRE_COMMISSION, accountId: "marc", regionId: "93" }],
};
const paul: Actor = {
  accountId: "paul",
  habilitations: [
    { type: HABILITATION_TYPE.INSTRUCTEUR, accountId: "paul", regionId: "75" },
    { type: HABILITATION_TYPE.ADMIN, accountId: "paul", regionId: "93" },
  ],
};
const sam: Actor = {
  accountId: "sam",
  habilitations: [{ type: HABILITATION_TYPE.SUPER_ADMIN, accountId: "sam" }],
};

describe("matchesPortee", () => {
  it("PROPRIETAIRE : le bénéficiaire du dossier, et lui seul", () => {
    const regle = { portee: PORTEE.PROPRIETAIRE } as const;
    expect(matchesPortee(regle, alice, cibleDossier)).toBe(true);
    expect(matchesPortee(regle, marc, cibleDossier)).toBe(false);
  });

  it("PROPRIETAIRE : jamais sur une région", () => {
    expect(matchesPortee({ portee: PORTEE.PROPRIETAIRE }, alice, cibleRegion)).toBe(false);
  });

  it("REGION : le rôle ET la région sur la même habilitation", () => {
    const instructeur = { portee: PORTEE.REGION, role: HABILITATION_TYPE.INSTRUCTEUR } as const;
    const admin = { portee: PORTEE.REGION, role: HABILITATION_TYPE.ADMIN } as const;
    expect(matchesPortee(instructeur, paul, cibleDossier)).toBe(false);
    expect(matchesPortee(admin, paul, cibleDossier)).toBe(true);
    expect(matchesPortee(admin, paul, cibleRegion)).toBe(true);
  });

  it("COMMISSION : habilité dans la région ET membre de la commission du dossier", () => {
    const regle = { portee: PORTEE.COMMISSION, role: HABILITATION_TYPE.MEMBRE_COMMISSION } as const;
    expect(matchesPortee(regle, marc, cibleDossier)).toBe(true);
    expect(matchesPortee(regle, marc, { ...cibleDossier, membreCommissionIds: [] })).toBe(false);
    expect(matchesPortee(regle, marc, { ...cibleDossier, regionId: "75" })).toBe(false);
    expect(matchesPortee(regle, marc, cibleRegion)).toBe(false);
  });

  it("NATIONAL : le super admin, quelle que soit la région", () => {
    const regle = { portee: PORTEE.NATIONAL, role: HABILITATION_TYPE.SUPER_ADMIN } as const;
    expect(matchesPortee(regle, sam, { type: "region", regionId: "976" })).toBe(true);
    expect(matchesPortee(regle, paul, cibleRegion)).toBe(false);
  });
});

describe("matchesStatuts", () => {
  it("une règle sans statut vaut pour tous", () => {
    expect(matchesStatuts({ portee: PORTEE.PROPRIETAIRE }, cibleDossier)).toBe(true);
  });

  it("une règle avec statuts ne vaut que pour eux", () => {
    const regle = { portee: PORTEE.PROPRIETAIRE, statuts: [STATUT_DOSSIER.BROUILLON] } as const;
    expect(matchesStatuts(regle, cibleDossier)).toBe(false);
    expect(matchesStatuts(regle, { ...cibleDossier, statut: STATUT_DOSSIER.BROUILLON })).toBe(true);
  });
});

describe("hasHabilitationInRegion", () => {
  it("ne prête jamais de région au super admin", () => {
    expect(hasHabilitationInRegion(sam, HABILITATION_TYPE.ADMIN, "93")).toBe(false);
  });
});

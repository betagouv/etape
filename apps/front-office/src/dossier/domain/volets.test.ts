import { describe, expect, it } from "vitest";

import { VOLET_ID } from "./volet-id";
import { findVoletPosition, isVoletId } from "./volets";
import { VOLETS_DOSSIER } from "./volets-dossier";

describe("isVoletId", () => {
  it("reconnaît l'identifiant d'un volet", () => {
    expect(isVoletId(VOLET_ID.FUTUR_METIER)).toBe(true);
  });

  it("refuse un segment d'adresse qui n'est pas un volet", () => {
    expect(isVoletId("inconnu")).toBe(false);
  });
});

describe("findVoletPosition", () => {
  it("situe un volet entre ses deux voisins", () => {
    const position = findVoletPosition(VOLETS_DOSSIER, VOLET_ID.SITUATION_PROFESSIONNELLE);

    expect(position?.index).toBe(1);
    expect(position?.current.id).toBe(VOLET_ID.SITUATION_PROFESSIONNELLE);
    expect(position?.previous?.id).toBe(VOLET_ID.INFORMATIONS);
    expect(position?.next?.id).toBe(VOLET_ID.FUTUR_METIER);
  });

  it("n'a pas de volet précédent au premier volet", () => {
    const position = findVoletPosition(VOLETS_DOSSIER, VOLET_ID.INFORMATIONS);

    expect(position?.index).toBe(0);
    expect(position?.previous).toBeUndefined();
    expect(position?.next?.id).toBe(VOLET_ID.SITUATION_PROFESSIONNELLE);
  });

  it("n'a pas de volet suivant au dernier volet", () => {
    const position = findVoletPosition(VOLETS_DOSSIER, VOLET_ID.DOCUMENTS);

    expect(position?.previous?.id).toBe(VOLET_ID.CEP);
    expect(position?.next).toBeUndefined();
  });

  it("ne situe pas un volet que le dossier ne compte pas", () => {
    const voletsSansCep = VOLETS_DOSSIER.filter((volet) => volet.id !== VOLET_ID.CEP);

    expect(findVoletPosition(voletsSansCep, VOLET_ID.CEP)).toBeNull();
  });
});

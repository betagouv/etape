import { describe, expect, it } from "vitest";

import { formatFieldErrorAnnouncement } from "./field-error-announcement";

const LABELS = { nir: "Numéro de sécurité sociale" };

describe("formatFieldErrorAnnouncement", () => {
  it("annonce le libellé et le message du champ quitté", () => {
    const errors = { nir: { message: "Saisissez les 13 premiers chiffres." } };
    expect(formatFieldErrorAnnouncement("nir", errors, LABELS)).toBe(
      "Numéro de sécurité sociale : Saisissez les 13 premiers chiffres.",
    );
  });

  it("n'annonce rien quand le champ quitté est valide ou que son erreur n'a pas de message", () => {
    expect(formatFieldErrorAnnouncement("nir", {}, LABELS)).toBe("");
    expect(formatFieldErrorAnnouncement("nir", { nir: {} }, LABELS)).toBe("");
  });

  it("annonce l'erreur d'un champ imbriqué, lue par son chemin", () => {
    const errors = { currentDemarche: { typeDemarche: { message: "Choisissez un type." } } };
    const labels = { "currentDemarche.typeDemarche": "Type de démarche" };

    expect(formatFieldErrorAnnouncement("currentDemarche.typeDemarche", errors, labels)).toBe(
      "Type de démarche : Choisissez un type.",
    );
    expect(formatFieldErrorAnnouncement("currentDemarche.apportDemarche", errors, labels)).toBe("");
  });

  it("ignore les erreurs des autres champs", () => {
    const errors = { cleNir: { message: "Saisissez les 2 derniers chiffres." } };
    expect(formatFieldErrorAnnouncement("nir", errors, LABELS)).toBe("");
  });
});

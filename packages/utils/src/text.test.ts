import { describe, expect, it } from "vitest";

import { normalizeForSearch, stripDiacritics } from "./text";

describe("stripDiacritics", () => {
  it("retire accents et cédille d'une saisie composée (NFC)", () => {
    expect(stripDiacritics("Créteil, Besançon, Nîmes")).toBe("Creteil, Besancon, Nimes");
  });

  it("donne le même résultat pour une saisie décomposée (NFD)", () => {
    expect(stripDiacritics("Créteil")).toBe(stripDiacritics("Créteil"));
  });

  it("laisse intacts casse, chiffres et ponctuation", () => {
    expect(stripDiacritics("10.71C - L'Haÿ-les-Roses")).toBe("10.71C - L'Hay-les-Roses");
  });
});

describe("normalizeForSearch", () => {
  it("retire les accents et la casse, garde la ponctuation", () => {
    expect(normalizeForSearch("Côte d'Azur")).toBe("cote d'azur");
  });

  it("donne le même résultat pour une saisie décomposée (NFD)", () => {
    expect(normalizeForSearch("CO\u0302TE")).toBe("cote");
  });

  it("remplace les ligatures et l'apostrophe typographique", () => {
    expect(normalizeForSearch("Gros Œuvre, cœur, Ærium, d’agrumes")).toBe(
      "gros oeuvre, coeur, aerium, d'agrumes",
    );
  });
});

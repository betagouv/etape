import { describe, expect, it } from "vitest";

import { readFieldPath, splitFieldPath } from "./field-path";

describe("splitFieldPath", () => {
  it("rend le nom d'un champ du premier niveau tel quel", () => {
    expect(splitFieldPath("civilite")).toEqual(["civilite"]);
  });

  it("découpe le chemin d'un champ imbriqué, du premier niveau au champ", () => {
    expect(splitFieldPath("currentDemarche.typeDemarche")).toEqual([
      "currentDemarche",
      "typeDemarche",
    ]);
  });
});

describe("readFieldPath", () => {
  const values = { civilite: "madame", currentDemarche: { typeDemarche: "salon", apport: "" } };

  it("lit un champ du premier niveau", () => {
    expect(readFieldPath(values, "civilite")).toBe("madame");
  });

  it("lit un champ imbriqué, y compris vide", () => {
    expect(readFieldPath(values, "currentDemarche.typeDemarche")).toBe("salon");
    expect(readFieldPath(values, "currentDemarche.apport")).toBe("");
  });

  it("ne rend rien quand un segment manque, ou ne porte pas d'objet", () => {
    expect(readFieldPath(values, "telephone")).toBeUndefined();
    expect(readFieldPath(values, "currentDemarche.precision")).toBeUndefined();
    expect(readFieldPath(values, "civilite.longueur")).toBeUndefined();
    expect(
      readFieldPath({ currentDemarche: null }, "currentDemarche.typeDemarche"),
    ).toBeUndefined();
    expect(readFieldPath(undefined, "civilite")).toBeUndefined();
  });
});

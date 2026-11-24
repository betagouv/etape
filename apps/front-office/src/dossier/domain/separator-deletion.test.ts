import { describe, expect, it } from "vitest";

import { isSiretDigit } from "../situation-professionnelle/domain/format-siret";
import { deleteAcrossSeparator, DELETION_DIRECTION } from "./separator-deletion";

describe("deleteAcrossSeparator", () => {
  // « 503| 932 » : Suppr a retiré l'espace, la saisie est « 503|932 ».
  it("efface le chiffre qui suit le séparateur, sans déplacer le curseur", () => {
    expect(deleteAcrossSeparator("503932", 3, DELETION_DIRECTION.FORWARD, isSiretDigit)).toEqual({
      value: "50332",
      caret: 3,
    });
  });

  // « 503 |932 » : Retour arrière a retiré l'espace, la saisie est « 503|932 ».
  it("efface le chiffre qui précède le séparateur, et recule le curseur derrière lui", () => {
    expect(deleteAcrossSeparator("503932", 3, DELETION_DIRECTION.BACKWARD, isSiretDigit)).toEqual({
      value: "50932",
      caret: 2,
    });
  });

  it("saute les caractères qui ne comptent pas pour trouver le voisin", () => {
    expect(deleteAcrossSeparator("503 - 932", 3, DELETION_DIRECTION.FORWARD, isSiretDigit)).toEqual(
      { value: "503 - 32", caret: 3 },
    );
    expect(
      deleteAcrossSeparator("503 - 932", 6, DELETION_DIRECTION.BACKWARD, isSiretDigit),
    ).toEqual({ value: "50 - 932", caret: 2 });
  });

  it("ne change rien quand aucun caractère utile ne se trouve de ce côté", () => {
    expect(deleteAcrossSeparator("503", 3, DELETION_DIRECTION.FORWARD, isSiretDigit)).toEqual({
      value: "503",
      caret: 3,
    });
    expect(deleteAcrossSeparator("503", 0, DELETION_DIRECTION.BACKWARD, isSiretDigit)).toEqual({
      value: "503",
      caret: 0,
    });
  });
});

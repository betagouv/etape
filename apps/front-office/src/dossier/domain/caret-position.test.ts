import { describe, expect, it } from "vitest";

import { findCaretAfterFormat } from "./caret-position";
import { formatSiret, isSiretDigit } from "../situation-professionnelle/domain/format-siret";

function caretAfterSiretFormat(raw: string, caret: number): number {
  return findCaretAfterFormat(raw, caret, formatSiret(raw), isSiretDigit);
}

describe("findCaretAfterFormat", () => {
  it("garde le curseur derrière le chiffre tapé au milieu, malgré les espaces décalés", () => {
    // « 503 932 » : un « 1 » tapé après le « 5 » donne « 5103 932 », mis en forme en « 510 393 2 ».
    expect(caretAfterSiretFormat("5103 932", 2)).toBe(2);
    // Après le 4e chiffre, une espace s'intercale : le curseur la saute.
    expect(caretAfterSiretFormat("5039 932", 4)).toBe(5);
  });

  it("place le curseur derrière le chiffre qui ouvre un groupe, en fin de saisie", () => {
    expect(caretAfterSiretFormat("5039", 4)).toBe(5);
  });

  it("ne compte pas un caractère retiré par la mise en forme", () => {
    // Une lettre tapée après « 503 » disparaît : le curseur reste derrière le « 3 ».
    expect(caretAfterSiretFormat("503a 932", 4)).toBe(3);
  });

  it("garde le curseur en tête quand rien d'utile ne le précède", () => {
    expect(caretAfterSiretFormat(" 503", 1)).toBe(0);
  });

  it("met le curseur en fin de champ quand la saisie est tronquée avant lui", () => {
    expect(caretAfterSiretFormat("5039325680001099", 16)).toBe(17);
  });
});

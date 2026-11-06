import { describe, expect, it } from "vitest";

import { findFirstMissingField, MANUAL_FIELD_ID } from "./use-manual-adresse";

const FIELDS = {
  numeroVoie: "",
  typeVoie: "Rue",
  nomVoie: "Victor Hugo",
  complement: "",
  codePostal: "33124",
};
const COMMUNES = [{ nom: "Aillas", code: "33002" }];

describe("findFirstMissingField", () => {
  it("suit l'ordre du formulaire, sans exiger le numéro", () => {
    expect(findFirstMissingField({ ...FIELDS, typeVoie: " " }, COMMUNES, false)).toBe(
      MANUAL_FIELD_ID.TYPE_VOIE,
    );
    expect(findFirstMissingField({ ...FIELDS, nomVoie: "" }, COMMUNES, false)).toBe(
      MANUAL_FIELD_ID.NOM_VOIE,
    );
    expect(findFirstMissingField({ ...FIELDS, codePostal: "331" }, [], false)).toBe(
      MANUAL_FIELD_ID.CODE_POSTAL,
    );
    expect(findFirstMissingField(FIELDS, COMMUNES, false)).toBe(MANUAL_FIELD_ID.COMMUNE);
  });

  it("renvoie au code postal quand il ne correspond à aucune commune", () => {
    expect(findFirstMissingField(FIELDS, [], false)).toBe(MANUAL_FIELD_ID.CODE_POSTAL);
  });

  it("ne signale rien quand tout est rempli", () => {
    expect(findFirstMissingField(FIELDS, COMMUNES, true)).toBeUndefined();
  });
});

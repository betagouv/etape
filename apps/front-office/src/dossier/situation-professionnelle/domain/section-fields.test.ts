import { describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../../domain/entry-mode";
import { OUI_NON } from "../../domain/oui-non";
import { findSectionFields } from "./section-fields";

describe("findSectionFields", () => {
  it("exige l'employeur choisi et le poste en recherche", () => {
    expect(findSectionFields({ employeurEntryMode: ENTRY_MODE.SEARCH })).toEqual({
      emploi: ["employeur", "intitulePoste"],
      demission: ["demission"],
    });
  });

  it("exige les quatre champs de l'employeur, le poste et la date après un « oui »", () => {
    expect(
      findSectionFields({ employeurEntryMode: ENTRY_MODE.MANUAL, demission: OUI_NON.OUI }),
    ).toEqual({
      emploi: ["denomination", "siret", "secteurActivite", "adresse", "intitulePoste"],
      demission: ["demission", "dateDemission"],
    });
  });

  it("n'exige pas la date de démission après un « non »", () => {
    const fields = findSectionFields({
      employeurEntryMode: ENTRY_MODE.SEARCH,
      demission: OUI_NON.NON,
    });
    expect(fields.demission).toEqual(["demission"]);
  });
});

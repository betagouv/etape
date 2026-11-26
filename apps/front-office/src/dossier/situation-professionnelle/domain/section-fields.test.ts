import { describe, expect, it } from "vitest";

import { ENTRY_MODE } from "../../domain/entry-mode";
import { OUI_NON } from "../../domain/oui-non";
import { findSectionFields } from "./section-fields";

describe("findSectionFields", () => {
  it("exige l'employeur choisi et le poste en recherche", () => {
    expect(findSectionFields(ENTRY_MODE.SEARCH, undefined)).toEqual({
      emploi: ["employeur", "intitulePoste"],
      demission: ["demission"],
    });
  });

  it("exige les quatre champs de l'employeur, le poste et la date après un « oui »", () => {
    expect(findSectionFields(ENTRY_MODE.MANUAL, OUI_NON.OUI)).toEqual({
      emploi: ["denomination", "siret", "secteurActivite", "adresse", "intitulePoste"],
      demission: ["demission", "dateDemission"],
    });
  });
});

import { describe, expect, it } from "vitest";

import { OUI_NON } from "../../domain/oui-non";
import { EMPLOYEUR_ENTRY_MODE } from "../schema";
import { findSectionFields } from "./section-fields";

describe("findSectionFields", () => {
  it("exige l'employeur choisi et le poste en recherche", () => {
    expect(findSectionFields(EMPLOYEUR_ENTRY_MODE.SEARCH, undefined)).toEqual({
      emploi: ["employeur", "intitulePoste"],
      demission: ["demission"],
    });
  });

  it("exige les quatre champs de l'employeur, le poste et la date après un « oui »", () => {
    expect(findSectionFields(EMPLOYEUR_ENTRY_MODE.MANUAL, OUI_NON.OUI)).toEqual({
      emploi: ["denomination", "siret", "secteurActivite", "adresse", "intitulePoste"],
      demission: ["demission", "dateDemission"],
    });
  });
});

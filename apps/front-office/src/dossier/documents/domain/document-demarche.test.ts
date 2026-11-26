import { describe, expect, it } from "vitest";

import { TYPE_DEMARCHE_AUTRE, type Demarche } from "../../domain/demarche";
import { OUI_NON } from "../../domain/oui-non";
import {
  DEMARCHES_DISPLAY,
  findDemarchesDisplay,
  formatEmptyDemarchesHint,
  listDocumentsDemarches,
} from "./document-demarche";

const TYPE = { SALON: "salon", AUTRE: TYPE_DEMARCHE_AUTRE } as const;

type Type = (typeof TYPE)[keyof typeof TYPE];

const TEXTS = {
  typeLabels: { [TYPE.SALON]: "Salon, forum ou job dating", [TYPE.AUTRE]: "Autre" },
  pieceDescriptions: {
    [TYPE.SALON]: "Un compte rendu de votre visite.",
    [TYPE.AUTRE]: "Tout document.",
  },
};

function createDemarche(
  id: string,
  typeDemarche: Type,
  precisionTypeDemarche = "",
): Demarche<Type> {
  return { id, typeDemarche, precisionTypeDemarche, apportDemarche: "", piecesJustificatives: [] };
}

describe("findDemarchesDisplay", () => {
  it("ne montre rien sans « oui » à la question du volet", () => {
    expect(findDemarchesDisplay(undefined, 0)).toBe(DEMARCHES_DISPLAY.HIDDEN);
    expect(findDemarchesDisplay(OUI_NON.NON, 0)).toBe(DEMARCHES_DISPLAY.HIDDEN);
  });

  it("montre le texte vide après un « oui » tant qu'aucune démarche n'est validée", () => {
    expect(findDemarchesDisplay(OUI_NON.OUI, 0)).toBe(DEMARCHES_DISPLAY.EMPTY);
  });

  it("montre les documents dès la première démarche validée", () => {
    expect(findDemarchesDisplay(OUI_NON.OUI, 1)).toBe(DEMARCHES_DISPLAY.DOCUMENTS);
  });
});

describe("listDocumentsDemarches", () => {
  it("donne à chaque démarche le titre de sa carte et la description de son type, dans l'ordre", () => {
    const salon = createDemarche("1", TYPE.SALON);
    const autre = createDemarche("2", TYPE.AUTRE, "Forum en ligne");

    expect(listDocumentsDemarches([salon, autre], TEXTS)).toEqual([
      {
        demarche: salon,
        title: "Salon, forum ou job dating",
        description: "Un compte rendu de votre visite.",
      },
      { demarche: autre, title: "Forum en ligne", description: "Tout document." },
    ]);
  });
});

describe("formatEmptyDemarchesHint", () => {
  it("nomme le volet où valider une démarche", () => {
    expect(formatEmptyDemarchesHint("Mon projet")).toBe(
      "Dès qu’une démarche est validée dans la section «\u00a0Mon projet\u00a0», elle apparaît ici et vous pouvez y ajouter vos justificatifs.",
    );
  });
});

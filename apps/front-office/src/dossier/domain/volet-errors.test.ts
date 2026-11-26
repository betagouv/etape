import { describe, expect, it } from "vitest";

import { formatVoletErrorsTitle, listVoletErrors } from "./volet-errors";

describe("listVoletErrors", () => {
  it("liste les erreurs dans l'ordre des champs contrôlés, pas dans celui où elles arrivent", () => {
    const errors = { telephone: { message: "Téléphone" }, cleNir: { message: "Clé" } };

    expect(listVoletErrors(["civilite", "cleNir", "telephone"], errors)).toEqual([
      { fieldId: "cleNir", message: "Clé" },
      { fieldId: "telephone", message: "Téléphone" },
    ]);
  });

  it("laisse de côté une erreur qui ne porte pas sur un champ contrôlé", () => {
    const errors = { dateDemission: { message: "Date" }, root: { message: "Serveur" } };

    expect(listVoletErrors(["demission"], errors)).toEqual([]);
  });

  it("liste l'erreur d'un champ imbriqué sous son chemin, qui est aussi l'`id` du champ", () => {
    const errors = {
      currentDemarche: { apportDemarche: { message: "Apport" } },
      quotidienMetier: { message: "Quotidien" },
    };
    const fields = [
      "currentDemarche.typeDemarche",
      "currentDemarche.apportDemarche",
      "quotidienMetier",
    ];

    expect(listVoletErrors(fields, errors)).toEqual([
      { fieldId: "currentDemarche.apportDemarche", message: "Apport" },
      { fieldId: "quotidienMetier", message: "Quotidien" },
    ]);
  });

  it("garde une erreur sans message, avec un texte vide", () => {
    expect(listVoletErrors(["civilite"], { civilite: {} })).toEqual([
      { fieldId: "civilite", message: "" },
    ]);
  });
});

describe("formatVoletErrorsTitle", () => {
  it("accorde le nombre d'erreurs", () => {
    expect(formatVoletErrorsTitle(1)).toBe("Le formulaire contient 1 erreur");
    expect(formatVoletErrorsTitle(3)).toBe("Le formulaire contient 3 erreurs");
  });
});

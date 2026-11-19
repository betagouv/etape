import { describe, expect, it } from "vitest";

import { requireFilled, type IssueContext } from "./require-filled";

const MESSAGES = {
  employeur: "Veuillez choisir votre employeur.",
  adresse: "Veuillez saisir l’adresse de votre employeur.",
  dateDemission: "Veuillez choisir la date de votre démission.",
} as const;

type FieldName = keyof typeof MESSAGES;

const ALL_FIELDS: readonly FieldName[] = ["employeur", "adresse", "dateDemission"];

/** Les erreurs signalées, sous la forme « champ : message ». */
function collectIssues(
  values: Partial<Record<FieldName, unknown>>,
  names: readonly FieldName[],
): string[] {
  const issues: string[] = [];
  const ctx: IssueContext = {
    addIssue: ({ path, message }) => issues.push(`${path.join(".")} : ${message}`),
  };
  requireFilled(ctx, values, names, MESSAGES);
  return issues;
}

describe("requireFilled", () => {
  it("signale chaque champ vide avec son message, dans l'ordre donné", () => {
    expect(
      collectIssues({ employeur: null, adresse: "", dateDemission: undefined }, ALL_FIELDS),
    ).toEqual([
      "employeur : Veuillez choisir votre employeur.",
      "adresse : Veuillez saisir l’adresse de votre employeur.",
      "dateDemission : Veuillez choisir la date de votre démission.",
    ]);
  });

  it("tient pour vide un champ absent ou fait d'espaces", () => {
    expect(collectIssues({ adresse: "  " }, ["adresse", "dateDemission"])).toEqual([
      "adresse : Veuillez saisir l’adresse de votre employeur.",
      "dateDemission : Veuillez choisir la date de votre démission.",
    ]);
  });

  it("ne signale rien pour un champ rempli, texte ou objet choisi", () => {
    expect(
      collectIssues({ employeur: { siret: "65201405100732" }, adresse: "1 rue de la Paix" }, [
        "employeur",
        "adresse",
      ]),
    ).toEqual([]);
  });

  it("ne regarde que les champs demandés", () => {
    expect(collectIssues({ employeur: null, adresse: "" }, ["adresse"])).toEqual([
      "adresse : Veuillez saisir l’adresse de votre employeur.",
    ]);
    expect(collectIssues({ employeur: null }, [])).toEqual([]);
  });
});

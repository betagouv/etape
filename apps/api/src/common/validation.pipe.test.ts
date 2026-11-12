import { BadRequestException, HttpStatus, type ArgumentMetadata } from "@nestjs/common";
import { searchEtablissements } from "@etape/api-contract";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createValidationPipe } from "./validation.pipe.js";

type Schema = NonNullable<ArgumentMetadata["schema"]>;
type Issue = { message: string; path?: readonly (PropertyKey | { key: PropertyKey })[] };

const pipe = createValidationPipe();

const TOO_LONG_SEARCH = "x".repeat(101);

/** Le corps attendu, strict : une clé en plus, comme la valeur reçue, le ferait échouer. */
const SearchErrorBodySchema = z.strictObject({
  code: z.literal("ENTREE_INVALIDE"),
  erreurs: z
    .array(z.strictObject({ champ: z.literal("search"), message: z.string().min(1) }))
    .min(1),
});

function createMetadata(schema: Schema): ArgumentMetadata {
  return { type: "query", schema };
}

/** zod ne produit ni segment objet ni erreur sans chemin : ce schéma les renvoie tels quels. */
function createFailingSchema(issues: Issue[]): Schema {
  return { "~standard": { version: 1, vendor: "test", validate: () => ({ issues }) } };
}

async function catchException(value: unknown, schema: Schema): Promise<BadRequestException> {
  try {
    await pipe.transform(value, createMetadata(schema));
  } catch (error) {
    if (error instanceof BadRequestException) return error;
    throw error;
  }
  throw new Error("Le pipe a accepté l'entrée.");
}

describe("createValidationPipe, recherche d'établissements", () => {
  it.each([
    { label: "deux caractères", query: { search: "zq" }, received: "zq" },
    { label: "101 caractères", query: { search: TOO_LONG_SEARCH }, received: TOO_LONG_SEARCH },
    { label: "champ absent", query: {}, received: null },
    { label: "tableau", query: { search: ["dupont", "martin"] }, received: "dupont" },
  ])(
    "répond 400 ENTREE_INVALIDE sans reprendre la valeur : $label",
    async ({ query, received }) => {
      const exception = await catchException(query, searchEtablissements.query);

      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(() => SearchErrorBodySchema.parse(exception.getResponse())).not.toThrow();
      if (received !== null) {
        expect(JSON.stringify(exception.getResponse())).not.toContain(received);
      }
    },
  );

  it("laisse passer une entrée valide, nettoyée par le schéma", async () => {
    const metadata = createMetadata(searchEtablissements.query);

    await expect(pipe.transform({ search: "  acme  " }, metadata)).resolves.toEqual({
      search: "acme",
    });
  });
});

describe("createValidationPipe, nom du champ", () => {
  it("joint par un point les segments d'un chemin, indices compris", async () => {
    const schema = z.object({ etablissements: z.array(z.object({ siret: z.string() })) });

    const exception = await catchException({ etablissements: [{}] }, schema);

    expect(exception.getResponse()).toMatchObject({
      erreurs: [{ champ: "etablissements.0.siret" }],
    });
  });

  it("lit la clé d'un segment objet", async () => {
    const schema = createFailingSchema([
      { message: "Ville manquante.", path: [{ key: "adresse" }, "ville"] },
    ]);

    const exception = await catchException({}, schema);

    expect(exception.getResponse()).toEqual({
      code: "ENTREE_INVALIDE",
      erreurs: [{ champ: "adresse.ville", message: "Ville manquante." }],
    });
  });

  it("laisse le champ vide quand l'erreur n'a pas de chemin", async () => {
    const schema = createFailingSchema([{ message: "Entrée refusée." }]);

    const exception = await catchException({}, schema);

    expect(exception.getResponse()).toEqual({
      code: "ENTREE_INVALIDE",
      erreurs: [{ champ: "", message: "Entrée refusée." }],
    });
  });
});

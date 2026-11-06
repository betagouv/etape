import { BadRequestException, StandardSchemaValidationPipe } from "@nestjs/common";

/**
 * Valide toute entrée déclarée avec `{ schema }` par le schéma du contrat
 * (`architecture-api.md`, décision 4). Le corps d'erreur nomme les champs et
 * leurs messages, jamais la valeur reçue, qui peut être une donnée personnelle.
 */
export function createValidationPipe(): StandardSchemaValidationPipe {
  return new StandardSchemaValidationPipe({
    exceptionFactory: (issues) =>
      new BadRequestException({
        code: "ENTREE_INVALIDE",
        erreurs: issues.map(({ path = [], message }) => ({
          champ: path
            .map((segment) => String(typeof segment === "object" ? segment.key : segment))
            .join("."),
          message,
        })),
      }),
  });
}

import { baseConfig, NO_ENUM_RESTRICTION } from "@etape/eslint-config/base";
import { defineConfig, globalIgnores } from "eslint/config";

const ARCHITECTURE_DOC = "docs/conventions/architecture-api.md, décision 2";

/**
 * Le repository est la seule couche qui voit Prisma : ni le client
 * (`PrismaService`), ni les types générés, `import type` compris — un type de
 * ligne qui sort du repository emporte le schéma avec lui.
 *
 * En `regex` plutôt qu'en glob : les imports sont relatifs (`../../database/…`).
 */
const PRISMA_ONLY_IN_REPOSITORY = {
  patterns: [
    {
      regex: "(^|/)(database/prisma\\.service|generated/prisma/)",
      message: `Prisma ne s'utilise que dans un repository (*.prisma-repository.ts) : ${ARCHITECTURE_DOC}.`,
    },
  ],
};

/** La couche d'accès aux données s'appelle repository, et rien d'autre. */
const REPOSITORY_NAMING = {
  selector: "ClassDeclaration[id.name=/(Store|Dao|Gateway)$/]",
  message: `L'accès aux données est un repository : \`XRepository\` (abstraction), \`PrismaXRepository\` (implémentation) — ${ARCHITECTURE_DOC}.`,
};

/** `<module>.repository.ts` ne porte que l'abstraction ; l'implémentation vit à côté. */
const ABSTRACTION_ONLY = {
  selector: "ClassDeclaration[abstract!=true]",
  message: `Un *.repository.ts ne contient que la classe abstraite ; l'implémentation va dans <module>.prisma-repository.ts — ${ARCHITECTURE_DOC}.`,
};

export default defineConfig([
  globalIgnores(["src/generated/**"]),
  baseConfig,
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", PRISMA_ONLY_IN_REPOSITORY],
      // Redéclarer la règle remplace celle de la base : on reprend les `enum`.
      "no-restricted-syntax": ["error", NO_ENUM_RESTRICTION, REPOSITORY_NAMING],
    },
  },
  {
    files: ["src/**/*.repository.ts"],
    rules: {
      "no-restricted-syntax": ["error", NO_ENUM_RESTRICTION, REPOSITORY_NAMING, ABSTRACTION_ONLY],
    },
  },
  {
    files: ["src/**/*.prisma-repository.ts", "src/database/**/*.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  // Écarts connus, à retirer avec leur correction.
  {
    // #61 : extraire AccountService derrière un repository.
    files: ["src/account/account.service.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Revue de la PR #77 : SessionStore devient SessionRepository, en deux
    // fichiers, et son double de test FakeSessionRepository.
    files: ["src/auth/session/session.store.ts", "src/auth/session/session.service.test.ts"],
    rules: {
      "no-restricted-imports": "off",
      "no-restricted-syntax": ["error", NO_ENUM_RESTRICTION],
    },
  },
]);

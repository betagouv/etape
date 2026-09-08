import { baseConfig } from "@etape/eslint-config/base";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Client Prisma : régénéré à chaque build, et déjà marqué `@ts-nocheck`.
  globalIgnores(["src/generated/**"]),
  baseConfig,
]);

import { baseConfig } from "@etape/eslint-config/base";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["src/generated/**"]),
  baseConfig,
]);

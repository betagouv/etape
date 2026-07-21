import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { defineConfig } from "eslint/config";
import { baseConfig } from "./base.js";

/**
 * Configuration ESLint pour les librairies React internes (ex: packages/ui),
 * c'est-à-dire du code React qui ne tourne pas dans une application Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const reactInternalConfig = defineConfig([
  ...baseConfig,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    settings: {
      react: { version: "detect" },
    },
  },
  // Config flat officielle de react-hooks (enregistre le plugin + ses règles).
  pluginReactHooks.configs.flat.recommended,
]);

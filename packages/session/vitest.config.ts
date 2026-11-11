import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Rendu des composants et comportement clavier : il faut un DOM.
    environment: "jsdom",
  },
});

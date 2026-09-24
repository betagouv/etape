import { reactInternalConfig } from "@etape/eslint-config/react-internal";

export default [
  ...reactInternalConfig,
  {
    /*
     * Tout ceci est produit par Keycloakify à chaque build — le contexte
     * généré, les ressources de Keycloak copiées pour le mode développement, et
     * les artefacts. Ni relu, ni corrigé à la main.
     */
    ignores: [
      "src/kc.gen.tsx",
      "public/keycloakify-dev-resources/**",
      "dist/**",
      "dist_keycloak/**",
    ],
  },
];

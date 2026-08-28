import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    keycloakify({
      themeName: "etape",
      // Le thème « Account » (l'espace de gestion de compte de Keycloak) n'est
      // pas exposé aux usagers : le front d'ETAPE porte ces écrans.
      accountThemeImplementation: "none",
      /*
       * Keycloakify produit un JAR par tranche de versions ; nous n'en visons
       * qu'une, celle du `docker-compose.yml`.
       */
      keycloakVersionTargets: {
        "22-to-25": false,
        "all-other-versions": "etape-keycloak-theme.jar",
      },
      startKeycloakOptions: {
        // `keycloakify start-keycloak` réutilise le realm du dépôt : les écrans
        // se testent avec la vraie configuration, pas un realm de démonstration.
        realmJsonFilePath: "../../keycloak/realms/etape-realm.json",
      },
    }),
  ],
});

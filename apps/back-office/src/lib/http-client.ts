import { createHttpClient } from "@etape/api-client";

export const httpClient = createHttpClient(import.meta.env.VITE_API_BASE_URL, {
  // Provisoire : recharger la page repasse par la vérification de session.
  // À remplacer par la redirection Keycloak une fois l'authentification
  // branchée (apps/api, PR #16).
  onUnauthorized: () => window.location.reload(),
});

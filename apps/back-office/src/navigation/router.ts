import { AppErrorScreen } from "@etape/session";
import { createRouter } from "@tanstack/react-router";

import { API_BASE_URL, httpClient, queryClient } from "../lib/clients";
import { routeTree } from "./routes";

export const router = createRouter({
  routeTree,
  context: { apiBaseUrl: API_BASE_URL, httpClient, queryClient },
  // Sans lui, l'erreur d'un écran remonte à la route racine, qui remplace
  // `SessionLayout` — dialogue « Session expirée » compris. Posé sur chaque
  // route qui n'a pas le sien, il reste dans l'`Outlet`.
  defaultErrorComponent: AppErrorScreen,
});

// Permet à useNavigate/useParams d'inférer les routes de cette app plutôt
// que le type générique de la bibliothèque.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

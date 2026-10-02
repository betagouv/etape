import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routes";

export const router = createRouter({ routeTree });

// Permet à useNavigate/useParams d'inférer les routes de cette app plutôt
// que le type générique de la bibliothèque.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

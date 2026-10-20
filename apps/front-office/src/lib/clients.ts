import { createSessionClients } from "@etape/api-client";

/** Relative en production comme en local, où le proxy de Vite relaie `/api`. */
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Vide compte comme absente : `.env.example` liste la variable sans valeur.
if (!apiBaseUrl) {
  throw new Error(
    "VITE_API_BASE_URL n'est pas définie : récupérer le .env de l'app dans le coffre-fort de l'équipe (voir docs/authentification.md).",
  );
}

export const API_BASE_URL = apiBaseUrl;

export const { httpClient, queryClient } = createSessionClients(API_BASE_URL);

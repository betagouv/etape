import { createSessionClients } from "@etape/api-client";

/** Relative en production comme en local, où le proxy de Vite relaie `/api`. */
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (apiBaseUrl === undefined) {
  throw new Error(
    "VITE_API_BASE_URL n'est pas définie : copier .env.example en .env (voir docs/authentification.md).",
  );
}

export const API_BASE_URL = apiBaseUrl;

export const { httpClient, queryClient } = createSessionClients(API_BASE_URL);

import { createSessionClients } from "@etape/api-client";

/** Relative en production comme en local, où le proxy de Vite relaie `/api`. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const { httpClient, queryClient } = createSessionClients(API_BASE_URL);
